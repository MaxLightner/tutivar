import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, projectRoot, validateSchema } from '../tools/validate.mjs';
import { renderActivity, renderDialogueLines, supportedActivities } from '../apps/learner-web/lesson-modules.js';
import { advanceDeck, answerDeck, checkWordAnswer, coreItems, deckState, jumpDeck, resumeDeck, startDeckTest, supplementaryItems } from '../apps/learner-web/word-review.js';
import { evaluateResponse, practiceState, submitPractice } from '../apps/learner-web/practice-engine.js';
import { auditLesson } from '../tools/audit-lessons.mjs';
import { inspectVocabularyContinuity } from '../tools/audit-vocabulary.mjs';
import { composeSegments, cycleComposerSlot, resolveSentenceComposer, validateSentenceComposer } from '../apps/learner-web/sentence-composer.js';
import { LESSON_PHASES, validateLessonFlow } from '../apps/learner-web/lesson-flow.js';
import { resolveMeaningForm, advanceMeaningForm, selectedSpatialPosition, validateVisualActivity } from '../apps/learner-web/visual-learning.js';
import { puzzleTokenBank, normalizePuzzleState, normalizePuzzleSentence, puzzleDisplayWord, addPuzzleWord, canAppendPuzzleWord, undoPuzzleWord, clearPuzzleSentence, submitPuzzleSentence, validateMultiSentencePuzzle } from '../apps/learner-web/sentence-puzzle.js';

const contentRoot = join(projectRoot, 'content/language-pairs/fa-en');
const load = (file) => readJson(join(contentRoot, file));
const manifest = load('preview-manifest.json');
const curriculum = load(manifest.levels.A1.curriculumFile);
const lessons = curriculum.stages.flatMap((stage) => stage.chapters).flatMap((chapter) => chapter.lessons).filter((lesson) => !Array.isArray(lesson));

test('fa-en is the active pilot, separate from fa-de', () => {
  const pair = load('pair.json');
  assert.deepEqual(validateSchema(readJson(join(projectRoot, 'schemas/language-pair.schema.json')), pair), []);
  assert.equal(pair.id, 'fa-en');
  assert.equal(pair.sourceLanguage, 'fa');
  assert.equal(pair.targetLanguage, 'en');
  assert.equal(manifest.pairId, pair.id);
  assert.equal(manifest.status, 'draft');
});

test('every sample path node references a real content file with two teaching sections', () => {
  const ids = new Set();
  for (const entry of lessons.filter((lesson) => lesson.status === 'sample')) {
    assert.ok(entry.file, `${entry.id}: missing lesson file`);
    const lesson = load(entry.file);
    assert.equal(lesson.id, entry.id);
    assert.equal(lesson.status, 'draft');
    assert.equal(lesson.sections.length, 2);
    assert.deepEqual(lesson.sections.map((section) => section.id), ['foundation', 'production']);
    if (lesson.sections[0].activities) {
      assert.ok(lesson.sections[0].activities.length >= 1);
      assert.ok(lesson.sections[1].activities.length >= 1);
      assert.ok(lesson.sections[0].activities.some((activity) => activity.type === 'vocabulary'));
      assert.ok(lesson.sections[1].activities.some((activity) => ['roleplay', 'guided-dialogue'].includes(activity.type)));
      assert.ok(lesson.sections[1].activities.some((activity) => activity.type === 'free-write'));
      for (const section of lesson.sections) {
        for (const id of section.masteryActivityIds || []) assert.ok(section.activities.some((activity) => activity.id === id), `${lesson.id}: missing mastery activity ${id}`);
        for (const activity of section.activities) {
          assert.ok(supportedActivities.includes(activity.type), `${lesson.id}: unsupported ${activity.type}`);
          if (activity.type === 'quiz-set') for (const question of activity.questions) assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.choices.length);
          if (activity.type === 'roleplay') for (const turn of activity.turns) assert.ok(Number.isInteger(turn.correctIndex) && turn.correctIndex >= 0 && turn.correctIndex < turn.choices.length);
        }
      }
    } else {
      assert.ok(lesson.sections[0].vocabulary.length >= 3);
      assert.ok(lesson.sections[0].check.choices.length >= 2);
      assert.ok(Number.isInteger(lesson.sections[0].check.answer));
      assert.ok(lesson.sections[0].check.answer < lesson.sections[0].check.choices.length);
      assert.ok(lesson.sections[1].dialogue.length >= 2);
      assert.ok(lesson.sections[1].featureWidget.type);
      assert.ok(lesson.sections[1].production.prompt);
    }
    assert.ok(!ids.has(lesson.id));
    ids.add(lesson.id);
  }
  assert.equal(ids.size, 10);
  assert.deepEqual([...ids],['A1-1','A1-2','A1-3','A1-4','A1-5','A1-6','A1-7','A1-8','A1-9','A1-10']);
  assert.deepEqual([...new Set([...ids].map((id) => load(lessons.find((entry) => entry.id === id).file).archetype))].sort(), ['K1/K2','K2','K4/K12','K4/K2','conversation','counting-objects','family','ownership','spatial-location']);
});

test('not-yet-produced nodes cannot be launched as content', () => {
  for (const entry of lessons.filter((lesson) => lesson.status === 'planned')) assert.equal(entry.file, undefined);
  assert.ok(manifest.availableLevels.every((level) => manifest.levels[level]));
  assert.ok(manifest.levels.A2.chapters.length === 0);
});

test('A1 shows three structured stages with twelve chapters', () => {
  assert.deepEqual(curriculum.stages.map((stage) => stage.id), ['A1.1', 'A1.2', 'A1.3']);
  assert.equal(curriculum.stages.reduce((sum, stage) => sum + stage.chapters.length, 0), 12);
  assert.ok(curriculum.stages.every((stage) => stage.chapters.every((chapter) => chapter.lessons.length >= 1)));
  assert.ok(curriculum.stages.every((stage) => stage.chapters.every((chapter) => chapter.lessons.every((entry) => Array.isArray(entry) ? entry.length >= 2 : entry.icon))));
  assert.ok(curriculum.stages.every((stage) => stage.chapters.every((chapter) => {
    const last = chapter.lessons.at(-1);
    return Array.isArray(last) ? last[2] === 'workshop' : last.kind === 'workshop';
  })));
  assert.equal(manifest.levels.A1.curriculumFile, 'curriculum.a1.json');
});


test('all three lessons follow one JSON-declared learning template', () => {
  for (const id of ['a1-1','a1-2','a1-3']) {
    const lesson=load('lessons/'+id+'.json');
    assert.equal(lesson.lessonTemplate,'discovery-production-v1');
    assert.deepEqual(validateLessonFlow(lesson), [], lesson.id);
    for (const section of lesson.sections) {
      const expected=LESSON_PHASES[section.id];
      const actual=[...new Set(section.activities.map(activity=>activity.phase))];
      assert.deepEqual(actual,expected,lesson.id+': '+section.id);
      assert.equal(section.activities.find(activity=>activity.phase==='puzzle')?.type, section.id==='foundation'?'sentence-builder':undefined);
    }
  }
});

test('sentence stages retain independent selections and still reuse one JSON grammar', () => {
  for (const id of ['a1-1', 'a1-2', 'a1-3']) {
    const lesson = load('lessons/' + id + '.json');
    const activities = Object.fromEntries(lesson.sections.flatMap(section => section.activities).map(activity => [activity.id, activity]));
    const source = lesson.sections[0].activities.find(activity => activity.type === 'sentence-composer');
    const phrases = lesson.sections[0].activities.find(activity => activity.type === 'composer-view' && activity.phase === 'phrases');
    const models = lesson.sections[0].activities.find(activity => activity.type === 'composer-view' && activity.phase === 'variants');
    const firstSlot = source.slots[0];
    const variants = source.wordSets[firstSlot.wordSet];
    assert.ok(variants.length > 1);
    assert.equal(phrases.sourceActivityId, source.id);
    assert.equal(models.sourceActivityId, source.id);
    const context = {
      lessonId: lesson.id,
      index: 0, activitiesById: activities, e: String, en: String, i: () => '',
      progress: {
        sentenceComposers: {
          [lesson.id + ':' + phrases.id]: { slots: { [firstSlot.id]: variants[1].id } },
          [lesson.id + ':' + source.id]: { slots: { [firstSlot.id]: variants[0].id } },
          [lesson.id + ':' + models.id]: { slots: { [firstSlot.id]: variants[1].id }, pattern: models.patternIds[1] }
        }
      }
    };
    const phraseHtml = renderActivity(phrases, context);
    const sentenceHtml = renderActivity(source, context);
    const modelsHtml = renderActivity(models, context);
    assert.match(phraseHtml, new RegExp('data-composer-key="' + lesson.id + ':' + phrases.id + '"'));
    assert.match(sentenceHtml, new RegExp('data-composer-key="' + lesson.id + ':' + source.id + '"'));
    assert.match(modelsHtml, new RegExp('data-composer-key="' + lesson.id + ':' + models.id + '"'));
    assert.ok(phraseHtml.includes(String(variants[1].forms?.determiner || variants[1].label)));
    assert.ok(sentenceHtml.includes(String(variants[0].forms?.determiner || variants[0].label)));
    assert.match(modelsHtml, /data-composer-action="pattern"/);
    assert.doesNotMatch([phraseHtml, sentenceHtml, modelsHtml].join(''), /composer-picker|composer-choice|composer-search/);
    assert.deepEqual(validateLessonFlow(lesson), []);
  }
});

test('each A1 puzzle mixes words from several valid sentences, not one', () => {
  for (const id of ['a1-1', 'a1-2', 'a1-3']) {
    const lesson = load('lessons/' + id + '.json');
    const puzzle = lesson.sections[0].activities.find(activity => activity.phase === 'puzzle');
    assert.ok(puzzle.sentences.length >= 4, id + ' must have multiple correct sentences');
    assert.deepEqual(validateMultiSentencePuzzle(puzzle), []);
    const bank = puzzleTokenBank(puzzle);
    const originals = puzzle.sentences.flatMap(sentence => sentence.words);
    assert.deepEqual(bank.map(token => token.word).sort(), originals.slice().sort(), id + ' bank preserves all words and repeats');
    assert.equal(bank.length, originals.length);
    assert.ok(bank.length > Math.max(...puzzle.sentences.map(sentence => sentence.words.length)));
    assert.deepEqual(puzzleTokenBank(puzzle), bank, 'mixing is stable when resuming progress');
    const context = { lessonId: lesson.id, index: 0, e: String, en: String, i: () => '', progress: { sentenceAnswers: {} } };
    const html = renderActivity(puzzle, context);
    assert.match(html, /data-build-submit=/);
    assert.match(html, /data-build-undo=/);
    assert.match(html, /بانک کلمات چند جمله/);
    assert.equal((html.match(/data-build-token=/g) || []).length, originals.length, 'every word, including repeated words, is shown');
    assert.doesNotMatch(html, /class="builder-found-item"/, 'answers are not revealed before the learner solves them');
  }
});

test('puzzle rejects impossible partial word order but keeps valid question starts and alternatives', () => {
  const activity={id:'prefix-grammar',revision:1,goalCount:2,reuseBank:true,sentences:[
    {id:'a',words:['The','book','is','here.']},
    {id:'b',words:['Is','the','book','here?']}
  ]};
  const bank=puzzleTokenBank(activity);
  const word=(name,skip=0)=>bank.findIndex((x,i)=>x.word.toLowerCase()===name.toLowerCase() && skip--===0);
  const iBook=bank.findIndex(x=>x.word==='book');
  const iIs=bank.findIndex(x=>x.word==='Is');
  const iThe=bank.findIndex(x=>x.word==='the');
  assert.equal(canAppendPuzzleWord(activity,null,iBook),false,'book is not a start of these authored sentences');
  assert.equal(canAppendPuzzleWord(activity,null,iIs),true,'Is can begin a valid question');
  const one=addPuzzleWord(activity,null,iIs);
  assert.equal(canAppendPuzzleWord(activity,one,iBook),false,'Is book is not a valid prefix');
  assert.equal(canAppendPuzzleWord(activity,one,iThe),true,'Is the is a valid prefix');
  assert.deepEqual(normalizePuzzleState(activity,one).current,[iIs],'rejected word never enters progress');
  const b0=bank.findIndex(x=>x.word==='The');
  const p0=addPuzzleWord(activity,null,b0);
  assert.equal(canAppendPuzzleWord(activity,p0,iBook),true,'the book is a valid statement prefix');
});

test('multi-sentence puzzle accepts solutions in any order and consumes only their words', () => {
  const lesson = load('lessons/a1-3.json');
  const puzzle = lesson.sections[0].activities.find(activity => activity.phase === 'puzzle');
  const bank = puzzleTokenBank(puzzle);
  let state = normalizePuzzleState(puzzle, []);
  assert.deepEqual(state.completed, [], 'old single-sentence stored answers migrate safely');
  state = addPuzzleWord(puzzle, state, bank.findIndex(item => item.word === 'This'));
  state = submitPuzzleSentence(puzzle, state);
  assert.equal(state.feedback, 'wrong', 'one word alone is not a correct sentence');
  assert.equal(state.current.length, 1, 'incorrect attempts can be repaired');
  state = undoPuzzleWord(puzzle, state);
  assert.deepEqual(state.current, []);
  state = addPuzzleWord(puzzle, state, 0);
  state = clearPuzzleSentence(puzzle, state);
  assert.deepEqual(state.current, []);

  // Find the fourth, then first, third, and second valid sentence; the learner controls the order.
  for (const target of [...puzzle.sentences].reverse()) {
    for (const word of target.words) {
      const used = new Set(state.completed.flatMap(entry => entry.indices));
      const index = bank.findIndex((item, index) => item.word === word && !used.has(index) && !state.current.includes(index));
      assert.ok(index >= 0, 'a word remains available for ' + target.id);
      state = addPuzzleWord(puzzle, state, index);
    }
    state = submitPuzzleSentence(puzzle, state);
    assert.equal(state.feedback, 'correct', target.id);
    assert.equal(state.completed.at(-1).id, target.id);
    assert.deepEqual(state.current, []);
  }
  assert.equal(state.completed.length, 4);
  const rendered = renderActivity(puzzle, {
    lessonId: lesson.id, index: 0, e: String, en: String, i: () => '',
    progress: { sentenceAnswers: { [lesson.id + ':' + puzzle.id]: state } }
  });
  assert.match(rendered, /همهٔ جمله‌ها را پیدا کردی/);
  assert.equal((rendered.match(/class="builder-found-item"/g) || []).length, 4);
  assert.equal((rendered.match(/data-token-index="\d+" disabled/g) || []).length, bank.length);
});

test('puzzle validation rejects a one-sentence task and duplicate valid solutions', () => {
  const one = { id: 'bad', type: 'sentence-builder', sentences: [{ id: 'only', words: ['This', 'works.'] }] };
  assert.ok(validateMultiSentencePuzzle(one).some(error => error.includes('at least two')));
  const dup = { id: 'bad', type: 'sentence-builder', sentences: [
    { id: 'one', words: ['This', 'works.'] },
    { id: 'two', words: ['This', 'works.'] }
  ]};
  assert.ok(validateMultiSentencePuzzle(dup).some(error => error.includes('duplicate target')));
});

test('puzzle grading ignores capitalization and terminal punctuation, while giving gentle writing tips', () => {
  const lesson = load('lessons/a1-3.json');
  const puzzle = lesson.sections[0].activities.find(activity => activity.phase === 'puzzle');
  const composer = lesson.sections[0].activities.find(activity => activity.id === puzzle.sourceActivityId);
  const bank = puzzleTokenBank(puzzle);
  assert.equal(normalizePuzzleSentence('This Is MY phone'), normalizePuzzleSentence('this is my phone.'));
  assert.equal(puzzleDisplayWord('bag?'), 'bag');
  let state = normalizePuzzleState(puzzle, []);
  for (const word of ['This', 'Is', 'my', 'phone']) {
    const index = bank.findIndex((item,index) => normalizePuzzleSentence(item.word) === word.toLowerCase() && !state.current.includes(index));
    assert.ok(index >= 0, 'word available for ' + word);
    state = addPuzzleWord(puzzle, state, index);
  }
  const solved = submitPuzzleSentence(puzzle, state, composer);
  assert.equal(solved.feedback, 'correct', 'This Is my phone without a period is grammatically correct');
  assert.match(solved.warning, /حرف کوچک/, 'writing style produces a tip, not a failed grade');
  assert.equal(solved.completed.length, 1);
  const view = renderActivity(puzzle, {lessonId:lesson.id,index:0,e:String,en:String,i:()=>'',progress:{sentenceAnswers:{[lesson.id+':'+puzzle.id]:solved}}});
  assert.match(view, /درست بود/);
  assert.match(view, /حرف کوچک/);
  assert.doesNotMatch(view, /builder-feedback wrong/);
  assert.equal((view.match(/data-build-token=/g) || []).length, bank.length, 'all words remain available for new combinations');

  let again = solved;
  for (const word of ['This','Is','my','phone']) {
    const index=bank.findIndex((item,index)=>normalizePuzzleSentence(item.word)===word.toLowerCase()&&!again.current.includes(index));
    again=addPuzzleWord(puzzle,again,index);
  }
  again=submitPuzzleSentence(puzzle,again,composer);
  assert.equal(again.feedback,'duplicate', 'same normalized sentence does not count twice');
  assert.equal(again.completed.length,1);
});

test('archived location lesson has intact two-stage activities after reordering', () => {
  const lesson=load('lessons/a1-4.json');
  const catalog=lessons.find(entry=>entry.id===lesson.id);
  assert.equal(catalog.file,'lessons/a1-4-v3.json');
  assert.equal(catalog.status,'sample');
  assert.deepEqual(validateLessonFlow(lesson),[]);
  assert.equal(lesson.sections.length,2);
  assert.deepEqual([...new Set(lesson.sections[0].activities.map(x=>x.phase))],LESSON_PHASES.foundation);
  assert.deepEqual([...new Set(lesson.sections[1].activities.map(x=>x.phase))],LESSON_PHASES.production);
  const foundation=lesson.sections[0],production=lesson.sections[1];
  const vocabulary=foundation.activities.find(a=>a.type==='vocabulary');
  assert.ok(coreItems(vocabulary).length>=15);
  assert.ok(supplementaryItems(vocabulary).length>=8);
  assert.ok(vocabulary.items.every(item=>!/\s/.test(item.en.trim())),'word bank contains only single lexical words');
  assert.ok(coreItems(vocabulary).every(item=>item.examples?.length===3));
  assert.ok(supplementaryItems(vocabulary).every(item=>!item.examples&&!item.hint),'supplementary words are list-only');
  assert.deepEqual(auditLesson(lesson).errors,[],'every focus expression appears in guided and independent production');
  const composer=foundation.activities.find(a=>a.type==='sentence-composer');
  assert.deepEqual(validateSentenceComposer(composer),[]);
  assert.equal(composeSegments(resolveSentenceComposer(composer,{}).pattern.segments,composer,resolveSentenceComposer(composer,{})),'The ball is in the box.');
  const selected={slots:{object:'keys',position:'under',location:'chair'}};
  for(const [pattern,expected] of [
    ['statement','The keys are under the chair.'],
    ['question','Are the keys under the chair?'],
    ['negative','The keys are not under the chair.'],
    ['where','Where are the keys?']
  ]){
    const resolved=resolveSentenceComposer(composer,{...selected,pattern});
    assert.equal(composeSegments(resolved.pattern.segments,composer,resolved),expected);
  }
  const next=cycleComposerSlot(composer,{slots:{object:'ball'}},'object');
  assert.equal(next.slots.object,composer.wordSets.objects[1].id);
  const context={lessonId:lesson.id,index:0,e:String,en:String,i:()=>'',progress:{sentenceComposers:{},sentenceAnswers:{},wordProgress:{},written:{},assessments:{},showDialogueTranslation:true,practiceStates:{},dialogueSteps:{},exchangeChoices:{}},
     activitiesById:Object.fromEntries(lesson.sections.flatMap(section=>section.activities).map(activity=>[activity.id,activity]))};
  for(const section of lesson.sections)for(const activity of section.activities){
    const html=renderActivity(activity,context);
    assert.match(html,/module-block/,activity.id);
  }
  const phrase=foundation.activities.find(a=>a.type==='composer-view');
  assert.match(renderActivity(phrase,context),/data-composer-action="cycle"/);
  const models=foundation.activities.find(a=>a.phase==='variants' && a.type==='composer-view');
  assert.match(renderActivity(models,context),/data-composer-action="pattern"/);
  const puzzle=foundation.activities.find(a=>a.phase==='puzzle');
  const bank=puzzleTokenBank(puzzle);
  assert.ok(bank.length>20);
  let state=normalizePuzzleState(puzzle,[]);
  for(const word of ['The','ball','is','under','the','box']){
    const index=bank.findIndex((item,index)=>normalizePuzzleSentence(item.word)===word.toLowerCase()&&!state.current.includes(index));
    assert.ok(index>=0,'bank contains '+word);
    state=addPuzzleWord(puzzle,state,index);
  }
  state=submitPuzzleSentence(puzzle,state,composer);
  assert.equal(state.feedback,'correct','a novel grammatical combination is accepted by the shared JSON composer');
  assert.equal(production.activities.filter(a=>a.type==='dialogue').length,2);
  assert.ok(production.activities.filter(a=>a.type==='dialogue').every(a=>a.lines.length>=8));
  assert.ok(production.activities.some(a=>a.type==='guided-dialogue'));
  assert.ok(production.activities.some(a=>a.type==='free-write'));
  const lab=foundation.activities.find(activity=>activity.type==='spatial-lab');
  assert.equal(lab.positions.length,9);
  assert.deepEqual(validateVisualActivity(lab),[]);
  assert.doesNotMatch(renderActivity(lab,context),/data-spatial-position="on-top-of"/);
  assert.match(renderActivity(lab,context),/data-spatial-ball-layer/);
  assert.equal(lesson.visual.src,null);
});

test('meaning expressions and reusable visual learning modules are lesson-authored', () => {
  for(const id of ['a1-1','a1-2','a1-3','a1-4','a1-7']){
    const lesson=load('lessons/'+id+'.json');
    assert.deepEqual(validateLessonFlow(lesson),[],lesson.id);
    const concept=lesson.sections[0].activities.find(a=>a.type==='meaning-cluster');
    assert.ok(concept,lesson.id);
    assert.deepEqual(validateVisualActivity(concept),[]);
    const first=concept.concepts[0];
    assert.ok(first.forms.length>=2);
    assert.equal(resolveMeaningForm(concept,first,{}).en,first.forms[0].en);
    const shifted=advanceMeaningForm(concept,first,{});
    assert.equal(resolveMeaningForm(concept,first,shifted).en,first.forms[1].en);
    const key=lesson.id+':'+concept.id;
    const context={lessonId:lesson.id,index:0,e:String,en:String,i:()=>'',progress:{meaningChoices:{},familyPeople:{},spatialChoices:{},sentenceComposers:{},wordProgress:{}},activitiesById:Object.fromEntries(lesson.sections[0].activities.map(a=>[a.id,a]))};
    assert.match(renderActivity(concept,context),/data-meaning-key=/);
    assert.match(renderActivity(concept,context),/data-meaning-concept=/);
    assert.match(key, new RegExp(lesson.id));
  }
  const third=load('lessons/a1-3.json').sections[0].activities.find(a=>a.type==='meaning-cluster');
  assert.ok(third.concepts[0].forms.some(f=>f.relation==='related' && f.en==='I have this book.'));
  assert.ok(third.concepts[0].forms.some(f=>f.relation==='equivalent' && f.en==='This book is mine.'));

  const family=load('lessons/a1-2.json').sections[0].activities.find(a=>a.type==='family-lab');
  assert.deepEqual(validateVisualActivity(family),[]);
  const context={lessonId:'A1-2',index:0,e:String,en:String,i:()=>'',progress:{familyPeople:{}},activitiesById:{}};
  const html=renderActivity(family,context);
  assert.match(html,/class="family-point-arrow"/);
  assert.equal((html.match(/data-family-key=/g)||[]).length,12,'six family figures have SVG hotspots and button alternatives');
  assert.match(html,/This is my mother, Nora./);
  assert.equal(family.people.length,6);
  assert.ok(family.people.some(person=>person.sentence==='This is my daughter, Ava.'));
  assert.ok(family.people.some(person=>person.sentence==='This is my son, Leo.'));
  assert.match(html,/6 عضو خانواده/);
  const daughterScene=renderActivity(family,{...context,progress:{familyPeople:{'A1-2:family-tree':4}}});
  assert.match(daughterScene,/family-point-arrow" transform="translate\(330 317\)"/);

  const fourth=load('lessons/a1-4.json');
  const core=coreItems(fourth.sections[0].activities.find(a=>a.type==='vocabulary'));
  assert.ok(core.some(item=>item.en==='ball'));
  assert.ok(core.some(item=>item.en==='box'));
  assert.ok(core.some(item=>item.en==='above'));
  const expressions=fourth.sections[0].activities.find(a=>a.type==='expression-study');
  assert.ok(expressions.items.some(item=>item.en==='on top of'),'on top of remains a taught phrase, not a spatial-game position');
  assert.ok(core.every(item=>!/\s/.test(item.en.trim())));
  assert.ok(!core.some(item=>item.en==='phone'),'previously taught phone must only recur in examples');
  assert.ok(!core.some(item=>item.en==='book'),'previously taught book must only recur in examples');
  assert.ok(fourth.sections[1].activities.some(a=>JSON.stringify(a).includes('phone')));
  const spatial=fourth.sections[0].activities.find(a=>a.type==='spatial-lab');
  assert.deepEqual(validateVisualActivity(spatial),[]);
  assert.equal(selectedSpatialPosition(spatial,'under').en,'The ball is under the box.');
  assert.equal(selectedSpatialPosition(spatial,'above').ball.layer,'front');
  assert.notDeepEqual(selectedSpatialPosition(spatial,'above').ball,selectedSpatialPosition(spatial,'on').ball);
  const spatialMarkup=renderActivity(spatial,{lessonId:'A1-4',index:0,e:String,en:String,i:()=>'',progress:{spatialChoices:{}}});
  assert.match(spatialMarkup,/data-spatial-current="in"/);
  assert.match(spatialMarkup,/The ball is in the box./);
  assert.equal((spatialMarkup.match(/data-spatial-position=/g)||[]).length,9);
});

test('first lesson activities render with separate content, including interactions', () => {
  const lesson = load('lessons/a1-1.json');
  const context = {
    lessonId: lesson.id, index: 0, activitiesById: Object.fromEntries(lesson.sections.flatMap(section => section.activities).map(activity => [activity.id, activity])),
    e: (value) => String(value), en: (value) => `<span>${value}</span>`, i: () => '<svg></svg>',
    progress: { matchAnswers: {}, sentenceAnswers: {}, roleplayAnswers: {}, quizAnswers: {}, written: {}, showDialogueTranslation: true, wordProgress: {}, sentenceComposers: {}, phraseChoices: {}, sentenceLabs: {}, guidedAnswers: {}, transformChoices: {}, transformStages: {}, dialogueSteps: {}, exchangeChoices: {}, practiceStates: {}, assessments: {} }
  };
  for (const section of lesson.sections) {
    for (const activity of section.activities) {
      const html = renderActivity(activity, context);
      assert.match(html, /module-block/);
      assert.ok(html.length > 80, activity.id);
    }
  }
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary'), context), /data-word-key=/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary'), context), /data-word-slider=/);
  const vocabularyHtml=renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary'), context);
  assert.match(vocabularyHtml, /آزمون واژگان/);
  assert.doesNotMatch(vocabularyHtml, /اینو بلدم/);
  assert.doesNotMatch(vocabularyHtml, /امتحانم کن/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'composer-view'), context), /data-composer-action="cycle"/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'sentence-composer'), context), /data-composer-action="cycle"/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.phase === 'puzzle'), context), /data-build-token=/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'response-practice'), context), /data-practice-form=/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'sentence-transform'), context), /data-transform-key=/);
  assert.match(renderActivity(lesson.sections[1].activities[0], context), /data-exchange-key=/);
  assert.match(renderActivity(lesson.sections[1].activities.find((activity) => activity.type === 'guided-dialogue'), context), /data-practice-form=/);
  assert.match(renderActivity(lesson.sections[1].activities.find((activity) => activity.type === 'dialogue-transfer'), context), /data-practice-form=/);
  assert.equal(lesson.sections.reduce((sum, section) => sum + section.activities.length, 0), 21, 'shadowing and expression study are reusable lesson modules');
  assert.equal(lesson.sections[0].activities.at(-1).type, 'response-practice', 'independent sentence construction concludes the first half');
  assert.deepEqual(lesson.sections[1].activities.map((item) => item.type), ['exchange-lab', 'response-practice', 'dialogue', 'response-practice', 'dialogue', 'response-practice', 'picture-description', 'guided-dialogue', 'dialogue-transfer', 'free-write', 'shadowing-review'], 'question/answer exchange starts the conversation half and the opening audio returns at the end');
  assert.ok(lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary').items.filter((entry) => entry.role !== 'supplementary').every((entry) => entry.examples.length === 3));
  assert.ok(lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary').items.filter((entry) => entry.role === 'supplementary').every((entry) => !entry.examples && !entry.hint));
  assert.ok(Array.isArray(lesson.orientation.prerequisites));
  assert.equal(lesson.visual.src, null);
  const vocabulary = lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary');
  const words = vocabulary.items;
  const expressions = lesson.sections[0].activities.find((activity) => activity.type === 'expression-study').items;
  assert.ok(words.every((entry) => !/\s/.test(entry.en.trim())), 'phrases and sentences do not live in the word bank');
  for (const required of ['Good morning!', 'Good afternoon!', 'Good evening!', 'Good night!', 'How are you?', "I'm fine, thanks.", 'And you?', 'Nice to meet you!']) {
    assert.ok(expressions.some((entry) => entry.en === required), `${required}: missing from the expression-study module`);
  }
  assert.ok(JSON.stringify(lesson.sections.flatMap(section => section.activities)).includes("What's your name?"), 'ordinary question forms stay in sentence/dialogue practice');
  assert.ok(coreItems(vocabulary).length >= 25, 'essential vocabulary is not capped at a small fixed count');
  assert.deepEqual(supplementaryItems(vocabulary).map((entry) => entry.en), ['Please.', 'Sorry!', 'Hi!']);
  assert.ok(['I', 'my', 'name', 'your'].every(word => coreItems(vocabulary).some(entry => entry.en === word)), 'single words remain vocabulary even when they also participate in sentence patterns');
  const html = renderActivity(vocabulary, { lessonId: 'A1-1', index: 0, e: String, en: String, i: () => '', progress: { wordProgress: {} } });
  assert.match(html, /واژه 1 از/);
  assert.match(html, /واژگان تکمیلی/);
  assert.match(html, /class="supplementary-list"/);
  assert.equal((html.match(/class="supplementary-item"/g) || []).length, supplementaryItems(vocabulary).length, 'supplementary entries are words only');
  assert.equal((html.match(/class="example-gallery"/g) || []).length, 1, 'only the active core card gets an example gallery');
  assert.equal((html.match(/class="example-mini-card"/g) || []).length, 3, 'the active core word keeps its three examples');
  assert.equal((html.match(/data-example-reveal aria-expanded="false"/g) || []).length, 3, 'core examples reveal their taught expression on demand');
  assert.doesNotMatch(html, /supplementary-examples|سه مثال کاربردی/);
  assert.match(html, /class="example-target"/, 'the taught phrase is highlighted when an example is revealed');
});

test('sentence transformations have a single active sentence and a working free response', () => {
  const activity = load('lessons/a1-1.json').sections[0].activities.find(a => a.id === 'hello-transform');
  const context = { lessonId: 'A1-1', index: 0, e: String, en: String, i: () => '', progress: { transformChoices: {}, transformStages: {}, practiceStates: {} } };
  const first = renderActivity(activity, context);
  assert.match(first, /Good morning!/);
  assert.doesNotMatch(first, /I'm not okay\./, 'other sentences stay hidden until selected');
  context.progress.transformChoices['A1-1:hello-transform'] = 1;
  assert.match(renderActivity(activity, context), /How are you\?/);
  context.progress.transformChoices['A1-1:hello-transform'] = 4;
  assert.match(renderActivity(activity, context), /I'm not okay\./);
  context.progress.transformStages['A1-1:hello-transform'] = 'practice';
  assert.match(renderActivity(activity, context), /data-practice-form=/);
  assert.doesNotMatch(renderActivity(activity, context), /class="transform-card"/);
  assert.equal(evaluateResponse(activity.tasks[0].assessment, "I'm okay.").ok, false);
  assert.equal(evaluateResponse(activity.tasks[0].assessment, "I'm not okay!").ok, true);
  assert.equal(evaluateResponse(activity.tasks[1].assessment, 'You are okay.').ok, false);
  assert.match(evaluateResponse(activity.tasks[1].assessment, 'You are okay.').feedback, /خبری/);
  assert.equal(evaluateResponse(activity.tasks[1].assessment, 'Are you okay?').ok, true);
  assert.equal(evaluateResponse(activity.tasks[2].assessment, "No, I'm not.").ok, true);
  assert.equal(evaluateResponse(activity.tasks[2].assessment, 'Yes, I am.').ok, false);
  assert.equal(evaluateResponse(activity.tasks[3].assessment, "I'm okay.").ok, true);
  assert.equal(evaluateResponse(activity.tasks[4].assessment, 'Yes, I am.').ok, true);
});

test('production begins with two-turn question and answer, switching positive and negative', () => {
  const lesson = load('lessons/a1-1.json');
  const exchange = lesson.sections[1].activities[0];
  const context = { lessonId: lesson.id, index: 0, e: String, en: String, i: () => '', progress: { exchangeChoices: {} } };
  const positive = renderActivity(exchange, context);
  assert.equal((positive.match(/class="exchange-bubble /g) || []).length, 2);
  assert.match(positive, /How are you\?/);
  assert.match(positive, /I'm fine, thanks\. And you\?/);
  assert.doesNotMatch(positive, /I'm not okay/);
  context.progress.exchangeChoices['A1-1:hello-exchanges'] = { pair: 0, variant: 1 };
  const negative = renderActivity(exchange, context);
  assert.match(negative, /I'm not okay/);
  assert.doesNotMatch(negative, /I'm fine, thanks/);
  context.progress.exchangeChoices['A1-1:hello-exchanges'] = { pair: 1, variant: 1 };
  assert.match(renderActivity(exchange, context), /No, I'm not/);
  const practice = lesson.sections[1].activities[1];
  assert.equal(practice.tasks.length, 6);
  assert.equal(evaluateResponse(practice.tasks[0].assessment, "I'm fine, thanks. And you?").ok, true);
  assert.equal(evaluateResponse(practice.tasks[1].assessment, "No, I'm not.").ok, true);
  assert.equal(evaluateResponse(practice.tasks[2].assessment, 'Yes, I am.').ok, true);
});

test('each dialogue timeline renders only two consecutive spoken lines and can scrub', () => {
  const lesson = load('lessons/a1-1.json');
  const dialogues = lesson.sections[1].activities.filter((activity) => activity.type === 'dialogue');
  assert.equal(dialogues.length, 2, 'two distinct scenarios are modelled');
  assert.ok(dialogues.reduce((sum, activity) => sum + activity.lines.length, 0) >= 16);
  for (const dialogue of dialogues) {
    const key = `${lesson.id}:${dialogue.id}`;
    const context = { lessonId: lesson.id, index: 0, e: String, en: String, i: () => '', progress: { dialogueSteps: {}, showDialogueTranslation: true } };
    const first = renderActivity(dialogue, context);
    assert.match(first, /data-dialogue-slider=/);
    assert.match(first, /step="0\.01"/, 'slider has continuous, sub-line precision instead of discrete jumps');
    assert.match(first, /data-dialogue-play=/);
    assert.equal((first.match(/data-dialogue-visible="true"/g) || []).length, 2, 'only two lines are exposed in the fixed-height viewport');
    assert.match(first, new RegExp(dialogue.lines[0].speaker));
    assert.match(first, /data-dialogue-line="2" data-dialogue-visible="false" aria-hidden="true" inert/, 'later lines stay inert and hidden from accessibility');
    context.progress.dialogueSteps[key] = dialogue.lines.length - 2;
    const last = renderActivity(dialogue, context);
    assert.equal((last.match(/data-dialogue-visible="true"/g) || []).length, 2);
    assert.ok(last.includes(dialogue.lines.at(-1).en));
    assert.match(last, /data-dialogue-line="0" data-dialogue-visible="false" aria-hidden="true" inert/);
    assert.match(last, /disabled aria-label="نوبت بعدی"/);
    assert.match(last, new RegExp(`data-dialogue-position="${dialogue.lines.length - 2}"`), 'native scroll position is restored after rendering');
    assert.doesNotMatch(last, /--dialogue-step:/, 'the transcript is scrolled natively, not teleported with a CSS transform');
    const nextWindow = renderDialogueLines(dialogue, context, 1, 2);
    assert.match(nextWindow, /data-dialogue-line="2"/);
    assert.equal((nextWindow.match(/dialogue-entering/g) || []).length, 1, 'only one newly revealed sentence animates');
    assert.match(nextWindow, /data-speak=/, 'each visible sentence has a direct replay action');
    const firstSpeaker = dialogue.lines[0].speaker;
    const speakerSide = first.includes(`dialogue-line speaker-first " data-dialogue-line="0"`) ? 'speaker-first' : 'speaker-second';
    const nextFirstSpeaker = nextWindow.match(new RegExp(`class="dialogue-line ([^\"]+)" data-dialogue-line="1"`))?.[1];
    if (dialogue.lines[1].speaker === firstSpeaker) assert.match(nextFirstSpeaker, new RegExp(speakerSide));
  }
});

test('first lesson retrieves morning greetings before the dialogue half', () => {
  const lesson = load('lessons/a1-1.json');
  const activity = lesson.sections[0].activities.find((entry) => entry.id === 'hello-intro-check');
  assert.equal(activity.tasks.length, 5);
  assert.equal(evaluateResponse(activity.tasks[0].assessment, 'Good morning! How are you?').ok, true);
  assert.equal(evaluateResponse(activity.tasks[0].assessment, 'Hello! How are you?').ok, false);
  assert.equal(evaluateResponse(activity.tasks[0].assessment, 'Good morning!').ok, false);
  assert.equal(evaluateResponse(activity.tasks[1].assessment, "Hello! I'm Nima. What's your name?").ok, true);
  const context = { lessonId: 'A1-1', index: 3, e: String, en: String, i: () => '', progress: { practiceStates: {} } };
  const html = renderActivity(activity, context);
  assert.doesNotMatch(html, /class="practice-source"/, 'a new task no longer supplies the complete answer as its source');
});

test('second lesson reuses the shared composer for family relationships and dialogues', () => {
  const lesson = load('lessons/a1-2.json');
  const [foundation, production] = lesson.sections;
  assert.deepEqual(validateLessonFlow(lesson), []);
  assert.deepEqual(foundation.activities.map(a => a.type), ['shadowing','vocabulary','expression-study','composer-view','family-lab','sentence-composer','meaning-cluster','composer-view','sentence-transform','sentence-transform','sentence-builder','response-practice']);
  assert.deepEqual(production.activities.map(a=>a.type), ['exchange-lab','response-practice','dialogue','response-practice','dialogue','response-practice','picture-description','guided-dialogue','dialogue-transfer','free-write','shadowing-review']);
  const vocabulary=foundation.activities.find(a=>a.type==='vocabulary');
  assert.ok(coreItems(vocabulary).length>=18);
  assert.ok(supplementaryItems(vocabulary).length>=8);
  assert.ok(coreItems(vocabulary).every(item=>item.examples.length===3));
  assert.ok(supplementaryItems(vocabulary).every(item=>!item.examples&&!item.hint));
  assert.ok(vocabulary.items.every(item=>!/\s/.test(item.en.trim())));
  assert.deepEqual(auditLesson(lesson).errors, []);
  const source=foundation.activities.find(a=>a.type==='sentence-composer');
  assert.deepEqual(validateSentenceComposer(source), []);
  const base=resolveSentenceComposer(source,{slots:{member:'mother',perspective:'third'},pattern:'role'});
  assert.equal(composeSegments(base.pattern.segments,source,base), 'She is my mother.');
  const brother=resolveSentenceComposer(source,{slots:{member:'brother',perspective:'third'},pattern:'role'});
  assert.equal(composeSegments(brother.pattern.segments,source,brother), 'He is my brother.');
  const direct=resolveSentenceComposer(source,{slots:{member:'sister',perspective:'you'},pattern:'role'});
  assert.equal(composeSegments(direct.pattern.segments,source,direct), 'You are my sister.');
  const cycled=cycleComposerSlot(source,{slots:{member:'mother'}},'member');
  assert.equal(cycled.slots.member,'father');
  const context={lessonId:lesson.id,index:2,e:String,en:String,i:()=>'',activitiesById:Object.fromEntries(foundation.activities.map(a=>[a.id,a])),progress:{familyPeople:{},sentenceComposers:{},exchangeChoices:{},practiceStates:{},dialogueSteps:{},showDialogueTranslation:true}};
  const tree=foundation.activities.find(a=>a.type==='family-lab');
  assert.match(renderActivity(tree,context), /Her name is Nora/);
  context.progress.familyPeople['A1-2:family-tree']=1;
  assert.match(renderActivity(tree,context), /His name is David/);
  assert.match(renderActivity(foundation.activities.find(a=>a.id==='family-models'),context), /data-composer-action="pattern"/);
  const selfRole=foundation.activities.find(a=>a.id==='family-self-role');
  assert.ok(selfRole.forms.some(form=>form.en==="I'm a father."));
  assert.ok(selfRole.forms.some(form=>form.en==="I'm his daughter."));
  assert.equal(evaluateResponse(selfRole.tasks[0].assessment,"I'm a father.").ok,true);
  assert.equal(evaluateResponse(selfRole.tasks[0].assessment,"I'm father.").ok,false);
  const constructed=foundation.activities.find(a=>a.id==='family-intro-check');
  assert.equal(evaluateResponse(constructed.tasks[3].assessment,"Who's this?").ok,true);
  const grammar=foundation.activities.find(a=>a.id==='family-transform');
  assert.equal(evaluateResponse(grammar.tasks[1].assessment,'Is this your brother?').ok,true);
  assert.ok(production.activities[0].pairs.some(pair=>pair.variants.some(v=>v.en==='This is my daughter.')));
  assert.equal(production.activities.filter(a=>a.type==='dialogue').length,2);
});

test('A1-3 uses one JSON-driven sentence composer for owners, objects and grammar', () => {
  const lesson = load('lessons/a1-3.json');
  const foundation = lesson.sections[0];
  const production = lesson.sections[1];
  const composer = foundation.activities.find((activity) => activity.type === 'sentence-composer');
  assert.ok(composer, 'the foundation has one shared sentence composer');
  assert.equal(foundation.activities.filter((activity) => activity.type === 'pattern-lab').length, 0, 'separate owner and object labs are removed');
  assert.deepEqual(validateSchema(readJson(join(projectRoot, 'schemas/sentence-composer.schema.json')), composer), []);
  assert.deepEqual(validateSentenceComposer(composer), []);
  assert.equal(composer.wordSets.owners.length, 4);
  assert.equal(composer.wordSets.objects.length, 20, 'eight core and twelve supplementary objects are data, not renderer code');
  assert.equal(composer.wordSets.objects.filter((item) => item.role === 'core').length, 8);
  assert.equal(composer.wordSets.objects.filter((item) => item.role === 'supplementary').length, 12);
  assert.equal(composer.slots.length, 2, 'owner and object are variables in the same sentence');
  assert.equal(composer.patterns.length, 5, 'phrase, statement, possessive pronoun, question and negative are sentence patterns');
  assert.equal(composer.wordSets.owners.length * composer.wordSets.objects.length, 80, 'all owner/object combinations are generated without per-combination outcomes');
  for (const owner of composer.wordSets.owners) {
    for (const object of composer.wordSets.objects) {
      const selected = { slots: { owner: owner.id, object: object.id } };
      for (const [patternId, expectedStart] of [
        ['statement', object.features.number === 'plural' ? 'These are' : 'This is'],
        ['pronoun', object.features.number === 'plural' ? 'These ' : 'This '],
        ['question', object.features.number === 'plural' ? 'Are these' : 'Is this'],
        ['negative', object.features.number === 'plural' ? 'These are not' : 'This is not']
      ]) {
        const resolved = resolveSentenceComposer(composer, { ...selected, pattern: patternId });
        const sentence = composeSegments(resolved.pattern.segments, composer, resolved);
        assert.ok(sentence.startsWith(expectedStart), owner.id + '/' + object.id + '/' + patternId + ': ' + sentence);
        assert.doesNotMatch(sentence, /undefined|null/);
      }
    }
  }

  const context = {
    lessonId: lesson.id, index: 0,
    activitiesById: Object.fromEntries(lesson.sections.flatMap(section=>section.activities).map(activity=>[activity.id,activity])),
    e: String,
    en: (value) => `<span class="en" lang="en" dir="ltr">${String(value)}</span>`,
    i: () => '',
    progress: { phraseChoices: {}, sentenceComposers: {}, showDialogueTranslation: true }
  };
  const rendered = renderActivity(composer, context);
  assert.match(rendered, /data-composer-action="cycle"/);
  assert.match(rendered, /data-composer-slot="owner"/);
  assert.match(rendered, /data-composer-slot="object"/);
  assert.doesNotMatch(rendered, /data-composer-action="pattern"/, "pattern changes are taught later, not in the initial sentence");
  const defaultResolved = resolveSentenceComposer(composer, {});
  assert.equal(composeSegments(defaultResolved.pattern.segments, composer, defaultResolved), 'This is my book.');
  assert.doesNotMatch(rendered, /class="phrase-slot"/, 'there are no separate owner/object selectors outside the sentence');
  assert.doesNotMatch(rendered, /composer-picker|composer-choice|composer-search/, 'no manual word picker or search is rendered');
  const next = cycleComposerSlot(composer, { slots: { owner: 'me', object: 'book' } }, 'object');
  assert.equal(next.slots.object, composer.wordSets.objects[1].id, 'a tap advances to the next JSON word');
  const last = composer.wordSets.objects.at(-1).id;
  assert.equal(cycleComposerSlot(composer, { slots: { object: last } }, 'object').slots.object, composer.wordSets.objects[0].id, 'cycling wraps around');
  const phrases = foundation.activities.find(activity => activity.id === 'ownership-inline-phrases');
  assert.match(renderActivity(phrases, context), /data-composer-action="cycle"/);
  assert.match(renderActivity(foundation.activities.find(activity => activity.id === 'ownership-models'), context), /data-composer-action="pattern"/);

  const saved = { slots: { owner: 'she', object: 'keys' }, pattern: 'statement' };
  const statement = resolveSentenceComposer(composer, saved);
  assert.equal(composeSegments(statement.pattern.segments, composer, statement), 'These are her keys.');
  assert.equal(composeSegments(statement.pattern.translationSegments, composer, statement), 'این‌ها کلیدها متعلق به او هستند.');
  for (const [pattern, expected] of [
    ['pronoun', 'These keys are hers.'],
    ['question', 'Are these her keys?'],
    ['negative', 'These are not her keys.']
  ]) {
    const resolved = resolveSentenceComposer(composer, { ...saved, pattern });
    assert.equal(composeSegments(resolved.pattern.segments, composer, resolved), expected);
  }

  const lookup = Object.fromEntries(lesson.sections.flatMap((section) => section.activities).map((activity) => [activity.id, activity]));
  const dialogue = production.activities.find((activity) => activity.id === 'ownership-dialogue-found');
  assert.ok(dialogue.lines.every((line) => line.sourceActivityId === composer.id && line.segments && line.translationSegments), 'dialogue lines are JSON templates bound to the same slots');
  const dialogueContext = {
    ...context,
    activitiesById: lookup,
    progress: { ...context.progress, sentenceComposers: { 'A1-3:ownership-sentence-composer': saved } }
  };
  const dialogueHtml = renderDialogueLines(dialogue, dialogueContext, 0, -1, { all: true });
  assert.match(dialogueHtml, /Are these your keys\?/);
  assert.match(dialogueHtml, /they're her keys\./);
  assert.match(dialogueHtml, /Yes, they're mine\./);

  const vocabulary = foundation.activities.find((activity) => activity.type === 'vocabulary');
  assert.equal(coreItems(vocabulary).length, 18);
  assert.equal(supplementaryItems(vocabulary).length, 5);
  assert.ok(vocabulary.items.every(item=>!/\s/.test(item.en.trim())));
  assert.ok(supplementaryItems(vocabulary).every((entry) => !entry.examples && !entry.hint), 'supplementary vocabulary remains list-only');
  assert.ok(vocabulary.items.filter((entry) => entry.role !== 'supplementary').every((entry) => entry.examples?.length === 3));
  assert.equal(lesson.visual.src, './a1-3-personal-belongings.svg');
  const serviceWorker = readFileSync(join(projectRoot, 'apps/learner-web/sw.js'), 'utf8');
  assert.ok(serviceWorker.includes('tutivar-ui-v6-network-first'));
  assert.ok(serviceWorker.includes("'./visual-learning.js'"), 'visual learning module is cached');
  assert.ok(serviceWorker.includes("'./sentence-composer.js'"), 'the shared composer runtime is precached for offline use');
  assert.match(readFileSync(join(projectRoot, 'apps/learner-web/a1-3-personal-belongings.svg'), 'utf8'), /<svg/);
  const optionalHtml = renderActivity(vocabulary, { lessonId: lesson.id, index: 0, e: String, en: String, i: () => '', progress: { wordProgress: {} } });
  assert.equal((optionalHtml.match(/class="supplementary-item"/g) || []).length, supplementaryItems(vocabulary).length);
  assert.deepEqual(auditLesson(lesson).errors, [], 'focus phrases have guided and independent production');
});

test('lesson audit identifies missing downstream production and keeps supplementary phrases optional', () => {
  const lesson = load('lessons/a1-1.json');
  const result = auditLesson(lesson);
  assert.deepEqual(result.errors, []);
  assert.equal(result.coreCount, 27);
  assert.equal(result.supplementaryCount, 3);
  const morning = result.rows.find((row) => row.phrase === 'Good morning!');
  assert.ok(morning.guided.includes('hello-intro-check'));
  assert.ok(morning.guided.includes('hello-guided-talk'));
  assert.ok(morning.independent.includes('hello-write'));
  const changed = structuredClone(lesson);
  const final = changed.sections[1].activities.find((activity) => activity.id === 'hello-write');
  final.assessment.required = final.assessment.required.filter((group) => !group.any?.includes('good morning'));
  assert.ok(auditLesson(changed).errors.some((error) => error.includes('Good morning') && error.includes('independent')));
  const loose = structuredClone(lesson);
  const morningRequirement = loose.sections[1].activities.find((activity) => activity.id === 'hello-write').assessment.required[0];
  morningRequirement.any.push('hello');
  assert.ok(!auditLesson(loose).errors.some((error) => error.includes('Good morning') && error.includes('alternatives')), 'a real-world greeting may vary with time of day');
});

test('guided dialogue supports feedback, correction, alternate names, mastery and revised tasks', () => {
  const activity = load('lessons/a1-1.json').sections[1].activities.find((entry) => entry.type === 'guided-dialogue');
  const key = activity.turns[1].assessment;
  assert.equal(evaluateResponse(key, "Your name is Ali. What's your name?").ok, false);
  assert.match(evaluateResponse(key, "Your name is Ali. What's your name?").feedback, /Your name is/);
  assert.equal(evaluateResponse(key, "I'm Leila. What's your name?").ok, true);
  assert.equal(evaluateResponse(activity.turns[0].assessment, 'Good morning! I am fine, thanks. And you?').ok, true);
  assert.equal(evaluateResponse(activity.turns[0].assessment, 'Hello! I am fine, thanks. And you?').ok, false, 'the morning greeting is actively retrieved');
  assert.equal(evaluateResponse(activity.turns[0].assessment, 'Good morning! I am fine, thanks. How are you?').ok, false, 'practice the short return question');
  const html = renderActivity(activity, { lessonId: 'A1-1', index: 2, e: String, en: String, i: () => '', progress: { practiceStates: {} } });
  assert.match(html, /practice-listening/);
  assert.match(html, /practice-audio-fallback/);
  assert.match(html, /data-speak="Good morning! How are you\?"/);
  let state = practiceState(null, activity);
  const rejected = submitPractice(state, activity, 'Good morning!',);
  assert.equal(rejected.result.ok, false);
  assert.equal(rejected.state.answers.length, 0);
  assert.equal(rejected.state.attempts, 1);
  state = submitPractice(rejected.state, activity, 'Good morning! I am fine, thanks. And you?').state;
  assert.equal(state.answers.length, 1);
  state = submitPractice(state, activity, "I'm Omar. What's your name?").state;
  state = submitPractice(state, activity, 'Nice to meet you too, goodbye!').state;
  state = submitPractice(state, activity, 'Nice to meet you too, Sara!').state;
  state = submitPractice(state, activity, 'Bye, Sara! See you!').state;
  assert.equal(state.answers.length, activity.turns.length);
  assert.equal(practiceState(state, { ...activity, practiceRevision: activity.practiceRevision + 1 }).answers.length, 0, 'new exercise revision invalidates old answers');
});

test('transfer and independent production require communication, not arbitrary submissions', () => {
  const lesson = load('lessons/a1-1.json');
  const transfer = lesson.sections[1].activities.find((entry) => entry.type === 'dialogue-transfer');
  assert.match(evaluateResponse(transfer.turns[0].assessment, "Hello! I'm fine, thanks. What's your name? I'm Nima.").feedback, /اسم خودش/);
  assert.equal(evaluateResponse(transfer.turns[0].assessment, "Hi, I'm good, thanks. My name is Leila.").ok, true);
  const production = lesson.sections[1].activities.find((entry) => entry.type === 'free-write');
  assert.equal(evaluateResponse(production.assessment, 'Hello!').ok, false);
  assert.equal(evaluateResponse(production.assessment, "Good morning! How are you? I'm Nima. What's your name? Bye!").ok, false, 'both a response and a reciprocal question are necessary');
  assert.equal(evaluateResponse(production.assessment, "Good morning! How are you? I'm fine, thanks. And you? I'm Nima. What's your name? Nice to meet you! Bye!").ok, true);
});

test('supplementary items are excluded from mandatory vocabulary stages', () => {
  const activity = { deckRevision: 1, items: [
    { en: 'Hello!', fa: 'سلام' },
    { en: 'Good evening!', role: 'supplementary', fa: 'عصر بخیر' },
    { en: 'Bye!', fa: 'خداحافظ' }
  ] };
  let state = advanceDeck(deckState(null, activity), activity, 'test');
  assert.equal(state.index, 1);
  assert.deepEqual(state.queue, ['Hello!']);
  state = advanceDeck(state, activity, 'known');
  assert.equal(state.phase, 'test');
  assert.deepEqual(Object.keys(state.decisions), ['Hello!', 'Bye!']);
  const done = answerDeck(state, activity, 'Hello!');
  assert.equal(done.state.phase, 'done');
  assert.equal(done.state.queue.length, 0);
  assert.equal(deckState({ ...done.state, decisions: { ...done.state.decisions, 'Good evening!': 'test' }, queue: ['Good evening!'] }, activity).queue.length, 0);
});


test('previously taught supplementary words are reused in dialogue, never relisted in later vocabulary', () => {
  const first = load('lessons/a1-1.json');
  const second = load('lessons/a1-2.json');
  const firstVocabulary = first.sections[0].activities.find((activity) => activity.type === 'vocabulary');
  const secondVocabulary = second.sections[0].activities.find((activity) => activity.type === 'vocabulary');
  assert.ok(supplementaryItems(firstVocabulary).some((item) => item.en === 'Please.'));
  assert.ok(!secondVocabulary.items.some((item) => item.en === 'Please.'), 'supplementary vocabulary from a prior lesson is already introduced');
  assert.ok(second.learningAudit.focusExpressions.includes('Please.'));
  assert.ok(second.sections[1].activities.find((activity) => activity.id === 'family-dialogue').lines.some((line) => line.en === 'Please, come in.'));
  assert.deepEqual(auditLesson(second).errors, [], 'the phrase is seen, guided and required in independent production');
});

test('whole-bank vocabulary test starts without per-word self-rating buttons', () => {
  const activity = { deckRevision: 1, items: [
    { en: 'book', fa: 'کتاب' },
    { en: 'phone', fa: 'تلفن' },
    { en: 'ID card', role: 'supplementary', fa: 'کارت شناسایی' }
  ] };
  const state = startDeckTest(deckState(null, activity), activity);
  assert.equal(state.phase, 'test');
  assert.deepEqual(state.queue, ['book', 'phone']);
  assert.deepEqual(Object.values(state.decisions), ['test', 'test']);
});

test('mini-Leitner accepts flexible answers and removes successful cards', () => {
  const activity = { deckRevision: 2, items: [
    { en: 'Good morning!', fa: 'صبح بخیر' },
    { en: "I'm fine, thanks.", fa: 'خوبم', testAnswers: ['I am fine, thank you'] },
    { en: 'Bye!', fa: 'خداحافظ' }
  ] };
  let state = deckState(null, activity);
  state = advanceDeck(state, activity, 'known');
  state = advanceDeck(state, activity, 'test');
  state = advanceDeck(state, activity, 'known');
  assert.equal(state.phase, 'test');
  assert.equal(state.queue.length, 1);
  assert.equal(checkWordAnswer(activity.items[1], 'I am fine, thank you!'), true);
  const answer = answerDeck(state, activity, 'i am fine thank you');
  assert.equal(answer.correct, true);
  assert.equal(answer.state.phase, 'done');
  assert.equal(answer.state.queue.length, 0);
});

test('wrong answer triggers another review and remains in queue until passed or skipped', () => {
  const activity = { deckRevision: 1, items: [{ en: 'How are you?', fa: 'حالت چطوره؟' }] };
  let state = advanceDeck(deckState(null, activity), activity, 'test');
  const wrong = answerDeck(state, activity, 'Good night');
  assert.equal(wrong.correct, false);
  assert.equal(wrong.state.phase, 'retry');
  assert.equal(wrong.state.failed['How are you?'], 1);
  assert.equal(wrong.state.queue.length, 1);
  state = resumeDeck(wrong.state, activity);
  assert.equal(state.phase, 'test');
  assert.equal(answerDeck(state, activity, 'how are you').state.phase, 'done');
  assert.equal(resumeDeck(wrong.state, activity, true).queue.length, 0);
});

test('100-word JSON list can be scrubbed without requiring 100 responses', () => {
  const activity = { deckRevision: 1, batchSize: 10, items: Array.from({length: 100}, (_, i) => ({ en: `Word ${i + 1}`, fa: `کلمه ${i + 1}`, examples: ['One.', 'Two.', 'Three.'] })) };
  let state = jumpDeck(null, activity, 94);
  assert.equal(state.index, 94);
  state = advanceDeck(state, activity, 'test');
  state = jumpDeck(state, activity, 99);
  state = advanceDeck(state, activity, 'known');
  assert.equal(state.phase, 'test');
  assert.deepEqual(state.queue, ['Word 95']);
  const context = { lessonId: 'A1-1', index: 0, e: String, en: String, i: () => '', progress: { wordProgress: { 'A1-1:many': state } } };
  const html = renderActivity({ ...activity, id: 'many', type: 'vocabulary', title: 'Many words' }, context);
  assert.match(html, /کارت باقی‌مانده/);
});

test('presentation is independent of course content and never hardcodes target phrases', () => {
  const app = readFileSync(join(projectRoot, 'apps/learner-web/app.js'), 'utf8');
  assert.ok(app.includes("contentUrl('manifest.json')"));
  assert.ok(app.includes('entry.file'));
  assert.ok(app.includes('fetch(contentUrl(level.curriculumFile))'));
  assert.ok(app.includes('new URL(import.meta.url).searchParams'));
  assert.ok(app.includes('renderActivity'));
  assert.ok(app.includes('lessonOrientation'));
  assert.ok(app.includes('lesson-overview'));
  assert.ok(app.includes('sectionCompleted'), 'each lesson half tracks its own completion');
  assert.ok(app.includes('data-finish-section'), 'each half gets an independent completion action');
  assert.ok(app.includes('activeSection'), 'the route chooses only the current half');
  assert.ok(!app.includes('target?.scrollIntoView'), 'section navigation is by route, not scrolling');
  assert.ok(!app.includes("I'm Sara."));
  assert.ok(!app.includes('This is my mother.'));
  assert.ok(!app.includes('این مسیر بر اساس فهرست'));
  assert.ok(!app.includes('اینجا مسیر توست'));
});

test('A1-4 teaches ball-and-box positions before transferring to familiar objects', () => {
  const lesson = load('lessons/a1-4.json');
  const foundation = lesson.sections[0].activities;
  const production = lesson.sections[1].activities;
  const construction = foundation.find(activity => activity.id === 'places-construction');
  assert.equal(construction.tasks.length, 5);
  assert.ok(construction.tasks.every(task => /توپ|جعبه/.test(task.task)));
  assert.ok(construction.tasks.some(task => task.example === 'The ball is above the box.'));
  assert.ok(construction.tasks.some(task => task.example === 'The ball is not behind the box.'));
  assert.equal(evaluateResponse(construction.tasks[2].assessment, 'The ball is above the box.').ok, true);
  assert.equal(evaluateResponse(construction.tasks[2].assessment, 'The ball is on the box.').ok, false);
  const exchanges = production.find(activity => activity.id === 'places-exchange-practice');
  assert.ok(exchanges.tasks.every(task => /توپ|جعبه|بله|نه/.test(task.task)));
  const dialogue = production.find(activity => activity.id === 'places-dialogue');
  assert.ok(dialogue.lines.every(line => !/book|phone|keys/i.test(line.en)));
  assert.ok(dialogue.lines.some(line => /not above it/.test(line.en)));
  const transfer = production.find(activity => activity.id === 'places-transfer');
  assert.ok(transfer.turns.some(turn => /book/.test(turn.incoming || '')));
  assert.deepEqual(auditLesson(lesson).errors, []);
});

test('A1-5 merges visual singular/plural, uses inline a/an and teaches arithmetic', () => {
  const lesson = load('lessons/a1-5.json');
  const [foundation, production] = lesson.sections;
  assert.deepEqual(validateLessonFlow(lesson), []);
  assert.deepEqual([...new Set(foundation.activities.map(a => a.phase))],LESSON_PHASES.foundation);
  const vocabulary = foundation.activities.find(a => a.type === 'vocabulary');
  assert.ok(coreItems(vocabulary).length >= 20);
  assert.ok(vocabulary.items.every(item=>!/\\s/.test(item.en.trim())));
  for(const word of ['plus','minus','equals'])assert.ok(vocabulary.items.some(item=>item.en===word));
  const expressions=foundation.activities.find(a=>a.type==='expression-study');
  assert.deepEqual(expressions.items.map(item=>item.en),['How many','What color','How many red balls']);
  assert.ok(vocabulary.items.some(item=>item.en==='eleven'));
  assert.ok(vocabulary.items.some(item=>item.en==='twelve'));
  const colorLab=foundation.activities.find(a=>a.id==='count-color-tap');
  const colorHtml=renderActivity(colorLab,{lessonId:'A1-5',index:0,e:String,en:String,i:()=>'',progress:{}});
  assert.match(colorHtml,/data-attribute-field="color"/);
  assert.ok(!foundation.activities.some(a=>a.type==='count-visual'),'duplicated visual counting removed');
  assert.ok(!foundation.activities.some(a=>a.type==='meaning-cluster'),'spread-out one/a/an cards removed');
  const singularPlural=foundation.activities.find(a=>a.type==='plural-pair-lab');
  assert.equal(singularPlural.items[0].singular,'fish');
  assert.equal(singularPlural.items[0].plural,'fish');
  assert.ok(singularPlural.items.some(item=>item.singular==='person'&&item.plural==='people'));
  const c={lessonId:'A1-5',index:0,e:String,en:String,i:()=>'',progress:{}};
  const contrastHtml=renderActivity(singularPlural,c);
  assert.match(contrastHtml,/one /);
  assert.match(contrastHtml,/two /);
  assert.equal((contrastHtml.match(/data-plural-lab-key=/g)||[]).length,2,'both nouns tap to cycle');
  assert.doesNotMatch(contrastHtml,/اسم بعدی/,'no extra cycling button');
  const math=foundation.activities.find(a=>a.type==='count-math-lab');
  assert.ok(math.items.some(item=>item.singular==='apple'));
  const mathHtml=renderActivity(math,c);
  assert.match(mathHtml,/count-math-equation/);
  assert.match(mathHtml,/data-count-math-key/);
  assert.match(mathHtml,/plus one apple equals two apples/i);
  assert.match(mathHtml,/data-math-action="operator"/);
  const subtract=renderActivity(math,{...c,progress:{mathOps:{'A1-5:counting-math':true}}});
  assert.match(subtract,/minus one apple equals one apple/i);
  const article=foundation.activities.find(a=>a.id==='counting-article-composer');
  assert.deepEqual(validateSentenceComposer(article),[]);
  const a=resolveSentenceComposer(article,{pattern:'a',slots:{aNoun:'book'}});
  assert.equal(composeSegments(a.pattern.segments,article,a),'This is a book.');
  const an=resolveSentenceComposer(article,{pattern:'an',slots:{anNoun:'apple'}});
  assert.equal(composeSegments(an.pattern.segments,article,an),'This is an apple.');
  assert.match(renderActivity(article,c),/data-composer-action="cycle"/);
  const anView=foundation.activities.find(a=>a.id==='counting-article-an');
  assert.match(renderActivity(anView,{...c,activitiesById:Object.fromEntries(foundation.activities.map(a=>[a.id,a]))}),/data-composer-action="cycle"/);
  const composer=foundation.activities.find(a=>a.id==='counting-composer');
  assert.deepEqual(validateSentenceComposer(composer),[]);
  const question=resolveSentenceComposer(composer,{pattern:'how-many',slots:{object:'book',count:'three'}});
  assert.equal(composeSegments(question.pattern.segments,composer,question),'How many books are there?');
  const practice=foundation.activities.find(a=>a.id==='counting-construction');
  assert.ok(practice.tasks.length>=8);
  assert.ok(practice.tasks.some(task=>/plus/.test(task.example)));
  assert.ok(practice.tasks.some(task=>/minus/.test(task.example)));
  assert.ok(production.activities.find(a=>a.type==='free-write').prompt.includes('جمع ساده'));
  assert.deepEqual(auditLesson(lesson).errors,[]);
});

test('active canonical lesson word banks introduce lexical items only once', () => {
  const lessons=[1,2,3,4,5].map(i=>load('lessons/a1-'+i+'.json')).concat(load('lessons/a1-6-v2.json'));
  assert.deepEqual(inspectVocabularyContinuity(lessons),[]);
  const lessonFive=lessons[4];
  const words=lessonFive.sections[0].activities.find(a=>a.type==='vocabulary').items.map(x=>x.en);
  for(const word of ['book','phone','bag','keys','box'])assert.ok(!words.includes(word),word+' was already taught');
  assert.ok(lessonFive.sections[1].activities.some(a=>JSON.stringify(a).includes('book')),'review is retained in contextual exercises');
});
test('A1-6 completes two-digit numbers before teaching age, without retesting names', () => {
  const lesson=load('lessons/a1-6.json');
  assert.deepEqual(validateLessonFlow(lesson),[]);
  const foundation=lesson.sections[0].activities,production=lesson.sections[1].activities;
  const words=foundation.find(a=>a.type==='vocabulary');
  assert.ok(coreItems(words).length>=20);
  assert.ok(words.items.every(item=>!/\\s/.test(item.en.trim())));
  assert.ok(words.items.every(item=>!['name','first','last','spell','surname','birthday'].includes(item.en)));
  assert.ok(words.items.some(item=>item.en==='ninety'));
  const index=id=>foundation.findIndex(a=>a.id===id);
  assert.ok(index('age-number-composer')<index('age-expressions'));
  assert.ok(index('age-numbers-practice')<index('age-expressions'));
  assert.ok(index('age-numbers-practice')<index('age-composer'));
  assert.ok(!foundation[0].lines.some(line=>/how old|surname|last name/i.test(line)),'first exposure is numbers-only shadowing');
  const numberBuilder=foundation.find(a=>a.id==='age-number-composer');
  assert.deepEqual(validateSentenceComposer(numberBuilder),[]);
  const number=resolveSentenceComposer(numberBuilder,{pattern:'compound',slots:{tens:'forty',units:'seven'}});
  assert.equal(composeSegments(number.pattern.segments,numberBuilder,number),'forty-seven');
  const singleTens=resolveSentenceComposer(numberBuilder,{pattern:'exact-tens',slots:{tens:'thirty',units:'eight'}});
  assert.equal(composeSegments(singleTens.pattern.segments,numberBuilder,singleTens),'thirty');
  const numberPractice=foundation.find(a=>a.id==='age-numbers-practice');
  assert.ok(numberPractice.tasks.some(task=>task.task.includes('۳۷')));
  assert.ok(numberPractice.tasks.some(task=>task.task.includes('۱۰۰')));
  const ageComposer=foundation.find(a=>a.id==='age-composer');
  assert.deepEqual(validateSentenceComposer(ageComposer),[]);
  const question=resolveSentenceComposer(ageComposer,{pattern:'question',slots:{person:'sara',age:'twenty-four'}});
  assert.equal(composeSegments(question.pattern.segments,ageComposer,question),'How old is Sara?');
  const age=resolveSentenceComposer(ageComposer,{pattern:'statement',slots:{person:'sara',age:'twenty-four'}});
  assert.equal(composeSegments(age.pattern.segments,ageComposer,age),'Sara is twenty-four years old.');
  assert.ok(!production.some(a=>JSON.stringify(a).includes('What is your last name?')));
  const picture=production.find(a=>a.type==='picture-description');
  assert.equal(picture.tasks.length,4);
  assert.ok(picture.tasks.every(task=>!task.task.includes('نام کامل')));
  const free=production.find(a=>a.type==='free-write');
  assert.ok(free.prompt.includes('ساختگی'));
  assert.ok(free.prompt.includes('عدد دورقمی'));
  const arbitraryAge='twenty-seven, forty-three, sixty-eight\nHow old are you?\nI am twenty-seven years old.\nThis is my brother. He is thirty-five years old.';
  assert.equal(evaluateResponse(free.assessment,arbitraryAge).ok,true,'personalized age is accepted');
  assert.deepEqual(auditLesson(lesson).errors,[]);
  assert.match(readFileSync(join(projectRoot,'apps/learner-web/assets/scene-a1-6.svg'),'utf8'),/Sara Rahimi/);
});
test('asking a name is explicitly taught and assessed in A1-1', () => {
  const lesson=load('lessons/a1-1.json');
  assert.ok(lesson.goal.includes("What's your name?"));
  const expressions=lesson.sections[0].activities.find(a=>a.type==='expression-study').items;
  assert.ok(expressions.some(item=>item.en==="What's your name?"));
  const check=lesson.sections[0].activities.find(a=>a.id==='hello-intro-check');
  assert.ok(check.tasks.some(task=>task.assessment.required.some(req=>req.any?.includes("what's your name"))));
});

test('A1-7 keeps prior dialogue vocabulary out and synchronizes this/that with dynamic scene and arrow', () => {
  const lesson=load('lessons/a1-7.json');
  assert.deepEqual(validateLessonFlow(lesson),[]);
  const [foundation,production]=lesson.sections, vocabulary=foundation.activities.find(a=>a.type==='vocabulary');
  assert.ok(coreItems(vocabulary).length>=18);
  assert.ok(supplementaryItems(vocabulary).length>=5);
  assert.ok(!vocabulary.items.some(item=>['this','who','what','book','phone','teacher','student','friend','yes','no','it','picture','boy','girl'].includes(item.en)));
  const earlier=[1,2,3,4,5,6].map(i=>JSON.stringify(load('lessons/a1-'+i+'.json')).toLowerCase());
  for(const item of vocabulary.items)for(const old of earlier)
    assert.ok(!new RegExp('\\b'+item.en+'\\b','i').test(old),'previously used word unexpectedly reintroduced: '+item.en);
  const source=foundation.activities.find(a=>a.id==='identification-composer');
  assert.deepEqual(validateSentenceComposer(source),[]);
  const near=resolveSentenceComposer(source,{pattern:'point-object',slots:{distance:'this',object:'cat',person:'teacher'}});
  assert.equal(composeSegments(near.pattern.segments,source,near),'This is a cat.');
  const far=resolveSentenceComposer(source,{pattern:'point-object',slots:{distance:'that',object:'dog',person:'teacher'}});
  assert.equal(composeSegments(far.pattern.segments,source,far),'That is a dog.');
  const sceneNear=renderActivity(source,{lessonId:'A1-7',index:0,e:String,en:String,i:()=>'',progress:{sentenceComposers:{}}});
  const sceneFar=renderActivity(source,{lessonId:'A1-7',index:0,e:String,en:String,i:()=>'',progress:{sentenceComposers:{'A1-7:identification-composer':{slots:{distance:'that',object:'dog',person:'teacher'}}}}});
  assert.match(sceneNear,/data-perspective-distance="this"/);
  assert.match(sceneNear,/data-perspective-object="cat"/);
  assert.match(sceneNear,/data-composer-slot="distance"/);
  assert.match(sceneNear,/data-composer-slot="object"/);
  assert.match(sceneNear,/marker-end="url\(#perspective-/);
  assert.match(sceneFar,/data-perspective-distance="that"/);
  assert.match(sceneFar,/data-perspective-object="dog"/);
  assert.match(sceneFar,/That<\/button>/);
  const next=cycleComposerSlot(source,{slots:{distance:'this',object:'cat',person:'teacher'}},'distance');
  assert.equal(next.slots.distance,'that');
  const noun=cycleComposerSlot(source,{slots:{distance:'that',object:'cat',person:'teacher'}},'object');
  assert.equal(noun.slots.object,'dog');
  const personView=foundation.activities.find(a=>a.id==='identify-models');
  assert.equal(personView.patternId,'point-person');
  const viewHtml=renderActivity(personView,{lessonId:'A1-7',index:0,e:String,en:String,i:()=>'',progress:{sentenceComposers:{}},activitiesById:Object.fromEntries(foundation.activities.map(a=>[a.id,a]))});
  assert.match(viewHtml,/data-perspective-object="teacher"/);
  assert.match(viewHtml,/data-composer-slot="distance"/);
  assert.ok(production.activities.find(a=>a.type==='guided-dialogue').turns.some(turn=>turn.example==='Who is that?'));
  assert.match(readFileSync(join(projectRoot,'apps/learner-web/assets/scene-a1-7.svg'),'utf8'),/Near: this/);
  assert.deepEqual(auditLesson(lesson).errors,[]);
});
test('A1-8 names rooms and aligns a tap-to-change sentence with the highlighted home floor plan', () => {
  const lesson=load('lessons/a1-8.json');
  const [foundation,production]=lesson.sections;
  assert.deepEqual(validateLessonFlow(lesson),[]);
  assert.deepEqual([...new Set(foundation.activities.map(a=>a.phase))],LESSON_PHASES.foundation);
  assert.deepEqual([...new Set(production.activities.map(a=>a.phase))],LESSON_PHASES.production);
  const vocabulary=foundation.activities.find(a=>a.type==='vocabulary');
  assert.ok(coreItems(vocabulary).length>=12);
  assert.ok(supplementaryItems(vocabulary).length>=6);
  for(const old of ['room','mother','father','sister','brother','book','in','where','this','table'])
    assert.ok(!vocabulary.items.some(item=>item.en===old),'previous teaching should be used but not relisted: '+old);
  assert.ok(vocabulary.items.every(item=>!/\\s/.test(item.en.trim())));
  const comp=foundation.activities.find(a=>a.id==='rooms-composer');
  assert.deepEqual(validateSentenceComposer(comp),[]);
  const kitchen=resolveSentenceComposer(comp,{pattern:'location',slots:{person:'mother',room:'kitchen'}});
  assert.equal(composeSegments(kitchen.pattern.segments,comp,kitchen),'My mother is in the kitchen.');
  const balcony=resolveSentenceComposer(comp,{pattern:'location',slots:{person:'sister',room:'balcony'}});
  assert.equal(composeSegments(balcony.pattern.segments,comp,balcony),'My sister is on the balcony.');
  const scene=renderActivity(comp,{lessonId:'A1-8',index:0,e:String,en:String,i:()=>'',progress:{sentenceComposers:{'A1-8:rooms-composer':{slots:{room:'garden'}}}}});
  assert.match(scene,/data-room-selected="garden"/);
  assert.match(scene,/GARDEN/);
  assert.match(scene,/data-composer-slot="room"/);
  const roomView=foundation.activities.find(a=>a.id==='rooms-names');
  assert.match(renderActivity(roomView,{lessonId:'A1-8',index:0,e:String,en:String,i:()=>'',progress:{sentenceComposers:{}},activitiesById:Object.fromEntries(foundation.activities.map(a=>[a.id,a]))}),/data-room-selected="kitchen"/);
  assert.ok(foundation.activities.find(a=>a.type==='expression-study').items.some(item=>item.en==='living room'));
  assert.ok(production.activities.find(a=>a.type==='free-write').prompt.includes('واقعی یا خیالی'));
  assert.match(readFileSync(join(projectRoot,'apps/learner-web/assets/scene-a1-8.svg'),'utf8'),/KITCHEN/);
  assert.deepEqual(auditLesson(lesson).errors,[]);
});

test('A1-8 builds count, level, area and compound positions with synchronized images', () => {
  const lesson=load('lessons/a1-8.json'),f=lesson.sections[0].activities,p=lesson.sections[1].activities;
  assert.deepEqual(validateLessonFlow(lesson),[]);
  const vocab=f.find(a=>a.type==='vocabulary').items.map(x=>x.en);
  assert.ok(vocab.includes('ceiling') && vocab.includes('roof'));
  assert.ok(!vocab.includes('window') && !vocab.includes('door') && !vocab.includes('wall'),'previously taught words remain review-only');
  const facts=f.find(a=>a.id==='house-facts-composer');
  assert.deepEqual(validateSentenceComposer(facts),[]);
  const render=(pattern,slots)=>{const state=resolveSentenceComposer(facts,{pattern,slots});return composeSegments(state.pattern.segments,facts,state)};
  assert.equal(render('count',{amount:'one',feature:'bedroom'}),'There is one bedroom in my home.');
  assert.equal(render('count',{amount:'two',feature:'bedroom'}),'There are two bedrooms in my home.');
  assert.equal(render('count',{amount:'three',feature:'window'}),'There are three windows in my home.');
  assert.equal(render('floor',{level:'second'}),'My apartment is on the second floor.');
  assert.equal(render('area',{area:'eighty'}),'My apartment is eighty square meters.');
  const ctx={lessonId:'A1-8',index:1,e:String,en:String,i:()=>'',activitiesById:Object.fromEntries(f.map(a=>[a.id,a])),progress:{sentenceComposers:{}}};
  const countView=f.find(a=>a.id==='house-counts');
  const visual=renderActivity(countView,ctx);
  assert.match(visual,/data-house-fact="count"/);
  assert.match(visual,/data-house-quantity="2"/);
  assert.match(visual,/data-composer-slot="amount"/);
  assert.match(visual,/data-composer-slot="feature"/);
  assert.match(renderActivity(f.find(a=>a.id==='house-floor'),ctx),/data-house-fact="floor"/);
  assert.match(renderActivity(f.find(a=>a.id==='house-area'),ctx),/data-house-fact="area"/);
  const rooms=f.find(a=>a.id==='rooms-composer');
  assert.deepEqual(validateSentenceComposer(rooms),[]);
  const st=resolveSentenceComposer(rooms,{pattern:'compound-object',slots:{object:'bag',position:'on',room:'kitchen'}});
  assert.equal(composeSegments(st.pattern.segments,rooms,st),'My bag is on the table in the kitchen.');
  const free=p.find(a=>a.type==='free-write');
  const answer='This is the living room. This is the kitchen. There are two bedrooms in my home. My apartment is on the second floor. My apartment is eighty square meters. Where is my mother? She is in the kitchen. My bag is on the table in the kitchen.';
  assert.equal(evaluateResponse(free.assessment,answer).ok,true);
  assert.deepEqual(auditLesson(lesson).errors,[]);
});
test('A1-9 teaches positioning objects with synchronized noun, preposition and support', () => {
  const lesson=load('lessons/a1-9.json'),f=lesson.sections[0].activities,p=lesson.sections[1].activities;
  assert.deepEqual(validateLessonFlow(lesson),[]);
  const vocab=f.find(a=>a.type==='vocabulary');
  assert.ok(coreItems(vocab).length>=10);
  assert.ok(supplementaryItems(vocab).length>=5);
  for(const known of ['book','phone','bag','desk','bed','shelf','window','door','in','on','under','next','to'])
    assert.ok(!vocab.items.some(x=>x.en===known),'already-taught '+known+' cannot re-enter the word bank');
  assert.ok(vocab.items.every(x=>!x.role||!x.examples),'supplementary lexical items remain optional');
  const comp=f.find(a=>a.id==='room-object-composer');
  assert.deepEqual(validateSentenceComposer(comp),[]);
  const sentence=(pattern,slots)=>{
    const state=resolveSentenceComposer(comp,{pattern,slots});
    return composeSegments(state.pattern.segments,comp,state);
  };
  assert.equal(sentence('object-location',{object:'book',position:'on',surface:'desk'}),'My book is on the desk in my bedroom.');
  assert.equal(sentence('object-location',{object:'bag',position:'under',surface:'bed'}),'My bag is under the bed in my bedroom.');
  assert.equal(sentence('near-window',{object:'phone',position:'next-to',surface:'shelf'}),'My phone is next to the shelf near the window.');
  assert.equal(sentence('where',{object:'bag'}),'Where is my bag?');
  const ctx={lessonId:'A1-9',index:0,e:String,en:String,i:()=>'',progress:{sentenceComposers:{'A1-9:room-object-composer':{slots:{object:'bag',position:'under',surface:'bed'}}}}};
  const html=renderActivity(comp,ctx);
  assert.match(html,/data-room-object="bag"/);
  assert.match(html,/data-room-position="under"/);
  assert.match(html,/data-room-surface="bed"/);
  for(const slot of ['object','position','surface'])assert.match(html,new RegExp('data-composer-slot="'+slot+'"'));
  assert.ok(p.filter(a=>a.type==='dialogue').some(a=>a.lines.some(line=>line.en.includes('wardrobe'))));
  assert.ok(p.find(a=>a.type==='free-write').prompt.includes('اتاق خیالی'));
  assert.match(readFileSync(join(projectRoot,'apps/learner-web/assets/scene-a1-9.svg'),'utf8'),/Book|book/);
  const free=p.find(a=>a.type==='free-write');
  const answer='Where is my book? My book is on the desk in my bedroom. My bag is under the bed. The pillow is on the bed. The mirror is on the wall near the wardrobe. The curtain is near the window.';
  assert.equal(evaluateResponse(free.assessment,answer).ok,true);
  assert.deepEqual(auditLesson(lesson).errors,[]);
});

test('A1-1 staged practice increases variety without adding activity panels', () => {
  const lesson=load('lessons/a1-1.json');
  assert.equal(lesson.sections[0].activities.find(a=>a.id==='hello-intro-check').tasks.length,5);
  const production=lesson.sections[1].activities;
  assert.ok(production.find(a=>a.id==='hello-exchange-practice').tasks.length>=6);
  assert.ok(production.find(a=>a.id==='hello-guided-talk').turns.length>=5);
  assert.equal(production.filter(a=>a.type==='guided-dialogue').length,1);
});
test('all nine A1 lessons expose identical two-section navigation labels', () => {
  const labels=['از کلمه تا جمله','از سؤال و جواب تا مکالمه'];
  for (const id of ['a1-1','a1-2','a1-3','a1-4','a1-5','a1-6','a1-7','a1-8','a1-9']) {
    assert.deepEqual(load('lessons/'+id+'.json').sections.map(section=>section.label),labels,id);
  }
});
