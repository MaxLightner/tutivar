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
test('canonical A1 live curriculum stops at the first six approved outcomes',()=>{
 assert.deepEqual(active.map(x=>x.id),['A1-1','A1-2','A1-3','A1-4','A1-5','A1-6']);
 assert.equal(active[5].file,'lessons/a1-6-v2.json');
 assert.equal(active[5].title,'توصیف ویژگی‌های اشیا');
 assert.deepEqual(inspectVocabularyContinuity(active.map(x=>load(x.file))),[]);
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
