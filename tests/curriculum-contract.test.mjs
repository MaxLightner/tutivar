import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditCurriculum, gitBlobSha, parseCanonicalSource, validateCanonicalManifest, validatePublishedCatalog, validateFutureLevelCatalog } from '../tools/curriculum-contract.mjs';
import { projectRoot } from '../tools/validate.mjs';

const json = path => JSON.parse(readFileSync(join(projectRoot, path),'utf8'));
const pathRoot='content/curriculum/';
const manifest=json(pathRoot+'universal-path.v1.json');
const lock=json(pathRoot+'roadmap.lock.json');
const legacy=json(pathRoot+'legacy-alignment.json');
const source=readFileSync(join(projectRoot,manifest.sourcePath),'utf8');
const runtime=json('content/language-pairs/fa-en/curriculum.a1.json');
const readLesson=path=>readFileSync(join(projectRoot,'content/language-pairs/fa-en',path),'utf8');

test('owner-locked manifest contains all 128 outcomes including approved A1 restructure',()=>{
  assert.equal(parseCanonicalSource(source).length,128);
  assert.equal(manifest.lessons.length,128);
  assert.deepEqual(validateCanonicalManifest({source,manifest,lock}),[]);
  assert.equal(gitBlobSha(source),lock.sourceGitBlobSha);
  assert.equal(gitBlobSha(JSON.stringify(manifest,null,2)+'\n'),lock.manifestGitBlobSha);
  const ids=['A1-1','A1-2','A1-3','A1-4','A1-5','A1-6','A1-7','A1-8','A1-9','A1-10'];
  const expectedTitles=['اولین برخورد و عبارت‌های روزمره','خانواده، جنسیت و ضمایر','لوازم شخصی، مالکیت و داشتن','اعداد، شمارش و تعداد اشیا و افراد','بیان موقعیت مکانی','توصیف ویژگی‌های اشیا','توصیف ظاهر افراد','اعداد در زندگی روزمره','تبادل اطلاعات شخصی','بیان وضعیت و احساسات روزمره'];
  assert.deepEqual(ids.map(id=>manifest.lessons.find(l=>l.id===id).title),expectedTitles);
});
test('changed roadmap target, order, or document cannot bypass the lock',()=>{
  const edited=structuredClone(manifest);
  edited.lessons[5].title='A different objective';
  assert.ok(validateCanonicalManifest({source,manifest:edited,lock}).length>0);
  const swapped=structuredClone(manifest);
  [swapped.lessons[5],swapped.lessons[6]]=[swapped.lessons[6],swapped.lessons[5]];
  assert.ok(validateCanonicalManifest({source,manifest:swapped,lock}).length>0);
  const future=structuredClone(manifest);
  future.lessons[5].prerequisiteIds.push('A1-12');
  assert.ok(validateCanonicalManifest({source,manifest:future,lock}).some(x=>x.includes('forward prerequisite')));
  assert.ok(validateCanonicalManifest({source:source.replace('توصیف ویژگی‌های اشیا','توصیف ویژگی‌های دیگر'),manifest,lock})
    .some(x=>x.includes('source') || x.includes('Manifest')));
});
test('published lesson order follows canonical order; archival data remains intact',()=>{
  assert.deepEqual(auditCurriculum(projectRoot).errors,[]);
  assert.deepEqual(validatePublishedCatalog({manifest,runtimeCourse:runtime,legacy,readLesson}),[]);
  const unordered=structuredClone(runtime);
  const first=unordered.stages[0].chapters[0].lessons;
  [first[1],first[2]]=[first[2],first[1]];
  assert.ok(validatePublishedCatalog({manifest,runtimeCourse:unordered,legacy,readLesson})
    .some(s=>s.includes('order')));
  const tampered=path=>path==='lessons/a1-6.json'?'{"id":"A1-6","goal":"silently replaced"}':readLesson(path);
  assert.ok(validatePublishedCatalog({manifest,runtimeCourse:runtime,legacy,readLesson:tampered})
    .some(s=>s.includes('immutable archived lesson changed')));
});
test('cannot publish A1-10 out of sequence before A1-7..9',()=>{
  const extra=structuredClone(runtime);
  extra.stages[0].chapters[1].lessons.push({
    id:'A1-10',title:'معرفی خانه و امکانات آن',status:'sample',
    file:'lessons/a1-10.json'
  });
  const errors=validatePublishedCatalog({manifest,runtimeCourse:extra,legacy,readLesson:path=>{
    if(path==='lessons/a1-10.json')return JSON.stringify({id:'A1-10'});
    return readLesson(path);
  }});
  assert.ok(errors.some(x=>x.includes('order')));
  assert.ok(errors.some(x=>x.includes('roadmapRef')));
});


test('future A2/B1/B2 courses and new language pairs cannot invent an order or lesson outcome',()=>{
  const canonical=manifest.lessons.find(x=>x.id==='A2-1');
  const ref={id:canonical.id,revision:manifest.revision,communicativeOutcome:canonical.communicativeOutcome};
  const course={level:'A2',stages:[{chapters:[{lessons:[
    {id:'A2-1',title:canonical.title,status:'sample',file:'lessons/a2-1.json'}
  ]}]}]};
  const read=()=>JSON.stringify({id:'A2-1',roadmapRef:ref});
  assert.deepEqual(validateFutureLevelCatalog({manifest,course,readLesson:read}),[]);
  const badTitle=structuredClone(course);
  badTitle.stages[0].chapters[0].lessons[0].title='Whatever seems cool today';
  assert.ok(validateFutureLevelCatalog({manifest,course:badTitle,readLesson:read})
    .some(x=>x.includes('title')));
  const missing=structuredClone(course);
  missing.stages[0].chapters[0].lessons[0].id='A2-2';
  assert.ok(validateFutureLevelCatalog({manifest,course:missing,readLesson:read})
    .some(x=>x.includes('out of order')));
  assert.ok(validateFutureLevelCatalog({manifest,course,readLesson:()=>JSON.stringify({id:'A2-1'})})
    .some(x=>x.includes('roadmapRef')));
  const placeholder=structuredClone(course);
  placeholder.stages[0].chapters[0].lessons.push(['Untracked lesson','book']);
  assert.ok(validateFutureLevelCatalog({manifest,course:placeholder,readLesson:read})
    .some(x=>x.includes('title-only')));
});
