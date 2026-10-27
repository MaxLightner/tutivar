import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateLessonFlow } from '../apps/learner-web/lesson-flow.js';
import { renderActivity } from '../apps/learner-web/lesson-modules.js';
import { resolveSentenceComposer, composeSegments, validateSentenceComposer } from '../apps/learner-web/sentence-composer.js';
import { evaluateResponse } from '../apps/learner-web/practice-engine.js';
import { inspectCorePracticeCoverage, inspectVocabularyContinuity } from '../tools/audit-vocabulary.mjs';
import { auditLesson } from '../tools/audit-lessons.mjs';
import { validateMultiSentencePuzzle } from '../apps/learner-web/sentence-puzzle.js';
import { gitBlobSha } from '../tools/curriculum-contract.mjs';
import { projectRoot } from '../tools/validate.mjs';

const root = join(projectRoot,'content/language-pairs/fa-en');
const read = path => JSON.parse(readFileSync(join(root,path),'utf8'));
const course = read('curriculum.a1.json');
const catalog = course.stages[1].chapters.flatMap(chapter=>chapter.lessons);
const lessons = new Map(catalog.map(card=>[card.id,read(card.file)]));
const activities = lesson=>lesson.sections.flatMap(section=>section.activities);
const stage3 = course.stages[2];
const canonical = JSON.parse(readFileSync(join(projectRoot,'content/curriculum/universal-path.v1.json'),'utf8'));
const transition = JSON.parse(readFileSync(join(projectRoot,'content/curriculum/legacy-alignment.json'),'utf8')).stage2PracticalSequence;
const expectedTitles = [
  'خوراکی‌ها و آشپزخانه','وعده‌های اصلی و گفت‌وگو سر میز','مقایسهٔ سادهٔ چیزها',
  'پوشاک و آنچه می‌پوشیم','اعضای بدن و جای آن‌ها','بیماری، درد و درخواست کمک',
  'مشاغل ساده و نقش افراد','خرید در سوپرمارکت و فروشگاه لباس','پرداخت، صورت‌حساب و رسید',
  'مکان‌های شهر و اطراف ما','آدرس و راهنمایی مسیر کوتاه','حمل‌ونقل و رسیدن به مقصد'
];
const validAnswers = new Map([
  [15,'This bag is bigger than that bag. I think the blue bag is cheaper than the red bag.'],
  [16,'I am wearing a blue shirt today. She is wearing a green dress at home.'],
  [17,'My head is above my neck. I have two feet and two legs.'],
  [18,'I have a headache today. I need some water and help, please.'],
  [19,'My sister is a doctor. She works at the school with my friend.'],
  [20,'I would like two apples, please. How much is this medium shirt today?'],
  [21,'Can I have the bill, please? I pay by card and need a receipt.'],
  [22,'There is a park near my home. The cafe is next to the park.'],
  [23,'Go straight to the park. Turn right at the intersection near the bank.'],
  [24,'I go to the school by bus. I need one ticket to the city.']
]);

test('owner-approved part two contains twelve practical topics, with no changes to part three',()=>{
  assert.deepEqual(catalog.map(card=>card.id),Array.from({length:12},(_,i)=>'A1-'+(i+13)));
  assert.deepEqual(catalog.map(card=>card.title),expectedTitles);
  assert.ok(catalog.every(card=>card.status==='sample'&&card.file));
  const rows=canonical.lessons.filter(row=>row.level==='A1'&&row.order>=25);
  assert.equal(gitBlobSha(JSON.stringify(rows)),transition.stage3Fingerprint.rows);
  assert.equal(gitBlobSha(JSON.stringify(stage3)),transition.stage3Fingerprint.catalog);
  assert.deepEqual(transition.displacedGoals.map(item=>item.oldId),['A1-23','A1-24']);
});

test('each new lesson is a two-section course, with distinct retrieval, conversation and production tasks',()=>{
  const all=[...lessons.values()];
  assert.deepEqual(inspectVocabularyContinuity(all),[]);
  assert.deepEqual(inspectCorePracticeCoverage(all),[]);
  for(let n=15;n<=24;n++){
    const lesson=lessons.get('A1-'+n),content=activities(lesson);
    assert.deepEqual(validateLessonFlow(lesson),[],lesson.id);
    assert.deepEqual(auditLesson(lesson).errors,[],lesson.id);
    assert.equal(lesson.roadmapRef.revision,canonical.revision);
    assert.equal(lesson.roadmapRef.communicativeOutcome,canonical.lessons.find(row=>row.id===lesson.id).communicativeOutcome);
    assert.deepEqual(lesson.sections.map(section=>section.id),['foundation','production']);
    assert.ok(content.filter(a=>a.type==='response-practice').length>=1);
    assert.ok(content.find(a=>a.type==='exchange-lab')?.pairs.length>=4);
    assert.ok(content.find(a=>a.type==='guided-dialogue')?.turns.length>=4);
    assert.ok(content.find(a=>a.type==='free-write')?.realWorldMission?.reflection.length>10);
    assert.ok(content.find(a=>a.type==='mission-lab'),lesson.id+' needs an interactive real-world lab');
    assert.equal(content.some(a=>a.type==='quiz-set'),false,lesson.id+' should not default to three-choice quizzes');
    assert.ok(content.find(a=>a.type==='exchange-lab')?.pairs.length>=5,lesson.id+' needs at least five opening questions');
    const composer=content.find(a=>a.type==='sentence-composer');
    assert.deepEqual(validateSentenceComposer(composer),[],lesson.id);
    assert.ok(composer.patterns.length>=2 && composer.slots.length>=2);
    const puzzle=content.find(a=>a.type==='sentence-builder');
    assert.deepEqual(validateMultiSentencePuzzle(puzzle),[],lesson.id);
    assert.ok(existsSync(join(projectRoot,'apps/learner-web',lesson.visual.src.slice(2))));
  }
});

test('all activity modules render without a missing runtime dependency',()=>{
  for(let n=15;n<=24;n++){
    const lesson=lessons.get('A1-'+n),all=activities(lesson);
    const context={lessonId:lesson.id,index:0,e:String,en:text=>String(text),i:()=>'',progress:{
      written:{},quizAnswers:{},sentenceAnswers:{},assessments:{},wordProgress:{},
      dialogueSteps:{},expressionIndexes:{},sentenceComposers:{},exchangeChoices:{},
      practiceStates:{},shadowingStates:{},phraseChoices:{},composerChoices:{}
    },activitiesById:Object.fromEntries(all.map(a=>[a.id,a]))};
    for(const [i,activity] of all.entries()){
      context.index=i;
      assert.doesNotThrow(()=>renderActivity(activity,context),`${lesson.id}:${activity.id}`);
    }
  }
});

test('sentence composers change meaning as learners select alternatives',()=>{
  for(let n=15;n<=24;n++){
    const lesson=lessons.get('A1-'+n),composer=activities(lesson).find(a=>a.type==='sentence-composer');
    const first=resolveSentenceComposer(composer);
    const initial=composeSegments(first.pattern.segments,composer,first);
    const changedSlot=composer.slots.find(slot=>composer.wordSets[slot.wordSet].length>=2);
    const second=resolveSentenceComposer(composer,{slots:{[changedSlot.id]:composer.wordSets[changedSlot.wordSet][1].id}});
    assert.notEqual(initial,composeSegments(second.pattern.segments,composer,second),lesson.id+' must respond to word changes');
    const differentPattern=resolveSentenceComposer(composer,{pattern:composer.patterns[1].id});
    assert.notEqual(initial,composeSegments(differentPattern.pattern.segments,composer,differentPattern),lesson.id+' must respond to communicative mode');
  }
});

test('independent tasks accept original real-life sentences but reject unordered word fragments',()=>{
  for(const [n,response] of validAnswers){
    const independent=activities(lessons.get('A1-'+n)).find(a=>a.type==='free-write');
    const result=evaluateResponse(independent.assessment,response);
    assert.equal(result.ok,true,'A1-'+n+': '+result.feedback);
    assert.equal(evaluateResponse(independent.assessment,'book water shirt park need help').ok,false,'A1-'+n+' should reject a word salad');
  }
});
