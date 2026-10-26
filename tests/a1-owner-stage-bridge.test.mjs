import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {projectRoot} from '../tools/validate.mjs';
import {validateLessonFlow} from '../apps/learner-web/lesson-flow.js';
import {renderActivity,numberToEnglish} from '../apps/learner-web/lesson-modules.js';
import {resolveSentenceComposer,composeSegments} from '../apps/learner-web/sentence-composer.js';
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

test('A1-8 teaches place values and four-digit reading; A1-12 separates pronouns and family ownership',()=>{
  const numbers=activity('A1-8','a1-8-place-values');
  assert.equal(numbers.type,'place-value-lab');
  assert.equal(numbers.challenges.length,4);
  const before=renderActivity(numbers,context('A1-8'));
  assert.match(before,/I have thirteen/);
  assert.match(before,/data-place-action="increment"/);
  assert.match(before,/data-place-action="step"/);
  const changed=renderActivity(numbers,context('A1-8',{placeValueStates:{'A1-8:a1-8-place-values':{digits:2,value:36}}}));
  assert.match(changed,/I have thirty-six/);
  assert.notEqual(before,changed);
  const extended=renderActivity(numbers,context('A1-8',{placeValueStates:{'A1-8:a1-8-place-values':{digits:4,value:2407}}}));
  assert.match(extended,/two thousand four hundred seven/);
  assert.match(extended,/به نظرت عدد/);
  const school=activity('A1-12','a1-12-action-lab');
  assert.equal(school.mode,'school');
  assert.match(renderActivity(school,context('A1-12')),/I read/);
  const question=renderActivity(school,context('A1-12',{cumulativeLabStates:{'A1-12:a1-12-action-lab':{subject:2,verb:1,form:2}}}));
  assert.match(question,/Does he write/);
  const owner=renderActivity(school,context('A1-12',{cumulativeLabStates:{'A1-12:a1-12-action-lab':{subject:3,owner:1,relative:0}}}));
  assert.match(owner,/She reads/);
  assert.match(owner,/Your sister reads/);
  assert.match(owner,/data-daily-choice-field="owner"/);
  assert.match(owner,/data-daily-choice-field="relative"/);
});

test('place-value lab reads every transition, exact tens, hundreds, thousands and checks four-digit answers',()=>{
  for(const [value,expected] of [[13,'thirteen'],[19,'nineteen'],[20,'twenty'],[21,'twenty-one'],[40,'forty'],[99,'ninety-nine'],[100,'one hundred'],[101,'one hundred one'],[146,'one hundred forty-six'],[1000,'one thousand'],[2407,'two thousand four hundred seven'],[9074,'nine thousand seventy-four']])
    assert.equal(numberToEnglish(value),expected,String(value));
  const activityId='a1-8-place-values',lab=activity('A1-8',activityId),key=`A1-8:${activityId}`;
  const render=(state)=>renderActivity(lab,context('A1-8',{placeValueStates:{[key]:state}}));
  assert.match(render({digits:2,value:19}),/nineteen/);
  assert.match(render({digits:2,value:20}),/twenty/);
  assert.match(render({digits:3,value:146}),/one hundred forty-six/);
  const challenge=render({digits:4,value:2407,challenge:0,answer:0});
  assert.match(challenge,/درست است/);
  assert.match(challenge,/data-place-action="next-question"/);
  assert.match(render({digits:4,value:2407,challenge:0,answer:1}),/دوباره انتخاب کن/);
});

test('school sentence grammar conjugates singular pronouns and separates pronoun actor from family names',()=>{
  const source=activity('A1-12','a1-12-composer');
  const say=(subject,verb,pattern='statement')=>{
    const resolved=resolveSentenceComposer(source,{slots:{subject,verb},pattern});
    return composeSegments(resolved.pattern.segments,source,resolved);
  };
  assert.equal(say('i','read'),'I read a book.');
  assert.equal(say('you','read'),'You read a book.');
  assert.equal(say('he','read'),'He reads a book.');
  assert.equal(say('she','study'),'She studies English.');
  assert.equal(say('it','go'),'It goes to school.');
  assert.equal(say('she','write','negative'),"She doesn't write a note.");
  assert.equal(say('he','go','question'),'Does he go to school?');
  const family=renderActivity(activity('A1-12','a1-12-action-lab'),context('A1-12',{cumulativeLabStates:{'A1-12:a1-12-action-lab':{subject:4,owner:2,relative:1,verb:1,form:2}}}));
  assert.match(family,/Does it write a note/);
  assert.match(family,/Does his brother write a note/);
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
