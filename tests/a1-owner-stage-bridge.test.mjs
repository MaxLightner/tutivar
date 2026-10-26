import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {projectRoot} from '../tools/validate.mjs';
import {validateLessonFlow} from '../apps/learner-web/lesson-flow.js';
import {renderActivity} from '../apps/learner-web/lesson-modules.js';
import {migrateLegacyProgress,TARGET_REVISION} from '../apps/learner-web/progress-migration.js';
import {inspectCorePracticeCoverage} from '../tools/audit-vocabulary.mjs';

const root=join(projectRoot,'content/language-pairs/fa-en');
const read=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const course=read('curriculum.a1.json');
const entries=course.stages.flatMap(s=>s.chapters).flatMap(c=>c.lessons).filter(x=>x.status==='sample');
const lessons=new Map(entries.map(e=>[e.id,read(e.file)]));
const activity=(id,activityId)=>lessons.get(id).sections.flatMap(s=>s.activities).find(a=>a.id===activityId);
const context=(id,progress={})=>({lessonId:id,index:0,e:String,en:String,i:()=>'',progress});

test('owner sequence ends stage one with study and begins stage two with two food lessons',()=>{
  assert.deepEqual(entries.map(x=>x.id),Array.from({length:14},(_,i)=>`A1-${i+1}`));
  assert.equal(entries.find(x=>x.id==='A1-12').file,'lessons/a1-12-v2.json');
  assert.equal(entries.find(x=>x.id==='A1-13').file,'lessons/a1-13-v1.json');
  assert.equal(entries.find(x=>x.id==='A1-14').file,'lessons/a1-14-v1.json');
  assert.equal(course.stages[0].chapters.flatMap(c=>c.lessons).filter(x=>x.id==='A1-13').length,0);
  assert.deepEqual(course.stages[1].chapters.flatMap(c=>c.lessons).slice(0,2).map(x=>x.id),['A1-13','A1-14']);
  for(const lesson of lessons.values())assert.deepEqual(validateLessonFlow(lesson),[],lesson.id);
  assert.deepEqual(inspectCorePracticeCoverage([...lessons.values()]),[]);
});

test('foundation introduces, combines and applies usable language in the new bridge lessons',()=>{
  for(const id of ['A1-8','A1-12']){
    const [shadow,words,expressions,meanings]=lessons.get(id).sections[0].activities;
    assert.deepEqual([shadow.type,words.type,expressions.type,meanings.type],['shadowing','vocabulary','expression-study','meaning-cluster']);
    assert.equal(expressions.presentation,'deck');
    assert.ok(words.items.every(x=>x.role==='supplementary'||x.examples?.length===3));
    assert.ok(lessons.get(id).sections[0].activities.some(x=>x.type==='sentence-composer'));
    assert.ok(lessons.get(id).sections[0].activities.some(x=>x.type==='sentence-builder'));
    assert.equal(lessons.get(id).sections[1].activities[0].type,'exchange-lab');
  }
});

test('A1-5 compares independent ball and apple prepositions side by side',()=>{
  const module=activity('A1-5','places-spatial-lab');
  assert.equal(module.type,'spatial-compare-lab');
  const first=renderActivity(module,context('A1-5'));
  assert.match(first,/The ball is/);
  assert.match(first,/The apple is/);
  assert.match(first,/data-spatial-side="left"/);
  assert.match(first,/data-spatial-side="right"/);
  const changed=renderActivity(module,context('A1-5',{spatialChoices:{'A1-5:places-spatial-lab':{left:'under',right:'behind'}}}));
  assert.match(changed,/The ball is.*under.*the box/);
  assert.match(changed,/The apple is.*behind.*the box/);
});

test('A1-8 changes both quantities and the counted object; A1-12 changes action and sentence form',()=>{
  const numbers=activity('A1-8','a1-8-quantities');
  assert.ok(numbers.numbers.some(x=>x.number===100));
  const before=renderActivity(numbers,context('A1-8'));
  assert.match(before,/I have thirteen/);
  const changed=renderActivity(numbers,context('A1-8',{cumulativeLabStates:{'A1-8:a1-8-quantities':{index:numbers.numbers.findIndex(x=>x.number===30),subject:1}}}));
  assert.match(changed,/I have thirty/);
  assert.notEqual(before,changed);
  const school=activity('A1-12','a1-12-action-lab');
  assert.equal(school.mode,'school');
  assert.match(renderActivity(school,context('A1-12')),/I read/);
  const question=renderActivity(school,context('A1-12',{cumulativeLabStates:{'A1-12:a1-12-action-lab':{subject:2,verb:1,form:2}}}));
  assert.match(question,/Does my sister/);
});

test('previous food study and user progress shift to A1-13/14 without losing saved answers',()=>{
  const prior={curriculumRevision:'a1-cumulative-owner-2026-10',completed:['A1-3','A1-4','A1-11','A1-12'],sectionCompleted:{'A1-11':['foundation'],'A1-12':['production']},cumulativeLabStates:{'A1-11:a1-11-menu-lab':{item:2}},leitnerAdded:[{lessonId:'A1-12',word:'with'}]};
  const next=migrateLegacyProgress(prior);
  assert.equal(next.curriculumRevision,TARGET_REVISION);
  assert.deepEqual(next.completed,['A1-4','A1-3','A1-13','A1-14']);
  assert.deepEqual(next.sectionCompleted['A1-13'],['foundation']);
  assert.deepEqual(next.sectionCompleted['A1-14'],['production']);
  assert.deepEqual(next.cumulativeLabStates['A1-13:a1-11-menu-lab'],{item:2});
  assert.equal(next.leitnerAdded[0].lessonId,'A1-14');
  assert.ok(next.legacyCurriculum['oct-2026-before-twelve-per-stage']);
  assert.deepEqual(migrateLegacyProgress(next),next);
});
