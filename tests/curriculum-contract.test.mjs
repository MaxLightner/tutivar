import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditCurriculum, gitBlobSha, parseCanonicalSource, validateCanonicalManifest, validatePublishedCatalog } from '../tools/curriculum-contract.mjs';
import { projectRoot } from '../tools/validate.mjs';

const json = path => JSON.parse(readFileSync(join(projectRoot, path),'utf8'));
const pathRoot='content/curriculum/';
const manifest=json(pathRoot+'universal-path.v1.json');
const lock=json(pathRoot+'roadmap.lock.json');
const legacy=json(pathRoot+'legacy-alignment.json');
const source=readFileSync(join(projectRoot,manifest.sourcePath),'utf8');
const runtime=json('content/language-pairs/fa-en/curriculum.a1.json');
const readLesson=path=>readFileSync(join(projectRoot,'content/language-pairs/fa-en',path),'utf8');

test('owner-locked manifest contains all 126 original teaching outcomes and valid prerequisites',()=>{
  assert.equal(parseCanonicalSource(source).length,126);
  assert.equal(manifest.lessons.length,126);
  assert.deepEqual(validateCanonicalManifest({source,manifest,lock}),[]);
  assert.equal(gitBlobSha(source),lock.sourceGitBlobSha);
  assert.equal(gitBlobSha(JSON.stringify(manifest,null,2)+'\n'),lock.manifestGitBlobSha);
  const ids=['A1-1','A1-2','A1-3','A1-4','A1-5','A1-6','A1-7','A1-8','A1-9','A1-10'];
  const expectedTitles=['معرفی خود و شروع گفت‌وگو','معرفی اعضای خانواده','مالکیت و داشتن اشیا','بیان موقعیت مکانی','تعداد و شمارش اشیا','توصیف ویژگی‌های اشیا','توصیف ظاهر افراد','تبادل اطلاعات شخصی','بیان وضعیت و احساسات روزمره','معرفی خانه و امکانات آن'];
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
test('published lesson order follows canonical order; only frozen old content is temporarily exempt',()=>{
  assert.deepEqual(auditCurriculum(projectRoot).errors,[]);
  assert.deepEqual(validatePublishedCatalog({manifest,runtimeCourse:runtime,legacy,readLesson}),[]);
  const unordered=structuredClone(runtime);
  const first=unordered.stages[0].chapters[0].lessons;
  [first[4],first[5]]=[first[5],first[4]];
  assert.ok(validatePublishedCatalog({manifest,runtimeCourse:unordered,legacy,readLesson})
    .some(s=>s.includes('order')));
  const tampered=path=>path==='lessons/a1-6.json'?'{"id":"A1-6","goal":"silently replaced"}':readLesson(path);
  assert.ok(validatePublishedCatalog({manifest,runtimeCourse:runtime,legacy,readLesson:tampered})
    .some(s=>s.includes('legacy content changed')));
});
test('cannot publish A1-10 while migrated A1-6..9 are still missing',()=>{
  const extra=structuredClone(runtime);
  extra.stages[0].chapters[1].lessons.push({
    id:'A1-10',title:'معرفی خانه و امکانات آن',status:'sample',
    file:'lessons/a1-10.json'
  });
  const errors=validatePublishedCatalog({manifest,runtimeCourse:extra,legacy,readLesson:path=>{
    if(path==='lessons/a1-10.json')return JSON.stringify({id:'A1-10'});
    return readLesson(path);
  }});
  assert.ok(errors.some(x=>x.includes('Cannot publish another new')));
  assert.ok(errors.some(x=>x.includes('roadmapRef')));
});
