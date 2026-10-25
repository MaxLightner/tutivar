import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
export const COMMON_FORMS = Object.freeze({
  keys:'key', children:'child', people:'person', men:'man', women:'woman',
  mice:'mouse', teeth:'tooth', feet:'foot', geese:'goose',
  parents:'parent', grandparents:'grandparent', babies:'baby',
  apples:'apple', books:'book', pens:'pen', pencils:'pencil',
  phones:'phone', chairs:'chair', bags:'bag', notebooks:'notebook',
  buses:'bus', boxes:'box', bottles:'bottle', cups:'cup',
  years:'year', letters:'letter', numbers:'number', ages:'age',
  sisters:'sister', brothers:'brother', daughters:'daughter',
  sons:'son', names:'name', toys:'toy', fish:'fish', sheep:'sheep'
});
export function vocabularyKey(input) {
  const text = String(input || '').normalize('NFKC').toLowerCase()
    .replace(/[’‘`]/g, "'").replace(/^[^a-z]+|[^a-z]+$/g, '').trim();
  return COMMON_FORMS[text] || text;
}
export function inspectVocabularyContinuity(lessons) {
  const seen = new Map(), errors = [];
  for (const lesson of lessons) {
    const vocabulary = (lesson.sections || []).flatMap(s => s.activities || []).find(a => a.type === 'vocabulary');
    if (!vocabulary) { errors.push(lesson.id + ': vocabulary activity missing'); continue; }
    const within = new Set();
    for (const entry of vocabulary.items || []) {
      const key = vocabularyKey(entry.en);
      if (!key) { errors.push(lesson.id + ': empty vocabulary entry'); continue; }
      if (/\s/.test(entry.en.trim())) errors.push(lesson.id + ': multiword expression in word bank: ' + entry.en);
      if (within.has(key)) errors.push(lesson.id + ': repeated entry within lesson: ' + entry.en);
      else within.add(key);
      if (seen.has(key)) errors.push(lesson.id + ': "' + entry.en + '" repeats a taught word from ' + seen.get(key));
      else seen.set(key, lesson.id);
    }
  }
  return errors;
}
export function loadA1Lessons() {
  const directory = join(root, 'content/language-pairs/fa-en/lessons');
  return readdirSync(directory).filter(n => /^a1-\d+\.json$/.test(n))
    .sort((a,b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map(name => JSON.parse(readFileSync(join(directory, name), 'utf8')));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const lessons = loadA1Lessons();
  const errors = inspectVocabularyContinuity(lessons);
  if (errors.length) { errors.forEach(error => console.error('FAIL: ' + error)); process.exitCode = 1; }
  else console.log('PASS: ' + lessons.length + ' A1 lessons; vocabulary introduced once (core + supplementary; inflections matched)');
}
