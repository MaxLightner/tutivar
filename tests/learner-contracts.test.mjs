import test from 'node:test';
import assert from 'node:assert/strict';
import { createUser, toLessonDescriptor, createLessonProgress, createReviewCard, createReviewHistory, summarizeLearningProgress, selectResumeLesson, describeLessonState } from '../apps/learner-web/learning-contracts.js';
const lessons = [{id:'A1-1',title:'One',status:'sample'},{id:'A1-2',title:'Two',status:'sample'},{id:'A1-3',title:'Three',status:'planned'}];
test('stable domain contracts reserve identity, content revision and history',()=>{
  assert.equal(createUser({id:'local:1'}).schemaVersion,'1.0.0');
  assert.equal(toLessonDescriptor(lessons[0],{courseRevision:'a1-2026'}).courseRevision,'a1-2026');
  assert.deepEqual(createLessonProgress({userId:'u',lessonId:'A1-1',courseRevision:'r',completedSectionIds:['foundation','foundation']}).completedSectionIds,['foundation']);
  assert.equal(createReviewCard({id:'c1',userId:'u',front:'Hello',back:'سلام'}).schedule,null);
  assert.equal(createReviewHistory({id:'h1',userId:'u',cardId:'c1',reviewedAt:'2026-10-27T00:00:00Z',answer:'good'}).answer,'good');
  assert.throws(()=>createReviewCard({id:'bad',userId:'u',front:'',back:'test'}),TypeError);
});
test('preview derives available counts and avoids treating planned lessons as published',()=>{
  const state={completed:['A1-1','A1-3'],sectionCompleted:{'A1-2':['foundation']}};
  assert.deepEqual(summarizeLearningProgress(lessons,state),{availableCount:2,completedCount:1,startedCount:1,percent:50,remainingCount:1});
  assert.equal(selectResumeLesson(lessons,state)?.id,'A1-2');
  assert.equal(describeLessonState(lessons[1],state),'in-progress');
  assert.equal(describeLessonState(lessons[2],state),'planned');
});
test('resume and progress handle empty and fully finished curricula',()=>{
  assert.equal(selectResumeLesson([],{}),null);
  assert.equal(summarizeLearningProgress([],{}).percent,0);
  assert.equal(selectResumeLesson(lessons,{completed:['A1-1','A1-2']}).id,'A1-2');
});
