import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { readJson, projectRoot, validateSchema, validateModules, validateCourseSemantics, validateExampleReferences, validateRepository } from '../tools/validate.mjs';

const load = (path) => readJson(join(projectRoot, path));

test('initial repo contracts pass', () => assert.deepEqual(validateRepository(), []));
test('lesson schema rejects missing and unknown fields', () => {
  const lesson = load('examples/lesson.example.json');
  delete lesson.id;
  lesson.extra = 42;
  const errors = validateSchema(load('schemas/lesson.schema.json'), lesson);
  assert.ok(errors.some((e) => e.includes('id: required')));
  assert.ok(errors.some((e) => e.includes('extra: unknown property')));
});
test('unknown module capabilities are rejected', () => {
  const registry = load('registry/modules.json');
  registry.modules.push({ id: 'future', version: '0.1.0', status: 'planned', provides: ['future.play'], requires: ['missing.api'] });
  assert.ok(validateModules(registry, load('schemas/module.schema.json')).some((e) => e.includes('unknown capability')));
});
test('module dependency cycles are rejected', () => {
  const registry = load('registry/modules.json');
  registry.modules[0].requires.push('learner.progress');
  assert.ok(validateModules(registry, load('schemas/module.schema.json')).some((e) => e.includes('cycle')));
});
test('published courses require workshops and final assessment', () => {
  const course = load('examples/course.example.json');
  course.status = 'published';
  const errors = validateCourseSemantics(course);
  assert.ok(errors.some((e) => e.includes('final assessment')));
  assert.ok(errors.some((e) => e.includes('workshop')));
});
test('lesson exercise revision references are checked', () => {
  const fixtures = {
    pair: load('content/language-pairs/fa-de/pair.json'),
    course: load('examples/course.example.json'),
    lesson: load('examples/lesson.example.json'),
    exercise: load('examples/exercise.example.json'),
    placement: load('examples/placement-test.example.json')
  };
  fixtures.lesson.activities[0].revision = 999;
  assert.ok(validateExampleReferences(fixtures).some((e) => e.includes('missing exercise revision')));
});
