/** One-time mechanics repair and immutable legacy-reference pinning for A1.2. */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gitBlobSha } from './curriculum-contract.mjs';
const base='content/language-pairs/fa-en/';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const write=(path,data)=>writeFileSync(path,JSON.stringify(data,null,2)+'\n');
const catalog=read(base+'curriculum.a1.json');
const manifest=read('content/curriculum/universal-path.v1.json');
const legacyPath='content/curriculum/legacy-alignment.json';
const legacy=read(legacyPath);
const transition=legacy.stage2PracticalSequence;
if(!transition||transition.revision!==manifest.revision||transition.preservedLessonRefs)
  throw Error('Stage-two amendment not in the one-time expected state');

// Confirm stage three is identical to the committed, pre-amendment version.
const beforeCatalog=JSON.parse(execFileSync('git',['show','HEAD:'+base+'curriculum.a1.json'],{encoding:'utf8'}));
const beforeManifest=JSON.parse(execFileSync('git',['show','HEAD:content/curriculum/universal-path.v1.json'],{encoding:'utf8'}));
const stage3=(data)=>data.stages[2];
const stage3Rows=(data)=>data.lessons.filter(row=>row.level==='A1'&&row.order>=25);
if(JSON.stringify(stage3(beforeCatalog))!==JSON.stringify(stage3(catalog))||
  JSON.stringify(stage3Rows(beforeManifest))!==JSON.stringify(stage3Rows(manifest)))
  throw Error('Stage three is different from committed version; halt');

const currentCards=catalog.stages.flatMap(stage=>stage.chapters).flatMap(ch=>ch.lessons);
transition.previousRevision='2026-10-26-owner-home-school-feelings-realworld';
transition.preservedLessonRefs={};
for(let n=3;n<=14;n++){
  const card=currentCards.find(x=>x.id==='A1-'+n);
  const file=base+card.file,raw=readFileSync(file,'utf8'),lesson=JSON.parse(raw);
  if(lesson.roadmapRef.revision!==transition.previousRevision)throw Error('Unexpected retained revision in '+card.id);
  const canonical=manifest.lessons.find(row=>row.id===card.id);
  if(lesson.roadmapRef.communicativeOutcome!==canonical.communicativeOutcome)throw Error('Outcome drift in '+card.id);
  transition.preservedLessonRefs[card.id]={file:card.file,gitBlobSha:gitBlobSha(raw),revision:lesson.roadmapRef.revision};
}
transition.stage3Fingerprint={rows:gitBlobSha(JSON.stringify(stage3Rows(beforeManifest))),catalog:gitBlobSha(JSON.stringify(stage3(beforeCatalog)))};

// Normalize surface forms without changing the approved lesson objectives.
const fixes={
  17: lesson=>{
    const a=lesson.sections[0].activities.find(x=>x.type==='sentence-composer');
    for(const entry of a.wordSets.owner){entry.label=entry.label.toLowerCase();entry.forms.en=entry.forms.en.toLowerCase();}
  },
  19: lesson=>{
    const a=lesson.sections[0].activities.find(x=>x.type==='sentence-composer');
    const p=a.patterns.find(x=>x.id==='question');
    p.label='نقش فرد را نشان بده';
    p.segments=[{fixed:'Look! '},{slot:'subject',form:'en'},{fixed:' is '},{slot:'role',form:'en'},{fixed:'.'}];
  },
  20: lesson=>{
    const a=lesson.sections[0].activities.find(x=>x.type==='sentence-composer');
    a.wordSets.request=a.wordSets.request.filter(x=>x.label!=='Do you have');
  },
  23: lesson=>{
    const a=lesson.sections[0].activities.find(x=>x.type==='sentence-composer');
    const p=a.patterns.find(x=>x.id==='two');
    p.segments=[{slot:'movement',form:'en'},{fixed:' '},{slot:'landmark',form:'en'},{fixed:'. This is the way to the park.'}];
  },
  24: lesson=>{
    const a=lesson.sections[0].activities.find(x=>x.type==='sentence-composer');
    const home=a.wordSets.destination.find(x=>x.label==='my home');
    home.label='the library'; home.translation='کتابخانه';home.forms.en='the library';
  }
};
for(const [num,update]of Object.entries(fixes)){
  const path=`${base}lessons/a1-${num}-v1.json`,lesson=read(path);
  update(lesson);write(path,lesson);
}
write(legacyPath,legacy);
console.log('Pinned unchanged A1-3..14 lesson files and stage-three fingerprint; corrected five composer word sets.');
