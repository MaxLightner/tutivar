import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {projectRoot} from '../tools/validate.mjs';
import {validateLessonFlow} from '../apps/learner-web/lesson-flow.js';
import {validateSentenceComposer,resolveSentenceComposer,composeSegments} from '../apps/learner-web/sentence-composer.js';
import {renderActivity} from '../apps/learner-web/lesson-modules.js';
import {auditLesson} from '../tools/audit-lessons.mjs';
import {inspectVocabularyContinuity} from '../tools/audit-vocabulary.mjs';

const pairRoot=join(projectRoot,'content/language-pairs/fa-en');
const load=(relative)=>JSON.parse(readFileSync(join(pairRoot,relative),'utf8'));
const curriculum=load('curriculum.a1.json');
const active=curriculum.stages.flatMap(stage=>stage.chapters).flatMap(chapter=>chapter.lessons).filter(entry=>entry?.status==='sample');
const lessons=active.map(entry=>load(entry.file));
const newer=lessons.slice(6,10);
const context=(lesson,progress={})=>({lessonId:lesson.id,index:0,e:String,en:String,i:()=>'',progress});
const activity=(lesson,id)=>lesson.sections.flatMap(s=>s.activities).find(a=>a.id===id);

test('A1-7..10 follow the canon and preserve workshop after 9, before the home chapter',()=>{
 const first=curriculum.stages[0].chapters[0].lessons;
 const second=curriculum.stages[0].chapters[1].lessons;
 const third=curriculum.stages[0].chapters[2].lessons;
 assert.deepEqual(second.slice(2,6).map(x=>x.id),['A1-7','A1-8','A1-9','A1-W1']);
 assert.deepEqual(third.map(x=>x.id),['A1-10','A1-11','A1-12','A1-W2']);
 assert.deepEqual(active.map(x=>x.id),Array.from({length:12},(_,i)=>`A1-${i+1}`));
 assert.ok(first.every(x=>x.status==='sample'));
 for(const number of [7,8,9])assert.ok(existsSync(join(pairRoot,`lessons/a1-${number}.json`)),`archived original A1-${number} must remain`);
});

test('four complete two-section courses pass the same production and content contracts as first six',()=>{
 assert.deepEqual(inspectVocabularyContinuity(lessons),[]);
 for(const lesson of newer){
  assert.deepEqual(validateLessonFlow(lesson),[],`${lesson.id}: lesson flow`);
  assert.deepEqual(auditLesson(lesson).errors,[],`${lesson.id}: expression practice audit`);
  assert.equal(lesson.roadmapRef.revision,'2026-10-25-owner-kitchen-verbs-a1');
  assert.ok(lesson.sections[0].activities.some(a=>a.type==='cumulative-scene-lab'));
  assert.ok(lesson.sections[0].activities.some(a=>a.type==='cumulative-visual-quest'));
  assert.ok(lesson.sections[0].activities.some(a=>a.type==='sentence-builder'&&a.goalCount>=5));
  assert.ok(lesson.sections[1].activities.some(a=>a.type==='dialogue'&&a.lines.length>=8));
  const composer=lesson.sections[0].activities.find(a=>a.type==='sentence-composer');
  assert.deepEqual(validateSentenceComposer(composer),[],`${lesson.id}: composer`);
  assert.ok(lesson.sections[1].activities.some(a=>a.type==='picture-description'));
  assert.ok(lesson.sections[1].activities.some(a=>a.type==='free-write'));
  const vocabulary=lesson.sections[0].activities.find(a=>a.type==='vocabulary');
  assert.ok(vocabulary.items.every(item=>item.examples.length===3));
  assert.ok(existsSync(join(projectRoot,'apps/learner-web',lesson.visual.src.replace(/^\.\//,''))));
  assert.ok(lesson.sections[1].activities.some(a=>a.type==='response-practice'&&a.tasks.length>=4),`${lesson.id} has deliberate transfer tasks`);
 }
});

test('A1-7 changes a single family member to a plural group, hair and height with the same art',()=>{
 const l=newer[0],lab=activity(l,'a1-7-live');
 const first=renderActivity(lab,context(l));
 assert.match(first,/My sister.*has.*long.*black.*hair/);
 assert.match(first,/data-cumulative-lab-field="subject"/);
 assert.match(first,/class="cumulative-illustration"/);
 const changed=renderActivity(lab,context(l,{cumulativeLabStates:{'A1-7:a1-7-live':{subject:2,style:2,color:1,height:1}}}));
 assert.match(changed,/My two sisters.*have.*curly.*brown.*hair/);
 assert.match(changed,/They are.*short/);
 assert.match(JSON.stringify(l.sections),/My three brothers have black hair/);
 assert.match(JSON.stringify(l.sections),/My sister has blue eyes/);
 const quest=activity(l,'a1-7-quest');
 assert.equal(quest.rounds.length,3);
 assert.match(renderActivity(quest,context(l)),/data-cumulative-quest-action="answer"/);
 assert.match(renderActivity(quest,context(l,{cumulativeQuestStates:{'A1-7:a1-7-quest':{round:0,answer:1}}})),/data-cumulative-quest-action="next"/);
});

test('A1-8 practices all numeric decades, 24/35/42, profile fields, language and study',()=>{
 const l=newer[1],wheel=activity(l,'a1-8-number-lab');
 assert.ok(wheel.numbers.some(n=>n.number===13));
 assert.ok(wheel.numbers.some(n=>n.number===100));
 for(const number of [24,35,42])assert.ok(wheel.numbers.some(n=>n.number===number));
 const initial=renderActivity(wheel,context(l));
 assert.match(initial,/I.*am thirteen years old/);
 assert.match(initial,/data-cumulative-number-index="/);
 const index=wheel.numbers.findIndex(n=>n.number===35);
 const shifted=renderActivity(wheel,context(l,{cumulativeLabStates:{'A1-8:a1-8-number-lab':{index,subject:1}}}));
 assert.match(shifted,/My sister.*is thirty-five years old/);
 const profile=activity(l,'a1-8-live');
 assert.match(renderActivity(profile,context(l)),/How old are you/);
 const changed=renderActivity(profile,context(l,{cumulativeLabStates:{'A1-8:a1-8-live':{topic:2,language:2,age:2}}}));
 assert.match(changed,/What language do you speak/);
 assert.match(changed,/I speak Japanese/);
 assert.match(changed,/32/);
 assert.match(changed,/شخصیت و اطلاعات نمونه/);
 for(const phrase of ['I study architecture.','I am a student.','My sister is nineteen years old.'])assert.ok(JSON.stringify(l.sections).includes(phrase));
});

test('A1-9 shows different feelings and agreement while offering useful empathy',()=>{
 const l=newer[2],lab=activity(l,'a1-9-live');
 assert.match(renderActivity(lab,context(l)),/I.*am.*happy/);
 const changed=renderActivity(lab,context(l,{cumulativeLabStates:{'A1-9:a1-9-live':{subject:3,feeling:4}}}));
 assert.match(changed,/My two sisters.*are.*thirsty/);
 assert.match(changed,/Have some water/);
 assert.match(changed,/aria-label="تشنه است"/);
 assert.match(JSON.stringify(l.sections),/I need water/);
 assert.match(JSON.stringify(l.sections),/I hope you feel better/);
});

test('A1-10 keeps furniture, count, color and room synchronized and handles zero',()=>{
 const l=newer[3],lab=activity(l,'a1-10-live'),defaultMarkup=renderActivity(lab,context(l));
 assert.match(defaultMarkup,/There are.*three.*blue.*chairs.*living room/);
 assert.match(defaultMarkup,/My house has.*two.*rooms/);
 const empty=renderActivity(lab,context(l,{cumulativeLabStates:{'A1-10:a1-10-live':{count:3}}}));
 assert.match(empty,/There are.*no.*blue.*chairs.*living room/);
 const one=renderActivity(lab,context(l,{cumulativeLabStates:{'A1-10:a1-10-live':{count:1,room:1,item:4,color:2,roomsCount:1}}}));
 assert.match(one,/There is.*one.*green.*bed.*bedroom/);
 assert.match(one,/My house has.*three.*rooms/);
 assert.match(one,/aria-label="1 bed در bedroom"/);
 const three=renderActivity(lab,context(l,{cumulativeLabStates:{'A1-10:a1-10-live':{count:0,room:0,item:0,color:0}}}));
 assert.match(three,/There are.*three.*blue.*chairs.*living room/);
 const composer=activity(l,'a1-10-composer');
 const resolved=resolveSentenceComposer(composer,{slots:{count:'one',object:'chair',color:'blue',room:'living'},pattern:'count-place'});
 assert.equal(composeSegments(resolved.pattern.segments,composer,resolved),'There is one blue chair in the living room.');
 assert.match(JSON.stringify(l.sections),/My two sisters are in the living room/);
 assert.match(JSON.stringify(l.sections),/There are no mirrors in the bathroom/);
});

test('A1-7..10 start production with ten or more distinct questions and four legitimate answer variants',()=>{
 for(const lesson of newer){
  const exchange=lesson.sections[1].activities[0];
  assert.equal(exchange.type,'exchange-lab');
  assert.ok(exchange.pairs.length>=10,lesson.id+' needs at least ten questions');
  assert.equal(new Set(exchange.pairs.map(pair=>pair.question.toLowerCase())).size,exchange.pairs.length);
  assert.ok(exchange.pairs.every(pair=>pair.variants.length>=4),lesson.id+' needs four options per question');
  for(const pair of exchange.pairs)assert.equal(new Set(pair.variants.map(variant=>variant.en.toLowerCase())).size,pair.variants.length);
  const screen=renderActivity(exchange,context(lesson));
  assert.match(screen,/exchange-navigation/);
  assert.match(screen,/exchange-progress/);
  assert.match(screen,/data-exchange-variant="3"/);
  assert.match(screen,/data-exchange-pair="1"/);
 }
});

test('A1-7 introduces body and appearance without relisting taught child/children, and reuses them in production',()=>{
 const lesson=newer[0],vocabulary=activity(lesson,'a1-7-vocabulary');
 assert.ok(vocabulary.items.filter(item=>item.role!=='supplementary').length>=20);
 for(const word of ['hand','nose','mouth','ear','kid','beautiful','slim','overweight','tongue','ugly','fat'])
  assert.ok(vocabulary.items.some(item=>item.en===word),'missing '+word);
 assert.equal(vocabulary.items.find(item=>item.en==='child'),undefined);
 assert.equal(vocabulary.items.find(item=>item.en==='ugly').role,'supplementary');
 assert.ok(activity(lesson,'a1-7-build').tasks.some(task=>task.example.includes('smile')));
 assert.ok(activity(lesson,'a1-7-warmup').tasks.some(task=>task.example.includes('nose')));
});

test('A1-8 explores question words then writes questions and switches a wide variety of subjects',()=>{
 const lesson=newer[1],explorer=activity(lesson,'a1-8-question-explorer');
 assert.ok(explorer.questions.length>=10);
 for(const phrase of ['What is your name?','How old are you?','What is your phone number?','What language do you speak?','What do you study?'])
  assert.ok(explorer.questions.some(question=>question.question===phrase));
 const screen=renderActivity(explorer,context(lesson));
 assert.match(screen,/question-explorer-stage/);
 assert.match(screen,/What is your name\?/);
 const changed=renderActivity(explorer,context(lesson,{questionExplorerStates:{'A1-8:a1-8-question-explorer':3}}));
 assert.match(changed,/What language do you speak\?/);
 const questionPractice=activity(lesson,'a1-8-question-practice');
 assert.ok(questionPractice.tasks.length>=8);
 const wheel=activity(lesson,'a1-8-number-lab');
 assert.ok(wheel.subjects.length>=10);
 for(const subject of ['I','You','My father','My sister','They','We'])
  assert.ok(wheel.subjects.some(entry=>entry.en===subject));
 const youIndex=wheel.subjects.findIndex(entry=>entry.en==='You');
 const you=renderActivity(wheel,context(lesson,{cumulativeLabStates:{'A1-8:a1-8-number-lab':{subject:youIndex}}}));
 assert.match(you,/You.*are thirteen years old/);
 assert.match(you,/data-cumulative-number-subject-index=/);
});
