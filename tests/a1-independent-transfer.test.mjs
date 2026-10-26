import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {projectRoot} from '../tools/validate.mjs';
import {renderActivity} from '../apps/learner-web/lesson-modules.js';
import {evaluateResponse} from '../apps/learner-web/practice-engine.js';
import {migrateLegacyProgress,TARGET_REVISION} from '../apps/learner-web/progress-migration.js';

const base=join(projectRoot,'content/language-pairs/fa-en');
const read=file=>JSON.parse(readFileSync(join(base,file),'utf8'));
const course=read('curriculum.a1.json');
const entries=course.stages.flatMap(stage=>stage.chapters).flatMap(chapter=>chapter.lessons).filter(row=>row.status==='sample');
const lessons=new Map(entries.map(entry=>[entry.id,read(entry.file)]));
const task=(id,type)=>lessons.get(id).sections.flatMap(section=>section.activities).find(activity=>activity.type===type);
const render=(id,activity,progress={})=>renderActivity(activity,{lessonId:id,index:1,e:String,en:String,i:()=>'',progress:{written:{},assessments:{},...progress}});

test('all 14 independent productions connect to a real-world recall cue and a two-clause proof',()=>{
  for(const [id,lesson] of lessons){
    const independent=task(id,'free-write');
    assert.ok(independent.realWorldMission?.cue?.length>8,id+' needs a specific real-world trigger');
    assert.ok(independent.realWorldMission?.reflection?.length>8,id+' needs an after-lesson recall');
    assert.ok(independent.assessment?.productionProof?.minClauses>=2,id+' must reject keyword fragments');
    assert.equal(evaluateResponse(independent.assessment,'read write school').ok,false,id);
    const html=render(id,independent);
    assert.match(html,/real-world-mission/);
    assert.match(html,/independent-hint/);
    assert.match(html,/Write your own sentences here/);
    assert.ok(!html.includes('placeholder="'+independent.placeholder+'"'),'independent textbox must not prefill the model answer');
  }
});

test('lesson eight requires numeric sentences rather than recognizable but empty frames',()=>{
  const assessment=task('A1-8','free-write').assessment;
  for(const gibberish of ['i have there are','I have there are. There are three books.','I have my books. There are several books.'])
    assert.equal(evaluateResponse(assessment,gibberish).ok,false,gibberish);
  assert.equal(evaluateResponse(assessment,'I have twenty books. There are thirty pens in the room.').ok,true);
});

test('lesson eleven checks complete school-action statements, not merely three verbs and nouns',()=>{
  const assessment=task('A1-11','free-write').assessment;
  assert.equal(evaluateResponse(assessment,'read write school').ok,false);
  assert.equal(evaluateResponse(assessment,'I read a book. My sister writes at school.').ok,true);
});

test('independent writing accepts varied real-life replies instead of requiring a copied model dialogue',()=>{
  const examples={
    'A1-1':'Hello. My name is Sara. How are you?',
    'A1-2':'This is my mother. Her name is Mina. Who is this? I am a daughter.',
    'A1-3':'This is my cup. I have a pen. Do you have a phone?',
    'A1-4':'How many books are there? There are five books. My sister has two pens.',
    'A1-6':'This is my red bag. It is small and wooden.',
    'A1-10':'My house has two rooms. There is one bed in my room.',
    'A1-12':'How are you? I am happy today. She is tired.',
    'A1-13':'I drink water. I want rice. Do you eat bread?',
    'A1-14':'I eat rice with my sister for lunch. Can you pass me water, please?'
  };
  for(const [id,reply] of Object.entries(examples)){
    const result=evaluateResponse(task(id,'free-write').assessment,reply);
    assert.equal(result.ok,true,`${id}: ${result.feedback||''} (${reply})`);
  }
});

test('lesson seven allows adjective comparison with two synchronised illustrations',()=>{
  const lab=task('A1-7','antonym-pair-lab');
  assert.ok(lab);
  assert.equal(lab.pairs.length,5);
  const first=render('A1-7',lab);
  assert.match(first,/tall/);
  assert.match(first,/short/);
  assert.equal((first.match(/class="antonym-portrait"/g)||[]).length,2);
  assert.match(first,/data-opposite-index="4"/);
  const changed=render('A1-7',lab,{oppositeChoices:{'A1-7:a1-7-antonym-pairs':2}});
  assert.match(changed,/curly/);
  assert.match(changed,/straight/);
  assert.notEqual(first,changed);
  assert.match(changed,/به ظاهر آدم‌ها/);
  const independent=task('A1-7','free-write').assessment;
  assert.equal(evaluateResponse(independent,'My sister has curly hair. My brothers are tall.').ok,true);
  assert.equal(evaluateResponse(independent,'long brown hair curly black hair two sisters').ok,false);
});

test('four-digit answer is not exposed through spoken preview before the learner answers',()=>{
  const lab=task('A1-8','place-value-lab');
  const before=render('A1-8',lab,{placeValueStates:{'A1-8:a1-8-place-values':{digits:4,value:2407}}});
  assert.match(before,/پاسخ این بخش تا پایان آزمون پنهان است/);
  assert.doesNotMatch(before,/I have two thousand four hundred seven books/);
  const after=render('A1-8',lab,{placeValueStates:{'A1-8:a1-8-place-values':{digits:4,value:2407,answer:0}}});
  assert.match(after,/I have two thousand four hundred seven books/);
});

test('reordering 10–12 moves all saved progress without clearing completed sections',()=>{
  const earlier={
    curriculumRevision:'a1-owner-twelve-per-stage-2026-10-26',
    completed:['A1-10','A1-11','A1-12','A1-13'],
    sectionCompleted:{'A1-10':['foundation','production'],'A1-11':['production'],'A1-12':['foundation']},
    written:{'A1-10':'I am happy.','A1-11':'There is a bed.','A1-12':'I read at school.'},
    assessments:{'A1-10:a1-9-independent':{passed:true}},
    leitnerAdded:[{lessonId:'A1-10',word:'tired'}]
  };
  const migrated=migrateLegacyProgress(earlier);
  assert.equal(migrated.curriculumRevision,TARGET_REVISION);
  assert.deepEqual(new Set(migrated.completed),new Set(['A1-10','A1-11','A1-12','A1-13']));
  assert.deepEqual(migrated.sectionCompleted['A1-12'],['foundation','production']);
  assert.deepEqual(migrated.sectionCompleted['A1-10'],['production']);
  assert.deepEqual(migrated.sectionCompleted['A1-11'],['foundation']);
  assert.equal(migrated.written['A1-12'],'I am happy.');
  assert.equal(migrated.written['A1-10'],'There is a bed.');
  assert.equal(migrated.written['A1-11'],'I read at school.');
  assert.ok(migrated.assessments['A1-12:a1-9-independent']);
  assert.equal(migrated.leitnerAdded[0].lessonId,'A1-12');
  assert.ok(migrated.legacyCurriculum['oct-2026-before-home-school-feelings']);
  assert.deepEqual(migrateLegacyProgress(migrated),migrated);
});
