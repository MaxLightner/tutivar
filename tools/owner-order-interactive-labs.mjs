// One-time final alignment of the two bridge lessons with the teaching phases:
// podcast → words → combinations/near meanings → sentence/variants → interactive.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(import.meta.url),'../..');
for(const [file,labId,variantsId] of [
  ['a1-8-v3.json','a1-8-quantities','a1-8-forms'],
  ['a1-12-v2.json','a1-12-action-lab','a1-12-forms']
]){
  const path=resolve(root,'content/language-pairs/fa-en/lessons',file);
  const lesson=JSON.parse(readFileSync(path,'utf8'));
  const steps=lesson.sections[0].activities;
  const oldIndex=steps.findIndex(x=>x.id===labId);
  const [lab]=steps.splice(oldIndex,1);
  if(!lab)throw Error(file+': missing '+labId);
  lab.phase='variants';
  const target=steps.findIndex(x=>x.id===variantsId);
  if(target<0)throw Error(file+': missing '+variantsId);
  steps.splice(target+1,0,lab);
  writeFileSync(path,`${JSON.stringify(lesson,null,2)}\n`);
}
