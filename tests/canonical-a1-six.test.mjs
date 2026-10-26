import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {projectRoot} from '../tools/validate.mjs';
import {validateLessonFlow} from '../apps/learner-web/lesson-flow.js';
import {validateSentenceComposer,resolveSentenceComposer,composeSegments} from '../apps/learner-web/sentence-composer.js';
import {renderActivity} from '../apps/learner-web/lesson-modules.js';
import {migrateLegacyProgress,TARGET_REVISION} from '../apps/learner-web/progress-migration.js';
import {inspectVocabularyContinuity} from '../tools/audit-vocabulary.mjs';
import {auditLesson} from '../tools/audit-lessons.mjs';
const root=join(projectRoot,'content/language-pairs/fa-en');
const load=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const active=load('curriculum.a1.json').stages.flatMap(s=>s.chapters).flatMap(c=>c.lessons)
  .filter(x=>x?.status==='sample');
test('live click dispatcher reaches every cumulative visual practice control',()=>{
 const code=readFileSync(join(projectRoot,'apps/learner-web/app.js'),'utf8');
 const selector=code.match(/function onClick\(event\)\s*\{\s*const el\s*=\s*event\.target\.closest\('([^']+)'\)/)?.[1];
 assert.ok(selector,'cannot locate delegated click selectors');
 for(const key of ['attribute-key','count-scene-key','feature-hunt-key','count-math-key','plural-lab-key','cumulative-lab-key','cumulative-quest-key','cumulative-number-key'])
   assert.ok(selector.includes(`button[data-${key}]`),`click dispatcher omitted data-${key}`);
});
test('canonical A1 live curriculum follows approved outcomes through two food lessons in stage two',()=>{
 assert.deepEqual(active.map(x=>x.id),Array.from({length:24},(_,i)=>`A1-${i+1}`));
 assert.deepEqual(active.slice(2,6).map(x=>x.file),['lessons/a1-3-v5.json','lessons/a1-4-v5.json','lessons/a1-5-v4.json','lessons/a1-6-v5.json']);
 assert.equal(active[5].title,'توصیف ویژگی‌های اشیا');
 assert.deepEqual(inspectVocabularyContinuity(active.map(x=>load(x.file))),[]);
});

test('all earlier A1-3..6 lesson content remains in order; new exercises are additions',()=>{
 for(const [id,oldVersion,newVersion] of [[3,2,3],[4,2,3],[5,2,3],[6,3,4]]){
   const oldLesson=load(`lessons/a1-${id}-v${oldVersion}.json`);
   const newLesson=load(`lessons/a1-${id}-v${newVersion}.json`);
   for(let sectionIndex=0;sectionIndex<2;sectionIndex++){
     const oldIds=oldLesson.sections[sectionIndex].activities.map(x=>x.id);
     const newIds=newLesson.sections[sectionIndex].activities.map(x=>x.id);
     let previous=-1;
     for(const id of oldIds){const at=newIds.indexOf(id);assert.ok(at>previous,`${newLesson.id}: removed or reordered ${id}`);previous=at;}
   }
   assert.deepEqual(validateLessonFlow(newLesson),[]);
   assert.deepEqual(auditLesson(newLesson).errors,[]);
 }
});

test('A1-3 has a real count-and-answer activity with 1–12 objects and family members',()=>{
 const lesson=load('lessons/a1-3-v3.json'),activities=lesson.sections.flatMap(x=>x.activities);
 const explorer=activities.find(x=>x.id==='count-explore-1-to-12');
 const quiz=activities.find(x=>x.id==='count-real-quiz');
 assert.ok(explorer.objects.some(o=>o.id==='sister'));
 assert.ok(quiz.rounds.some(r=>r.count===12));
 const ctx={lessonId:'A1-3',index:0,e:String,en:String,i:()=>'',progress:{}};
 const twelve=renderActivity(explorer,{...ctx,progress:{countSceneStates:{'A1-3:count-explore-1-to-12':{count:12,object:0}}}});
 assert.equal((twelve.match(/class="count-object-picture"/g)||[]).length,12);
 assert.match(twelve,/There are/);
 assert.match(twelve,/twelve/);
 const question=renderActivity(quiz,ctx);
 assert.match(question,/How many books are there/);
 assert.match(question,/data-count-scene-action="answer"/);
});

test('A1-4 gives all twelve numbers and forms four-books/six-pens sentences',()=>{
 const lesson=load('lessons/a1-4-v3.json');
 const activities=lesson.sections.flatMap(s=>s.activities);
 const lab=activities.find(x=>x.id==='ownership-compare-tap');
 assert.equal(lab.options.count.length,12);
 assert.ok(lab.options.noun.some(n=>n.id==='pen'));
 const ctx={lessonId:'A1-4',index:0,e:String,en:String,i:()=>'',progress:{}};
 const four=renderActivity(lab,{...ctx,progress:{attributeChoices:{'A1-4:ownership-compare-tap':{count:3,noun:0}}}});
 const six=renderActivity(lab,{...ctx,progress:{attributeChoices:{'A1-4:ownership-compare-tap':{count:5,noun:1}}}});
 assert.match(four,/I have.*four.*books/);
 assert.match(six,/I have.*six.*pens/);
 assert.match(four,/data-attribute-select-value="11"/);
 const text=JSON.stringify(activities);
 assert.ok(text.includes('I have four books.'));
 assert.ok(text.includes('I have six pens.'));
});

test('A1-5 has counted spatial scenes for books on table and sisters in room',()=>{
 const lesson=load('lessons/a1-5-v3.json'),activities=lesson.sections.flatMap(s=>s.activities);
 const lab=activities.find(x=>x.id==='places-count-live');
 const ctx={lessonId:'A1-5',index:0,e:String,en:String,i:()=>'',progress:{}};
 const books=renderActivity(lab,ctx);
 const sisters=renderActivity(lab,{...ctx,progress:{countSceneStates:{'A1-5:places-count-live':{object:2,count:2}}}});
 assert.match(books,/There are.*three.*books.*on the table/);
 assert.match(sisters,/There are.*two.*sisters.*in the room/);
 assert.equal((sisters.match(/class="count-object-picture"/g)||[]).length,2);
 assert.ok(JSON.stringify(activities).includes('There are two sisters in the room.'));
});

test('A1-6 has a visual search mission with increasing adjective complexity',()=>{
 const lesson=load('lessons/a1-6-v4.json');
 const hunt=lesson.sections[0].activities.find(x=>x.id==='a1-6-feature-hunt');
 assert.equal(hunt.rounds.length,5);
 assert.ok(hunt.rounds.some(round=>round.prompt==='Find two small red books.'));
 const ctx={lessonId:'A1-6',index:0,e:String,en:String,i:()=>'',progress:{}};
 const markup=renderActivity(hunt,ctx);
 assert.match(markup,/Find the red ball/);
 assert.equal((markup.match(/data-feature-hunt-action="choose"/g)||[]).length,3);
 const correct=renderActivity(hunt,{...ctx,progress:{featureHuntStates:{'A1-6:a1-6-feature-hunt':{round:0,answer:0}}}});
 assert.match(correct,/data-feature-hunt-action="next"/);
});

test('first A1 workshop is after planned lesson 9, not an unexplained boundary at lesson 6',()=>{
 const curriculum=load('curriculum.a1.json'),first=curriculum.stages[0].chapters[0],second=curriculum.stages[0].chapters[1];
 assert.deepEqual(first.lessons.map(x=>x.id),['A1-1','A1-2','A1-3','A1-4']);
 assert.deepEqual(second.lessons.slice(0,5).map(x=>x.id),['A1-5','A1-6','A1-7','A1-8','A1-9']);
 assert.equal(second.lessons[5].id,'A1-W1');
 assert.equal(curriculum.stages.length,3);
});
test('A1-3 teaches having, not having and asking, beyond ownership alone',()=>{
 const lesson=load('lessons/a1-3.json');
 const activities=lesson.sections.flatMap(s=>s.activities);
 const whole=JSON.stringify(activities);
 for(const phrase of ['I have a book.',"I don't have a pen.",'Do you have a bag?'])
  assert.ok(whole.includes(phrase),phrase);
 assert.ok(activities.find(a=>a.id==='ownership-have-practice').tasks.length>=5);
 assert.deepEqual(validateLessonFlow(lesson),[]);
 assert.deepEqual(auditLesson(lesson).errors,[]);
});
test('A1-5 teaches eleven/twelve, colors, questions and synchronized visuals',()=>{
 const lesson=load('lessons/a1-5.json');
 const words=lesson.sections[0].activities.find(a=>a.type==='vocabulary').items.map(x=>x.en);
 for(const value of ['eleven','twelve','red','blue','green','yellow','black','white'])
  assert.ok(words.includes(value),value);
 const lab=lesson.sections[0].activities.find(a=>a.id==='count-color-tap');
 const ctx={lessonId:'A1-5',index:0,e:String,en:String,i:()=>'',progress:{}};
 const before=renderActivity(lab,ctx);
 const after=renderActivity(lab,{...ctx,progress:{attributeChoices:{'A1-5:count-color-tap':{count:1,color:1}}}});
 assert.match(before,/ten/);
 assert.match(after,/eleven/);
 assert.match(after,/blue/);
 assert.equal((after.match(/class="tap-ball"/g)||[]).length,11);
 assert.deepEqual(validateLessonFlow(lesson),[]);
 assert.deepEqual(auditLesson(lesson).errors,[]);
});
test('A1-6 describes material, shape and size with clickable words and independent checks',()=>{
 const lesson=load('lessons/a1-6-v2.json');
 assert.deepEqual(validateLessonFlow(lesson),[]);
 const foundation=lesson.sections[0].activities;
 const composer=foundation.find(a=>a.type==='sentence-composer');
 assert.deepEqual(validateSentenceComposer(composer),[]);
 const resolved=resolveSentenceComposer(composer,{pattern:'description',slots:{size:'small',shape:'square',material:'metal'}});
 assert.equal(composeSegments(resolved.pattern.segments,composer,resolved),'This is a small square metal box.');
 const lab=foundation.find(a=>a.type==='tap-attributes-lab');
 const ctx={lessonId:'A1-6',index:0,e:String,en:String,i:()=>'',progress:{}};
 const before=renderActivity(lab,ctx);
 const after=renderActivity(lab,{...ctx,progress:{attributeChoices:{'A1-6:a1-6-property-tap':{size:1,shape:1,material:1}}}});
 assert.match(before,/big/);
 assert.match(after,/small/);
 assert.match(after,/square/);
 assert.match(after,/metal/);
 assert.match(after,/data-attribute-field="material"/);
 assert.deepEqual(auditLesson(lesson).errors,[]);
});
test('old A1-6..9 progress is archived and never credited to replacement A1-6',()=>{
 const before={completed:['A1-1','A1-6','A1-8'],sectionCompleted:{'A1-6':['foundation'],'A1-1':['production']},
  assessments:{'A1-6:age-independent':{passed:true},'A1-1:hello-write':{passed:true}},
  wordProgress:{'A1-7:identify-vocabulary':{index:5}},leitnerAdded:[
   {lessonId:'A1-6',front:'eleven'},{lessonId:'A1-1',front:'hello'}]};
 const migrated=migrateLegacyProgress(before);
 assert.equal(migrated.curriculumRevision,TARGET_REVISION);
 assert.deepEqual(migrated.completed,['A1-1']);
 assert.deepEqual(migrated.sectionCompleted,{'A1-1':['production']});
 assert.ok(migrated.legacyCurriculum['oct-2026-preview-a1-6-9'].fields.assessments['A1-6:age-independent']);
 assert.ok(migrated.legacyCurriculum['oct-2026-preview-a1-6-9'].fields.wordProgress['A1-7:identify-vocabulary']);
 assert.equal(migrated.leitnerAdded[0].front,'hello');
 assert.deepEqual(migrateLegacyProgress(migrated),migrated);
 assert.deepEqual(before.completed,['A1-1','A1-6','A1-8']);
});

test('new A1-3 teaches numbers before possession, reusing sister and brother without relisting them',()=>{
 const lesson=load('lessons/a1-3-v2.json');
 const activities=lesson.sections.flatMap(x=>x.activities);
 const bank=activities.find(x=>x.type==='vocabulary').items.map(x=>x.en);
 for(const number of ['one','two','three','eleven','twelve'])assert.ok(bank.includes(number));
 assert.ok(!bank.includes('brother')&&!bank.includes('sister'),'family words belong to A1-2');
 assert.ok(!bank.includes('red')&&!bank.includes('blue'),'colors belong to A1-6');
 const exchange=JSON.stringify(activities);
 for(const sample of ['There are three brothers.','There are two sisters.','How many sisters are there?'])assert.ok(exchange.includes(sample),sample);
 assert.deepEqual(validateLessonFlow(lesson),[]);
 assert.deepEqual(auditLesson(lesson).errors,[]);
});

test('new A1-4 reuses family and count in possession, negation and questions',()=>{
 const lesson=load('lessons/a1-4-v2.json');
 const activities=lesson.sections.flatMap(x=>x.activities);
 const whole=JSON.stringify(activities);
 for(const sample of ['I have three brothers.','You have two sisters.',"I don't have a sister.",'Do you have two brothers?','This is my bag.','I have a bag.'])assert.ok(whole.includes(sample),sample);
 const lab=activities.find(x=>x.id==='ownership-compare-tap');
 const ctx={lessonId:lesson.id,index:0,e:String,en:String,i:()=>'',progress:{}};
 const initial=renderActivity(lab,ctx);
 const swapped=renderActivity(lab,{...ctx,progress:{attributeChoices:{'A1-4:ownership-compare-tap':{count:2,noun:1}}}});
 assert.match(initial,/I have a book/);
 assert.match(swapped,/I have three brothers/);
 assert.deepEqual(validateLessonFlow(lesson),[]);
 assert.deepEqual(auditLesson(lesson).errors,[]);
});

test('new A1-5 combines location with prior family, numbers and ownership',()=>{
 const lesson=load('lessons/a1-5-v2.json');
 const all=JSON.stringify(lesson.sections);
 for(const sample of ['My brother is near the door.','My two books are on the table.','My three books are in my bag.'])assert.ok(all.includes(sample),sample);
 assert.deepEqual(validateLessonFlow(lesson),[]);
 assert.deepEqual(auditLesson(lesson).errors,[]);
});

test('new A1-6 grows from one adjective to two and full descriptions with noun-synced visual',()=>{
 const lesson=load('lessons/a1-6-v3.json');
 const activities=lesson.sections[0].activities;
 const labs=activities.filter(x=>x.mode==='progressive-features');
 assert.deepEqual(labs.map(x=>x.stage),['one','two','full']);
 const words=activities.find(x=>x.type==='vocabulary').items.map(x=>x.en);
 for(const color of ['red','blue','green','yellow','black','white'])assert.ok(words.includes(color));
 const ctx={lessonId:lesson.id,index:0,e:String,en:String,i:()=>'',progress:{}};
 const one=renderActivity(labs[0],ctx);
 const changed=renderActivity(labs[0],{...ctx,progress:{attributeChoices:{'A1-6:a1-6-one-adjective':{object:1,color:1}}}});
 const two=renderActivity(labs[1],ctx);
 const full=renderActivity(labs[2],ctx);
 assert.match(one,/This is a.*red.*ball/);
 assert.match(changed,/This is a.*blue.*book/);
 assert.match(changed,/aria-label="کتاب آبی"/);
 assert.match(two,/This is a.*small.*red.*ball/);
 assert.match(full,/data-attribute-field="object"/);
 assert.match(full,/wooden.*box/);
 assert.deepEqual(validateLessonFlow(lesson),[]);
 assert.deepEqual(auditLesson(lesson).errors,[]);
});

test('past A1-3..6 completions are archived on the owner-approved reorder',()=>{
 const old={curriculumRevision:'a1-canonical-six-2026-10',completed:['A1-1','A1-3','A1-4','A1-5','A1-6'],
  sentenceComposers:{'A1-4:places-composer':{pattern:'where'},'A1-1:hello-composer':{pattern:'intro'}},leitnerAdded:[{lessonId:'A1-3',front:'book'},{lessonId:'A1-2',front:'mother'}]};
 const saved=migrateLegacyProgress(old);
 assert.deepEqual(saved.completed,['A1-1']);
 assert.deepEqual(saved.legacyCurriculum['oct-2026-canonical-before-reorder'].completed,['A1-3','A1-4','A1-5','A1-6']);
 assert.ok(saved.legacyCurriculum['oct-2026-canonical-before-reorder'].fields.sentenceComposers['A1-4:places-composer']);
 assert.deepEqual(saved.leitnerAdded,[{lessonId:'A1-2',front:'mother'}]);
 assert.deepEqual(migrateLegacyProgress(saved),saved);
});
