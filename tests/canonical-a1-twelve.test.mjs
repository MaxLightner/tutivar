import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {projectRoot} from '../tools/validate.mjs';
import {renderActivity} from '../apps/learner-web/lesson-modules.js';
import {validateLessonFlow} from '../apps/learner-web/lesson-flow.js';
import {validateSentenceComposer,resolveSentenceComposer,composeSegments,cycleComposerSlot} from '../apps/learner-web/sentence-composer.js';
import {auditLesson} from '../tools/audit-lessons.mjs';
import {inspectVocabularyContinuity} from '../tools/audit-vocabulary.mjs';

const root=join(projectRoot,'content/language-pairs/fa-en');
const read=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const course=read('curriculum.a1.json');
const entries=course.stages.flatMap(s=>s.chapters).flatMap(c=>c.lessons).filter(x=>/^A1-\d+$/.test(x.id));
const lesson11=read('lessons/a1-11-v1.json'),lesson12=read('lessons/a1-12-v1.json');
const activity=(lesson,id)=>lesson.sections.flatMap(s=>s.activities).find(a=>a.id===id);
const context=(lesson,progress={})=>({lessonId:lesson.id,index:0,e:String,en:String,i:()=>'',progress});

test('the official 36-slot A1 plan has three 12-lesson stages and food starts stage two',()=>{
 assert.deepEqual(entries.map(x=>x.id),Array.from({length:36},(_,i)=>`A1-${i+1}`));
 assert.deepEqual(course.stages.map(s=>s.chapters.flatMap(ch=>ch.lessons).filter(x=>/^A1-\d+$/.test(x.id)).length),[12,12,12]);
 assert.equal(entries.filter(x=>x.status==='sample').length,14);
 assert.equal(entries.find(x=>x.id==='A1-12').title,'مدرسه، مطالعه و فعالیت‌های ساده');
 assert.equal(entries.find(x=>x.id==='A1-13').title,'خوراکی‌ها و آشپزخانه');
 assert.equal(entries.find(x=>x.id==='A1-14').title,'وعده‌های اصلی و گفت‌وگو سر میز');
});

test('A1-11 and A1-12 obey the same two-section teaching and vocabulary contracts',()=>{
 const lessons=entries.filter(x=>x.status==='sample').map(x=>read(x.file));
 assert.deepEqual(inspectVocabularyContinuity(lessons),[]);
 for(const l of [lesson11,lesson12]){
  assert.deepEqual(validateLessonFlow(l),[],l.id);
  assert.deepEqual(auditLesson(l).errors,[],l.id);
  assert.deepEqual(l.sections.map(x=>x.id),['foundation','production']);
  assert.equal(l.roadmapRef.revision,'2026-10-25-owner-kitchen-verbs-a1');
  assert.ok(existsSync(join(projectRoot,'apps/learner-web',l.visual.src.replace(/^\.\//,''))));
  assert.ok(l.sections[0].activities.some(x=>x.type==='sentence-builder'&&x.sentences.length>=5));
  const explorer=l.sections[1].activities[0];
  assert.equal(explorer.type,'exchange-lab');
  assert.ok(explorer.pairs.length>=10);
  assert.ok(explorer.pairs.every(x=>x.variants.length===4));
  assert.ok(l.sections[1].activities.some(x=>x.type==='free-write'));
 }
});

test('A1-11 action verbs change naturally with person, negative and question forms',()=>{
 const composer=activity(lesson11,'a1-11-composer');
 assert.deepEqual(validateSentenceComposer(composer),[]);
 const sentence=(slots,pattern='statement')=>composeSegments(composer.patterns.find(x=>x.id===pattern).segments,composer,resolveSentenceComposer(composer,{slots,pattern}));
 assert.equal(sentence({subject:'i',verb:'eat'}),'I eat rice.');
 assert.equal(sentence({subject:'she',verb:'eat'}),'My sister eats rice.');
 assert.equal(sentence({subject:'he',verb:'cook',object:'soup'}),'My father cooks soup.');
 assert.equal(sentence({subject:'she',verb:'drink'},'negative'),"My sister doesn't drink water.");
 assert.equal(sentence({subject:'she',verb:'drink'},'question'),'Does my sister drink water?');
 const lab=activity(lesson11,'a1-11-verbs');
 assert.equal(lab.mode,'kitchen');
 assert.equal(lab.options.length,4);
 const exchange=activity(lesson11,'a1-11-exchange');
 assert.ok(exchange.pairs.length>=18,'practice must combine kitchen verbs with menu transfer');
 assert.equal(exchange.pairs[0].question,'What do you eat at home?');
 assert.ok(exchange.pairs.slice(0,8).some(p=>p.question.includes('cook')));
 assert.equal(lesson11.sections[1].activities[0].id,'a1-11-exchange');
 assert.ok(lesson11.sections[1].activities.findIndex(x=>x.id==='a1-11-menu-lab')>0,'menu transfer follows verb questions');
 assert.ok(lesson11.sections[1].activities.findIndex(x=>x.id==='a1-11-kitchen-dialogue')<lesson11.sections[1].activities.findIndex(x=>x.id==='a1-11-dialogue'),'kitchen conversation comes first');
 assert.match(renderActivity(lab,context(lesson11)),/I eat rice/);
 assert.match(renderActivity(lab,context(lesson11,{cumulativeLabStates:{'A1-11:a1-11-verbs':{subject:2,verb:1,form:2}}})),/Does my sister drink water/);
 for(const word of ['cook','want','pot','pan','oven'])assert.ok(activity(lesson11,'a1-11-vocabulary').items.some(x=>x.en===word));
});

test('foundations 11 and 12 follow shadowing → words → deck → meaning → composer → forms → activity → construction',()=>{
 for(const [lesson,labId] of [[lesson11,'a1-11-verbs'],[lesson12,'a1-12-meal-lab']]){
  const items=lesson.sections[0].activities;
  const index=id=>items.findIndex(x=>x.id===id);
  assert.deepEqual(items.slice(0,2).map(x=>x.type),['shadowing','vocabulary']);
  assert.ok(index(`${lesson.id.toLowerCase()}-expressions`)<index(`${lesson.id.toLowerCase()}-meaning`));
  assert.ok(index(`${lesson.id.toLowerCase()}-meaning`)<index(`${lesson.id.toLowerCase()}-composer`));
  assert.ok(index(`${lesson.id.toLowerCase()}-composer`)<index(labId));
  assert.ok(index(labId)<index(`${lesson.id.toLowerCase()}-build`));
  const expressions=items.find(x=>x.type==='expression-study');
  assert.equal(expressions.presentation,'deck');
  const initial=renderActivity(expressions,context(lesson));
  assert.match(initial,/data-expression-key/);
  assert.match(initial,/عبارت بعدی/);
  const last=renderActivity(expressions,context(lesson,{expressionIndexes:{[`${lesson.id}:${expressions.id}`]:expressions.items.length-1}}));
  assert.match(last,/عبارت قبلی/);
  assert.ok(expressions.items.every(item=>item.examples?.length>=3));
  const meaning=items.find(x=>x.type==='meaning-cluster');
  assert.ok(meaning.concepts.length>=3);
  assert.ok(meaning.concepts.every(x=>x.forms.length>=2));
 }
});

test('lesson 11 independently changes subject, verb and meaningful compatible objects',()=>{
 const composer=activity(lesson11,'a1-11-composer');
 const sentence=(slots,pattern='statement')=>composeSegments(composer.patterns.find(x=>x.id===pattern).segments,composer,resolveSentenceComposer(composer,{slots,pattern}));
 assert.equal(sentence({subject:'she',verb:'cook',object:'chicken'}),'My sister cooks chicken.');
 assert.equal(sentence({subject:'i',verb:'drink',object:'tea'}),'I drink tea.');
 assert.equal(sentence({subject:'she',verb:'drink',object:'chicken'}),'My sister drinks water.','drinking must not produce a chicken sentence');
 assert.equal(sentence({subject:'we',verb:'want',object:'pizza'},'negative'),"We don't want pizza.");
 const next=cycleComposerSlot(composer,{slots:{subject:'he',verb:'cook',object:'soup'}},'object');
 assert.equal(next.slots.object,'pizza','a new food option is available without changing the verb');
 assert.ok(activity(lesson11,'a1-11-meaning').concepts.some(x=>x.id==='hunger'));
});

test('lesson 12 teaches and/with/without, flavors and actual drink/eat conjugations',()=>{
 const composer=activity(lesson12,'a1-12-composer');
 assert.deepEqual(validateSentenceComposer(composer),[]);
 const sentence=(slots,pattern='eat')=>composeSegments(composer.patterns.find(x=>x.id===pattern).segments,composer,resolveSentenceComposer(composer,{slots,pattern}));
 assert.equal(sentence({person:'i',food:'eggs-and-cheese',meal:'breakfast'}),'I eat eggs and cheese for breakfast.');
 assert.equal(sentence({person:'i',food:'eggs-with-cheese',meal:'breakfast'}),'I eat eggs with cheese for breakfast.');
 assert.equal(sentence({person:'sister',food:'coffee-with-sugar',meal:'breakfast'}),'My sister drinks coffee with sugar for breakfast.');
 assert.equal(sentence({person:'sister',food:'coffee-without-sugar',meal:'breakfast'},'negative'),"My sister doesn't drink coffee without sugar for breakfast.");
 assert.equal(sentence({person:'you',food:'coffee-with-sugar',meal:'breakfast'},'question'),'Do you drink coffee with sugar for breakfast?');
 const lab=activity(lesson12,'a1-12-meal-lab');
 const render=state=>renderActivity(lab,context(lesson12,{cumulativeLabStates:{'A1-12:a1-12-meal-lab':state}}));
 assert.match(render({item:0,food:0,connector:1}),/I eat eggs and cheese for breakfast/);
 assert.match(render({item:0,food:0,connector:2}),/I eat eggs with cheese for breakfast/);
 assert.match(render({item:0,food:1,connector:1,subject:2}),/My sister drinks coffee with sugar for breakfast/);
 assert.match(render({item:1,food:1,connector:1,subject:4,form:2}),/Do you eat kebab with soda for lunch/);
 for(const word of ['full','sweet','salty','spicy','sour','kebab','soda'])assert.ok(activity(lesson12,'a1-12-vocabulary').items.some(x=>x.en===word));
 const prompts=activity(lesson12,'a1-12-warmup').tasks.map(x=>x.hint).join(' ');
 assert.match(prompts,/Do you eat kebab with soda/);
 assert.match(prompts,/Do you drink coffee with sugar/);
 assert.match(prompts,/eggs and cheese/);
 assert.match(prompts,/eggs with cheese/);
});

test('A1-11 menu and A1-12 meals are interactive and use earlier number/family knowledge',()=>{
 const menu=activity(lesson11,'a1-11-menu-lab');
 assert.match(renderActivity(menu,context(lesson11)),/I would like 1 soup/);
 assert.match(renderActivity(menu,context(lesson11,{cumulativeLabStates:{'A1-11:a1-11-menu-lab':{item:1,quantity:2}}})),/2 sandwiches/);
 assert.match(renderActivity(menu,context(lesson11,{cumulativeLabStates:{'A1-11:a1-11-menu-lab':{item:1,quantity:2}}})),/\$14/);
 const meals=activity(lesson12,'a1-12-meal-lab');
 assert.match(renderActivity(meals,context(lesson12)),/I eat eggs for breakfast/);
 assert.match(renderActivity(meals,context(lesson12,{cumulativeLabStates:{'A1-12:a1-12-meal-lab':{item:1,subject:2}}})),/My sister eats rice for lunch/);
 assert.ok(activity(lesson12,'a1-12-independent').prompt.includes('صبحانه'));
});
