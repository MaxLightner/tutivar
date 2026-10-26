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
/** Core vocabulary must surface again in manipulable sentences or production tasks. */
export function inspectCorePracticeCoverage(lessons) {
  const errors=[];
  const passive=new Set(['vocabulary','shadowing','shadowing-review','expression-study','meaning-cluster','composer-view']);
  for(const lesson of lessons){
    const activities=(lesson.sections||[]).flatMap(section=>section.activities||[]);
    const vocabulary=activities.find(activity=>activity.type==='vocabulary');
    if(!vocabulary)continue;
    const trainingText=JSON.stringify(activities.filter(activity=>!passive.has(activity.type)).map(activity=>{
      const {id,type,phase,title,description,sourceActivityId,...practice}=activity;
      return practice;
    })).toLowerCase().replace(/[’‘]/g,"'");
    for(const item of vocabulary.items||[]){
      if(item.role==='supplementary')continue;
      const word=vocabularyKey(item.en);
      if(!word)continue;
      const safe=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const matcher=new RegExp(`\\b${safe}(?:s|es|ed|ing)?\\b`,'i');
      if(!matcher.test(trainingText))errors.push(`${lesson.id}: core word "${item.en}" never appears in interactive or production practice`);
    }
  }
  return errors;
}
export function loadA1Lessons() {
  const directory = join(root, 'content/language-pairs/fa-en/lessons');
  const course=JSON.parse(readFileSync(join(root,'content/language-pairs/fa-en/curriculum.a1.json'),'utf8'));
  const entries=course.stages.flatMap(stage=>stage.chapters).flatMap(chapter=>chapter.lessons)
    .filter(entry=>entry && !Array.isArray(entry) && entry.status==='sample' && entry.file);
  return entries.map(entry=>JSON.parse(readFileSync(join(root,'content/language-pairs/fa-en',entry.file),'utf8')));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const lessons = loadA1Lessons();
  const errors = [...inspectVocabularyContinuity(lessons),...inspectCorePracticeCoverage(lessons)];
  if (errors.length) { errors.forEach(error => console.error('FAIL: ' + error)); process.exitCode = 1; }
  else console.log('PASS: ' + lessons.length + ' A1 lessons; vocabulary introduced once and each core word reused in exercises');
}
