import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProgressStore, createProgressBackup, parseProgressBackup, resolveResumeSection,
  isValidProgress, DEFAULT_PROGRESS_KEY
} from '../apps/learner-web/progress-storage.js';

const memoryStorage = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return {
    store,
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); }
  };
};

test('preserves legacy key and learns latest snapshot, with an exact prior backup', () => {
  const storage = memoryStorage({ [DEFAULT_PROGRESS_KEY]: JSON.stringify({completed:['A1-1'],sectionCompleted:{}}) });
  const ps = createProgressStore(storage);
  assert.deepEqual(ps.load().data.completed,['A1-1']);
  assert.equal(ps.save({completed:['A1-1','A1-2'],sectionCompleted:{}}).ok,true);
  assert.deepEqual(JSON.parse(storage.getItem(ps.backupKey)).completed,['A1-1']);
  assert.deepEqual(ps.load().data.completed,['A1-1','A1-2']);
});
test('loads previous good when current is corrupt and refuses silent overwrite', () => {
  const storage = memoryStorage({
    [DEFAULT_PROGRESS_KEY]: '{not-json',
    [`${DEFAULT_PROGRESS_KEY}:previous-good`]: JSON.stringify({completed:['A1-1'],wordProgress:{}})
  });
  const ps = createProgressStore(storage);
  assert.equal(ps.load().source,'backup');
  assert.equal(ps.save({completed:['A1-2']}).error,'corrupt');
  assert.equal(storage.getItem(DEFAULT_PROGRESS_KEY),'{not-json');
  assert.equal(ps.save({completed:['A1-2']},{allowCorruptReplace:true}).ok,true);
  assert.deepEqual(ps.load().data.completed,['A1-2']);
});
test('does not destroy progress if browser blocks writes', () => {
  const storage = memoryStorage({[DEFAULT_PROGRESS_KEY]:JSON.stringify({completed:['A1-1']})});
  const original = storage.getItem(DEFAULT_PROGRESS_KEY);
  storage.setItem=()=>{ throw new Error('quota'); };
  const ps=createProgressStore(storage);
  assert.equal(ps.save({completed:['A1-2']}).ok,false);
  assert.equal(storage.getItem(DEFAULT_PROGRESS_KEY),original);
});
test('detects blocked reads instead of treating existing data as empty', () => {
  const ps=createProgressStore({getItem(){throw Error('denied')},setItem(){throw Error('denied')}});
  assert.equal(ps.load().source,'unavailable');
  assert.equal(ps.save({completed:[]}).ok,false);
});
test('round trip export and import with checksum and pair validation',()=>{
  const progress={completed:['A1-7'],sectionCompleted:{'A1-7':['foundation']},lastLessonId:'A1-7'};
  const backup=createProgressBackup(progress,{now:new Date('2026-10-27T08:00:00.000Z')});
  assert.deepEqual(parseProgressBackup(JSON.stringify(backup)),progress);
  const bad={...backup,progress:{completed:['A1-2']}};
  assert.throws(()=>parseProgressBackup(JSON.stringify(bad)),/checksum/i);
  assert.throws(()=>parseProgressBackup(JSON.stringify(backup),{pairId:'fa-de'}),/pair/i);
  assert.throws(()=>parseProgressBackup(JSON.stringify({random:'noise'})),/format/i);
  assert.deepEqual(parseProgressBackup(JSON.stringify({completed:['A1-1']})).completed,['A1-1']);
});
test('validates progress maps and never drops unknown activity states',()=>{
  assert.equal(isValidProgress({completed:12}),false);
  assert.equal(isValidProgress({sectionCompleted:[]}),false);
  assert.equal(isValidProgress({completed:['A1-1'],newFutureModule:{state:1}}),true);
});
test('resumes the last unfinished lesson section and skips completed sections',()=>{
  const lesson={sections:[{id:'foundation'},{id:'production'}]};
  const status={lastSectionByLesson:{'A1-1':'production'}};
  assert.equal(resolveResumeSection('A1-1',lesson,status,()=>[]),'production');
  assert.equal(resolveResumeSection('A1-1',lesson,status,()=>['production']),'foundation');
  assert.equal(resolveResumeSection('A1-1',lesson,{},()=>['foundation']),'production');
  assert.equal(resolveResumeSection('A1-1',null,{},()=>[]),'foundation');
});

test('rejects stale writes from a second tab to prevent accidental loss', () => {
  const storage=memoryStorage({[DEFAULT_PROGRESS_KEY]: JSON.stringify({completed:['A1-1']})});
  const first=createProgressStore(storage), second=createProgressStore(storage);
  first.load(); second.load();
  assert.equal(first.save({completed:['A1-1','A1-2']}).ok,true);
  assert.equal(second.save({completed:['A1-3']}).error,'conflict');
  assert.deepEqual(JSON.parse(storage.getItem(DEFAULT_PROGRESS_KEY)).completed,['A1-1','A1-2']);
});
