import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { validateLessonFlow } from '../apps/learner-web/lesson-flow.js';
import { evaluateResponse } from '../apps/learner-web/practice-engine.js';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const load = (id) => JSON.parse(readFileSync(join(root, `content/language-pairs/fa-en/lessons/a1-${id}.json`), 'utf8'));

for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  test(`A1-${n} has an opening shadowing track and reuses it at the end`, () => {
    const lesson = load(n);
    assert.deepEqual(validateLessonFlow(lesson), []);
    const foundation = lesson.sections.find((section) => section.id === 'foundation');
    const production = lesson.sections.find((section) => section.id === 'production');
    const opening = foundation.activities.find((activity) => activity.type === 'shadowing');
    const closing = production.activities.find((activity) => activity.type === 'shadowing-review');
    assert.equal(foundation.activities[0].type, 'shadowing');
    assert.equal(closing.sourceActivityId, opening.id);
    assert.ok(opening.lines.length >= 5);
    assert.ok(opening.lines.every((line) => line.trim().split(/\s+/).length <= 10), 'shadowing lines stay short enough to imitate');
    assert.ok(!production.activities.some((activity) => /comprehension-quiz/.test(activity.type)), 'shadowing does not become a comprehension quiz');
  });
  test(`A1-${n} keeps words and phrase-level units in separate modules`, () => {
    const lesson = load(n);
    const foundation = lesson.sections.find((section) => section.id === 'foundation');
    const vocabulary = foundation.activities.find((activity) => activity.type === 'vocabulary');
    const expressions = foundation.activities.find((activity) => activity.type === 'expression-study');
    assert.ok(expressions && expressions.items.length > 0);
    assert.ok(vocabulary.items.every((item) => !/\s/.test(item.en.trim())), 'no multiword phrase or full sentence is stored as a vocabulary entry');
  });
  test(`A1-${n} places image description between dialogue and free production`, () => {
    const lesson = load(n);
    assert.deepEqual(validateLessonFlow(lesson), []);
    const items = lesson.sections.find((section) => section.id === 'production').activities;
    const pictureIndex = items.findIndex((activity) => activity.type === 'picture-description');
    const image = items[pictureIndex];
    assert.ok(pictureIndex > items.findLastIndex((activity) => activity.type === 'dialogue'));
    assert.ok(pictureIndex < items.findIndex((activity) => activity.type === 'guided-dialogue'));
    assert.ok(image.tasks.length >= 3);
    const contents = readFileSync(join(root, 'apps/learner-web', image.image.replace(/^\.\//, '')), 'utf8');
    assert.ok(contents.startsWith('<svg'));
    assert.ok(contents.includes('<path') || contents.includes('<circle'));
  });
}

test('spatial lab uses clear, distinct depth and side-on box states', () => {
  const lesson = load(4);
  const lab = lesson.sections[0].activities.find((activity) => activity.type === 'spatial-lab');
  const positions = Object.fromEntries(lab.positions.map((entry) => [entry.id, entry]));
  assert.equal(lab.positions.length, 9);
  assert.equal(positions['on-top-of'], undefined);
  assert.equal(positions.in.ball.layer, 'inside');
  assert.equal(positions.inside.ball.layer, 'inside');
  assert.equal(positions.behind.ball.layer, 'behind');
  assert.equal(positions.on.ball.layer, 'front');
  assert.ok(positions.above.ball.y < positions.on.ball.y - 60);
  assert.ok(positions.outside.ball.x < positions['next-to'].ball.x - 250);
  assert.ok(positions['next-to'].ball.x > positions.behind.ball.x);
});

for (const [number, sample] of [
  [1, `You: Good evening! How are you? Friend: I'm fine, thanks. And you? You: My name is Ali. What's your name? Nice to meet you! Bye!`],
  [2, `Hello! Please look at this photo. Who's this? This is my mother. Her name is Roya. Is this your father? Yes. His name is Ali. Bye!`],
  [3, `This is my pen. Is this your phone? No, it's mine. It's yours. It's his bag. I have a book. I don't have a pen. Do you have a notebook?`],
  [4, `My pen is in my bag. My pen is on the bag. The book is next to my bag. Where is my phone?`]
]) {
  test(`A1-${number} personal production accepts a real-world response`, () => {
    const lesson = load(number);
    const activity = lesson.sections[1].activities.find((entry) => entry.type === 'free-write');
    assert.ok(evaluateResponse(activity.assessment, sample).ok);
  });
}

test('independent production rejects unordered keyword fragments', () => {
  const lesson = JSON.parse(readFileSync(join(root, 'content/language-pairs/fa-en/lessons/a1-8-v4.json'), 'utf8'));
  const task = lesson.sections[1].activities.find(activity => activity.type === 'free-write');
  assert.equal(evaluateResponse(task.assessment, 'i have there are').ok, false);
});
