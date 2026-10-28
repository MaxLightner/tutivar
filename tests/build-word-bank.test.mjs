import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCourseWordBank,resolveLessonFile } from '../tools/build-word-bank.mjs';
test('builder uses explicit active versions, ignores archive and planned content',()=>{
 const dir=mkdtempSync(join(tmpdir(),'tutivar-bank-'));
 try{
  const lessonDir=join(dir,'lessons');mkdirSync(lessonDir);
  const file=join(lessonDir,'a1-1-v3.json');
  writeFileSync(file,JSON.stringify({sections:[{id:'foundation',activities:[{id:'vocab',type:'vocabulary',items:[{en:'plate',fa:'بشقاب'}]}]}]}));
  writeFileSync(join(lessonDir,'a1-1-v2.json'),JSON.stringify({sections:[{id:'foundation',vocabulary:[{en:'outdated',fa:'قدیمی'}]}]}));
  const curriculum=join(dir,'curriculum.json');
  writeFileSync(curriculum,JSON.stringify({stages:[{chapters:[{lessons:[{id:'A1-1',status:'sample',file:'lessons/a1-1-v3.json'},{id:'A1-2',status:'planned'}]}]}]}));
  const bank=buildCourseWordBank({curriculumFile:curriculum,lessonDirectory:lessonDir});
  assert.equal(bank.entries.length,1);assert.equal(bank.entries[0].target,'plate');assert.deepEqual(bank.sourceLessonIds,['A1-1']);
  assert.equal(resolveLessonFile({id:'A1-1',file:'lessons/a1-1-v3.json'},lessonDir),file);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
