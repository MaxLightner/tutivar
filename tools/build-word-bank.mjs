import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join,resolve,dirname,basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWordBank } from '../apps/learner-web/word-bank.js';
const root=resolve(fileURLToPath(import.meta.url),'../..');
const curriculumPath=join(root,'content/language-pairs/fa-en/curriculum.a1.json');
const lessonDir=join(root,'content/language-pairs/fa-en/lessons');
const loadJson=path=>JSON.parse(readFileSync(path,'utf8'));
export function resolveLessonFile(entry,lessonDirectory=lessonDir){
  const refs=[entry.file,entry.lessonFile,entry.dataFile,entry.contentFile,entry.path,entry.src].filter(v=>typeof v==='string'&&v.endsWith('.json'));
  const candidates=refs.flatMap(ref=>[
    join(lessonDirectory,basename(ref)),
    join(dirname(lessonDirectory),ref),
  ]);
  const existing=candidates.find(existsSync);
  if(existing)return existing;
  if(refs.length)throw Error(`Lesson ${entry.id} references missing file ${refs[0]}`);
  // Defensive fallback for old manifests without an explicit revision path.
  const prefix=String(entry.id).toLowerCase();
  const matching=readdirSync(lessonDirectory).filter(file => new RegExp(`^${prefix}(?:-v\\d+)?\\.json$`).test(file));
  if(matching.length===1)return join(lessonDirectory,matching[0]);
  if(matching.length>1)throw Error(`Lesson ${entry.id} has ambiguous versions; select an explicit file in curriculum.`);
  throw Error(`Active lesson ${entry.id} has no JSON data`);
}
export function buildCourseWordBank({curriculumFile=curriculumPath,lessonDirectory=lessonDir,pairId='fa-en'}={}){
  const curriculum=loadJson(curriculumFile);
  const active=(curriculum.stages||[]).flatMap(s=>s.chapters||[]).flatMap(c=>c.lessons||[]).filter(e=>e && e.status==='sample');
  const lessons=active.map(entry=>({id:entry.id,lesson:loadJson(resolveLessonFile(entry,lessonDirectory))}));
  const bank=createWordBank(lessons,{pairId,targetLanguage:'en'});
  bank.sourceLessonIds=lessons.map(x=>x.id);
  if(!lessons.length || !bank.entries.length)throw Error('Active course yielded an empty word bank; refusing silent publish');
  return bank;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const output=resolve(process.argv[2]||join(root,'dist/data/word-bank.json'));
  const data=buildCourseWordBank();
  mkdirSync(dirname(output),{recursive:true});
  writeFileSync(output,JSON.stringify(data,null,2)+'\n');
  console.log(`Tutivar word bank: ${data.entries.length} unique lemmas, ${data.sourceLessonIds.length} active lessons → ${output}`);
}
