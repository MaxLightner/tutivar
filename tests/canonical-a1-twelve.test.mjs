import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {projectRoot} from '../tools/validate.mjs';
import {renderActivity} from '../apps/learner-web/lesson-modules.js';
import {validateLessonFlow} from '../apps/learner-web/lesson-flow.js';
import {validateSentenceComposer,resolveSentenceComposer,composeSegments} from '../apps/learner-web/sentence-composer.js';
import {auditLesson} from '../tools/audit-lessons.mjs';
import {inspectVocabularyContinuity} from '../tools/audit-vocabulary.mjs';

const root=join(projectRoot,'content/language-pairs/fa-en');
const read=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const course=read('curriculum.a1.json');
const entries=course.stages.flatMap(s=>s.chapters).flatMap(c=>c.lessons).filter(x=>/^A1-\d+$/.test(x.id));
const lesson11=read('lessons/a1-11-v1.json'),lesson12=read('lessons/a1-12-v1.json');
const activity=(lesson,id)=>lesson.sections.flatMap(s=>s.activities).find(a=>a.id===id);
const context=(lesson,progress={})=>({lessonId:lesson.id,index:0,e:String,en:String,i:()=>'',progress});

test('the official 34-slot A1 plan is grouped 1-12, 13-20, 21-34 without duplicated or missing IDs',()=>{
 assert.deepEqual(entries.map(x=>x.id),Array.from({length:34},(_,i)=>`A1-${i+1}`));
 assert.deepEqual(course.stages.map(s=>s.chapters.flatMap(ch=>ch.lessons).filter(x=>/^A1-\d+$/.test(x.id)).length),[12,8,14]);
 assert.equal(entries.filter(x=>x.status==='sample').length,12);
 assert.equal(entries.find(x=>x.id==='A1-11').title,'خوراکی‌ها و آشپزخانه');
 assert.equal(entries.find(x=>x.id==='A1-12').title,'وعده‌های اصلی و گفت‌وگو سر میز');
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
 assert.equal(sentence({subject:'he',verb:'cook'}),'My father cooks soup.');
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
