import { validateSentenceComposer } from '../apps/learner-web/sentence-composer.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(fileURLToPath(import.meta.url), '../..');
export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

function matchesType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  return typeof value === type;
}

// Dependency-free validator for the schema keywords used in v0.1.
// A production implementation can replace this with full JSON Schema validation.
export function validateSchema(schema, value, path = '$') {
  const errors = [];
  const types = !schema.type ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.length && !types.some((type) => matchesType(value, type))) return [path + ': wrong type'];
  if (schema.enum && !schema.enum.includes(value)) errors.push(path + ': invalid enum');
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(path + ': too short');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(path + ': pattern mismatch');
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) errors.push(path + ': below minimum');
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(path + ': too few items');
    if (schema.uniqueItems && new Set(value.map((v) => JSON.stringify(v))).size !== value.length) errors.push(path + ': duplicate items');
    if (schema.items) value.forEach((item, i) => errors.push(...validateSchema(schema.items, item, path + '[' + i + ']')));
  }
  if (matchesType(value, 'object')) {
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) errors.push(path + '.' + key + ': required');
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties?.[key]) errors.push(...validateSchema(schema.properties[key], item, path + '.' + key));
      else if (schema.additionalProperties === false) errors.push(path + '.' + key + ': unknown property');
    }
  }
  return errors;
}

export function validateModules(registry, schema) {
  const errors = [];
  const ids = new Set();
  const providers = new Map();
  for (const module of registry.modules || []) {
    errors.push(...validateSchema(schema, module, 'module:' + module.id));
    if (ids.has(module.id)) errors.push('duplicate module id ' + module.id);
    ids.add(module.id);
    for (const capability of module.provides || []) {
      if (providers.has(capability)) errors.push('duplicate provider ' + capability);
      providers.set(capability, module.id);
    }
  }
  const graph = new Map();
  for (const module of registry.modules || []) {
    const dependencies = new Set();
    for (const capability of module.requires || []) {
      const owner = providers.get(capability);
      if (!owner) errors.push(module.id + ': unknown capability ' + capability);
      else dependencies.add(owner);
    }
    graph.set(module.id, dependencies);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) { errors.push('dependency cycle containing ' + id); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of graph.get(id) || []) visit(dep);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of graph.keys()) visit(id);
  return errors;
}

export function validateCourseSemantics(course) {
  const errors = [];
  const ids = new Set(course.lessonOrder);
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessonIds) if (!ids.has(lesson)) errors.push(chapter.id + ': missing lesson ' + lesson);
  }
  if (course.status === 'published') {
    if (!course.lessonOrder.length) errors.push('published course is empty');
    if (!course.finalAssessmentRef || !ids.has(course.finalAssessmentRef)) errors.push('missing final assessment');
    for (const chapter of course.chapters) {
      const workshops = course.workshops.filter((w) => w.chapterId === chapter.id);
      if (workshops.length !== 1 || !ids.has(workshops[0]?.lessonId)) errors.push(chapter.id + ': missing workshop');
    }
    if (course.workshops.length !== course.chapters.length) errors.push('workshop count mismatch');
  }
  return errors;
}

export function validateExampleReferences({ pair, course, lesson, exercise, placement }) {
  const errors = [];
  for (const item of [course, lesson, exercise, placement]) if (item.pairId !== pair.id) errors.push(item.id + ': unknown pair');
  if (lesson.courseId !== course.id || !course.lessonOrder.includes(lesson.id)) errors.push('lesson course mismatch');
  for (const item of lesson.activities) {
    if (item.exerciseId !== exercise.id || item.revision !== exercise.revision) errors.push('missing exercise revision');
  }
  for (const item of placement.items) {
    if (item.exerciseId !== exercise.id || item.revision !== exercise.revision) errors.push('missing placement exercise revision');
    if (!placement.assessedLevels.includes(item.targetLevel)) errors.push('placement target level not assessed');
  }
  return errors;
}

function collectJson(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? collectJson(path) : name.endsWith('.json') ? [path] : [];
  });
}

export function validateRepository(root = projectRoot) {
  const errors = [];
  const get = (path) => readJson(join(root, path));
  const names = ['module', 'language-pair', 'course', 'lesson', 'exercise', 'placement-test'];
  const schemas = Object.fromEntries(names.map((name) => [name, get('schemas/' + name + '.schema.json')]));
  const architecture = get('architecture/system.json');
  if (architecture.id !== 'tutivar' || architecture.style !== 'modular-monorepo') errors.push('architecture mismatch');
  errors.push(...validateModules(get('registry/modules.json'), schemas.module));
  const pair = get('content/language-pairs/fa-de/pair.json');
  for (const pairId of ['fa-de', 'fa-en']) {
    const registered = get(`content/language-pairs/${pairId}/pair.json`);
    errors.push(...validateSchema(schemas['language-pair'], registered, 'language-pair:' + pairId));
    if (registered.id !== registered.sourceLanguage + '-' + registered.targetLanguage || registered.sourceLanguage === registered.targetLanguage) errors.push('invalid pair identifier: ' + pairId);
    if (registered.status === 'published' && !registered.grammarMapRef) errors.push('published pair needs Grammar Map: ' + pairId);
  }
  const a1PreviewCourse = get('content/language-pairs/fa-en/course.a1.demo.json');
  errors.push(...validateSchema(schemas.course, a1PreviewCourse, 'fa-en-course'));
  errors.push(...validateCourseSemantics(a1PreviewCourse));
  const fixtures = {
    course: get('examples/course.example.json'),
    lesson: get('examples/lesson.example.json'),
    exercise: get('examples/exercise.example.json'),
    placement: get('examples/placement-test.example.json')
  };
  for (const [name, item] of Object.entries(fixtures)) {
    errors.push(...validateSchema(schemas[name === 'placement' ? 'placement-test' : name], item, 'examples.' + name));
  }
  if (!errors.length) {
    errors.push(...validateCourseSemantics(fixtures.course));
    errors.push(...validateExampleReferences({ pair, ...fixtures }));
  }
  const composerSchema = get('schemas/sentence-composer.schema.json');
  function inspectSentenceComposers(value, sourcePath) {
    if (!value || typeof value !== 'object') return;
    if (!Array.isArray(value) && value.type === 'sentence-composer') {
      errors.push(...validateSchema(composerSchema, value, sourcePath + ':' + (value.id || 'sentence-composer')));
      errors.push(...validateSentenceComposer(value).map((error) => sourcePath + ': ' + error));
    }
    if (Array.isArray(value)) value.forEach((item, index) => inspectSentenceComposers(item, sourcePath + '[' + index + ']'));
    else for (const [key, item] of Object.entries(value)) inspectSentenceComposers(item, sourcePath + '.' + key);
  }
  for (const dirname of ['architecture', 'registry', 'schemas', 'content', 'examples']) {
    for (const file of collectJson(join(root, dirname))) {
      try { const value = readJson(file); if (dirname === 'content') inspectSentenceComposers(value, file.replace(root + '/', '')); } catch (error) { errors.push(file + ': ' + error.message); }
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateRepository();
  if (errors.length) {
    console.error(errors.map((e) => 'FAIL: ' + e).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('PASS: Tutivar v0.1 contracts and references');
  }
}
