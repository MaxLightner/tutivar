import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, projectRoot, validateSchema } from '../tools/validate.mjs';
import { renderActivity, supportedActivities } from '../apps/learner-web/lesson-modules.js';

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
    progress: { matchAnswers: {}, sentenceAnswers: {}, roleplayAnswers: {}, quizAnswers: {}, written: {}, showDialogueTranslation: true, wordProgress: {}, phraseChoices: {}, sentenceLabs: {}, guidedAnswers: {} }
  };
  for (const section of lesson.sections) {
    for (const activity of section.activities) {
      const html = renderActivity(activity, context);
      assert.match(html, /module-block/);
      assert.ok(html.length > 80, activity.id);
    }
  }
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary'), context), /data-word-key=/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'phrase-composer'), context), /data-phrase-key=/);
  assert.match(renderActivity(lesson.sections[0].activities.find((activity) => activity.type === 'sentence-lab'), context), /data-lab-key=/);
  assert.match(renderActivity(lesson.sections[1].activities.find((activity) => activity.type === 'guided-dialogue'), context), /data-guided-send=/);
  assert.equal(lesson.sections.reduce((sum, section) => sum + section.activities.length, 0), 6, 'short first lesson');
  assert.ok(lesson.sections[0].activities.find((activity) => activity.type === 'vocabulary').items.every((entry) => entry.examples.length === 3));
  assert.ok(Array.isArray(lesson.orientation.prerequisites));
  assert.equal(lesson.visual.src, null);
});

test('presentation is independent of course content and never hardcodes target phrases', () => {
  const app = readFileSync(join(projectRoot, 'apps/learner-web/app.js'), 'utf8');
  assert.ok(app.includes("fetch('./data/manifest.json')"));
  assert.ok(app.includes('entry.file'));
  assert.ok(app.includes("fetch(`./data/${level.curriculumFile}`)"));
  assert.ok(app.includes('renderActivity'));
  assert.ok(app.includes('lessonOrientation'));
  assert.ok(app.includes('lesson-visual-frame'));
  assert.ok(!app.includes("I'm Sara."));
  assert.ok(!app.includes('This is my mother.'));
  assert.ok(!app.includes('این مسیر بر اساس فهرست'));
  assert.ok(!app.includes('اینجا مسیر توست'));
});
