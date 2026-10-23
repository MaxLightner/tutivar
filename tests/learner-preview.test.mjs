import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, projectRoot, validateSchema } from '../tools/validate.mjs';

const contentRoot = join(projectRoot, 'content/language-pairs/fa-en');
const load = (file) => readJson(join(contentRoot, file));
const manifest = load('preview-manifest.json');
const lessons = manifest.levels.A1.chapters.flatMap((chapter) => chapter.lessons);

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
    assert.ok(lesson.sections[0].vocabulary.length >= 3);
    assert.ok(lesson.sections[0].check.choices.length >= 2);
    assert.ok(Number.isInteger(lesson.sections[0].check.answer));
    assert.ok(lesson.sections[0].check.answer < lesson.sections[0].check.choices.length);
    assert.ok(lesson.sections[1].dialogue.length >= 2);
    assert.ok(lesson.sections[1].featureWidget.type);
    assert.ok(lesson.sections[1].production.prompt);
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

test('presentation is independent of course content and never hardcodes target phrases', () => {
  const app = readFileSync(join(projectRoot, 'apps/learner-web/app.js'), 'utf8');
  assert.ok(app.includes("fetch('./data/manifest.json')"));
  assert.ok(app.includes('entry.file'));
  assert.ok(!app.includes("I'm Sara."));
  assert.ok(!app.includes('This is my mother.'));
});
