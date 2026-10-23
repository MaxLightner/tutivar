import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, projectRoot, validateSchema } from '../tools/validate.mjs';
import { renderActivity, supportedActivities } from '../apps/learner-web/lesson-modules.js';
import { advanceDeck, answerDeck, checkWordAnswer, coreItems, deckState, jumpDeck, resumeDeck, supplementaryItems } from '../apps/learner-web/word-review.js';
import { evaluateResponse, practiceState, submitPractice } from '../apps/learner-web/practice-engine.js';

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
  assert.equal(ids.size, 3);
  assert.deepEqual([...new Set([...ids].map((id) => load(lessons.find((entry) => entry.id === id).file).archetype))].sort(), ['conversation', 'family', 'ownership']);
});

test('not-yet-produced nodes cannot be launched as content', () => {
  for (const entry of lessons.filter((lesson) => lesson.status === 'planned')) assert.equal(entry.file, undefined);
  assert.ok(manifest.availableLevels.every((level) => manifest.levels[level]));
  assert.ok(manifest.levels.A2.chapters.length === 0);
});

test('A1 shows three structured stages with twelve chapters', () => {
  assert.deepEqual(curriculum.stages.map((stage) => stage.id), ['A1.1', 'A1.2', 'A1.3']);
  assert.equal(curriculum.stages.reduce((sum, stage) => sum + stage.chapters.length, 0), 12);
  assert.ok(curriculum.stages.every((stage) => stage.chapters.every((chapter) => chapter.lessons.length >= 7)));
  assert.ok(curriculum.stages.every((stage) => stage.chapters.every((chapter) => chapter.lessons.every((entry) => Array.isArray(entry) ? entry.length >= 2 : entry.icon))));
  assert.ok(curriculum.stages.every((stage) => stage.chapters.every((chapter) => {
    const last = chapter.lessons.at(-1);
    return Array.isArray(last) ? last[2] === 'workshop' : last.kind === 'workshop';
  })));
  assert.equal(manifest.levels.A1.curriculumFile, 'curriculum.a1.json');
});

test('first lesson activities render with separate content, including interactions', () => {
  const lesson = load('lessons/a1-1.json');
  const context = {
    lessonId: lesson.id, index: 0,
    e: (value) => String(value), en: (value) => `<span>${value}</span>`, i: () => '<svg></svg>',
    progress: { matchAnswers: {}, sentenceAnswers: {}, roleplayAnswers: {}, quizAnswers: {}, written: {}, showDialogueTranslation: true, wordProgress: {}, phraseChoices: {}, sentenceLabs: {}, guidedAnswers: {}, transformChoices: {}, transformStages: {}, practiceStates: {}, assessments: {} }
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
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary'), context), /امتحانم کن/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'phrase-composer'), context), /data-phrase-key=/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'sentence-lab'), context), /data-lab-key=/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'response-practice'), context), /data-practice-form=/);
  assert.match(renderActivity(lesson.sections[1].activities.find((activity) => activity.type === 'sentence-transform'), context), /data-transform-key=/);
  assert.match(renderActivity(lesson.sections[1].activities.find((activity) => activity.type === 'guided-dialogue'), context), /data-practice-form=/);
  assert.match(renderActivity(lesson.sections[1].activities.find((activity) => activity.type === 'dialogue-transfer'), context), /data-practice-form=/);
  assert.equal(lesson.sections.reduce((sum, section) => sum + section.activities.length, 0), 9, 'one concise foundation and one sentence-first conversation half');
  assert.deepEqual(lesson.sections[1].activities.map((item) => item.type), ['sentence-transform', 'dialogue', 'guided-dialogue', 'dialogue-transfer', 'free-write'], 'transformations precede dialogue');
  assert.ok(lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary').items.every((entry) => entry.examples.length === 3));
  assert.ok(Array.isArray(lesson.orientation.prerequisites));
  assert.equal(lesson.visual.src, null);
  const words = lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary').items;
  for (const required of ['Good morning!', 'Good afternoon!', 'Good evening!', 'Good night!', 'How are you?', "What's your name?", "I'm fine, thanks.", 'And you?']) {
    assert.ok(words.some((entry) => entry.en === required), `${required}: missing first lesson greeting`);
  }
  const vocabulary = lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary');
  assert.equal(coreItems(vocabulary).length, 8, 'the first lesson starts with only essential expressions');
  assert.deepEqual(supplementaryItems(vocabulary).map((entry) => entry.en), ['Good afternoon!', 'Good evening!', 'Good night!']);
  assert.deepEqual(coreItems(vocabulary).map((entry) => entry.en).filter((word) => ['I', 'my', 'name', 'your'].includes(word)), [], 'grammar fragments belong in the phrase and sentence builders');
  const html = renderActivity(vocabulary, { lessonId: 'A1-1', index: 0, e: String, en: String, i: () => '', progress: { wordProgress: {} } });
  assert.match(html, /کارت 1 از 8/);
  assert.match(html, /عبارت‌های تکمیلی/);
  assert.match(html, /سه مثال کاربردی/);
});

test('sentence transformations have a single active sentence and a working free response', () => {
  const activity = load('lessons/a1-1.json').sections[1].activities[0];
  const context = { lessonId: 'A1-1', index: 0, e: String, en: String, i: () => '', progress: { transformChoices: {}, transformStages: {}, practiceStates: {} } };
  const first = renderActivity(activity, context);
  assert.match(first, /How are you\?/);
  assert.doesNotMatch(first, /I'm not okay\./, 'other sentences stay hidden until selected');
  context.progress.transformChoices['A1-1:hello-transform'] = 3;
  assert.match(renderActivity(activity, context), /I'm not okay\./);
  context.progress.transformStages['A1-1:hello-transform'] = 'practice';
  assert.match(renderActivity(activity, context), /data-practice-form=/);
  assert.doesNotMatch(renderActivity(activity, context), /class="transform-card"/);
  assert.equal(evaluateResponse(activity.tasks[0].assessment, "I'm okay.").ok, false);
  assert.equal(evaluateResponse(activity.tasks[0].assessment, "I'm not okay!").ok, true);
  assert.equal(evaluateResponse(activity.tasks[1].assessment, 'You are okay.').ok, false);
  assert.match(evaluateResponse(activity.tasks[1].assessment, 'You are okay.').feedback, /خبری/);
  assert.equal(evaluateResponse(activity.tasks[1].assessment, 'Are you okay?').ok, true);
});

test('guided dialogue supports feedback, correction, alternate names, mastery and revised tasks', () => {
  const activity = load('lessons/a1-1.json').sections[1].activities.find((entry) => entry.type === 'guided-dialogue');
  const key = activity.turns[1].assessment;
  assert.equal(evaluateResponse(key, "Your name is Ali. What's your name?").ok, false);
  assert.match(evaluateResponse(key, "Your name is Ali. What's your name?").feedback, /Your name is/);
  assert.equal(evaluateResponse(key, "I'm Leila. What's your name?").ok, true);
  assert.equal(evaluateResponse(activity.turns[0].assessment, 'Good morning! I am fine, thanks. And you?').ok, true);
  let state = practiceState(null, activity);
  const rejected = submitPractice(state, activity, 'Good morning!',);
  assert.equal(rejected.result.ok, false);
  assert.equal(rejected.state.answers.length, 0);
  assert.equal(rejected.state.attempts, 1);
  state = submitPractice(rejected.state, activity, 'Good morning! I am fine, thanks. And you?').state;
  assert.equal(state.answers.length, 1);
  state = submitPractice(state, activity, "I'm Omar. What's your name?").state;
  state = submitPractice(state, activity, 'Nice to meet you too, goodbye!').state;
  assert.equal(state.answers.length, activity.turns.length);
  assert.equal(practiceState(state, { ...activity, practiceRevision: 3 }).answers.length, 0, 'new exercise revision invalidates old answers');
});

test('transfer and independent production require communication, not arbitrary submissions', () => {
  const lesson = load('lessons/a1-1.json');
  const transfer = lesson.sections[1].activities.find((entry) => entry.type === 'dialogue-transfer');
  assert.match(evaluateResponse(transfer.turns[0].assessment, "Hello! I'm fine, thanks. What's your name? I'm Nima.").feedback, /اسم خودش/);
  assert.equal(evaluateResponse(transfer.turns[0].assessment, "Hi, I'm good, thanks. My name is Leila.").ok, true);
  const production = lesson.sections[1].activities.find((entry) => entry.type === 'free-write');
  assert.equal(evaluateResponse(production.assessment, 'Hello!').ok, false);
  assert.equal(evaluateResponse(production.assessment, "Hello! How are you? I'm Nima. What's your name? Bye!").ok, true);
});

test('supplementary phrases are excluded from all mandatory vocabulary stages', () => {
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
  assert.match(html, /کارت در صف آزمون/);
});

test('presentation is independent of course content and never hardcodes target phrases', () => {
  const app = readFileSync(join(projectRoot, 'apps/learner-web/app.js'), 'utf8');
  assert.ok(app.includes("contentUrl('manifest.json')"));
  assert.ok(app.includes('entry.file'));
  assert.ok(app.includes('fetch(contentUrl(level.curriculumFile))'));
  assert.ok(app.includes('new URL(import.meta.url).searchParams'));
  assert.ok(app.includes('renderActivity'));
  assert.ok(app.includes('lessonOrientation'));
  assert.ok(app.includes('lesson-visual-frame'));
  assert.ok(app.includes('sectionCompleted'), 'each lesson half tracks its own completion');
  assert.ok(app.includes('data-finish-section'), 'each half gets an independent completion action');
  assert.ok(app.includes('activeSection'), 'the route chooses only the current half');
  assert.ok(!app.includes('target?.scrollIntoView'), 'section navigation is by route, not scrolling');
  assert.ok(!app.includes("I'm Sara."));
  assert.ok(!app.includes('This is my mother.'));
  assert.ok(!app.includes('این مسیر بر اساس فهرست'));
  assert.ok(!app.includes('اینجا مسیر توست'));
});
