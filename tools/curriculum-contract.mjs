import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const read = (path, base = root) => JSON.parse(readFileSync(join(base, path), 'utf8'));
export const LEVELS = Object.freeze({ A1: 34, A2: 30, B1: 29, B2: 33 });
const levelOrder = Object.keys(LEVELS);

export function gitBlobSha(content) {
  return createHash('sha1').update('blob ' + Buffer.byteLength(content, 'utf8') + '\0' + content).digest('hex');
}

/** The owner's exact seven-column rows; no editorial "correction" is performed here. */
export function parseCanonicalSource(source) {
  const rows = source.split(/\r?\n/).filter(line => /^\|\s*(?:A1|A2|B1|B2)-\d+\s+—/.test(line));
  return rows.map((line) => {
    const cols = line.split('|').slice(1, -1).map(value => value.trim());
    const match = cols[0]?.match(/^(A1|A2|B1|B2)-(\d+)\s+—\s+(.+)$/);
    if (cols.length !== 7 || !match) throw new Error('Malformed curriculum row: ' + line);
    return {
      id: match[1] + '-' + match[2], level: match[1], order: Number(match[2]), title: match[3],
      axis: cols[1], communicativeOutcome: cols[2], prerequisiteBridge: cols[3],
      prerequisiteIds: [...new Set(cols[3].match(/\b(?:A1|A2|B1|B2)-\d+\b/g) || [])],
      globalConcept: cols[4], scopeBoundary: cols[5], archetypes: cols[6].match(/\bK\d+\b/g) || []
    };
  });
}

export function validateCanonicalManifest({ source, manifest, lock }) {
  const errors = [];
  if (manifest.revision !== lock.approvedRevision) errors.push('Canonical manifest revision does not match approved lock');
  if (lock.sourcePath !== manifest.sourcePath || lock.manifestPath !== 'content/curriculum/universal-path.v1.json')
    errors.push('Canonical source or manifest path mismatch');
  if (lock.sourceGitBlobSha !== gitBlobSha(source) || manifest.sourceGitBlobSha !== lock.sourceGitBlobSha)
    errors.push('Universal source was changed without updating owner-authorized curriculum lock');
  if (lock.manifestGitBlobSha !== gitBlobSha(JSON.stringify(manifest, null, 2) + '\n'))
    errors.push('Universal lesson table was changed without updating owner-authorized curriculum lock');
  if (manifest.schemaVersion !== 1 || manifest.totals?.total !== 126) errors.push('Unexpected curriculum schema or size');
  if (!Array.isArray(manifest.lessons)) return [...errors, 'Missing canonical lessons'];
  const expected = parseCanonicalSource(source);
  if (expected.length !== 126 || manifest.lessons.length !== 126) errors.push('Curriculum must have 126 lessons');
  if (JSON.stringify(expected) !== JSON.stringify(manifest.lessons)) errors.push('Manifest and user-provided roadmap rows differ');
  const byId = new Map();
  for (const level of levelOrder) {
    const entries = manifest.lessons.filter(l => l.level === level);
    if (entries.length !== LEVELS[level]) errors.push(level + ': expected ' + LEVELS[level] + ' lessons');
    entries.forEach((entry, i) => {
      const expectedId = level + '-' + (i + 1);
      if (entry.id !== expectedId || entry.order !== i + 1) errors.push('Canonical sequence wrong at ' + expectedId);
      if (byId.has(entry.id)) errors.push('Duplicate canonical lesson ' + entry.id);
      byId.set(entry.id, entry);
      if (!entry.title || !entry.communicativeOutcome || !entry.scopeBoundary || !entry.archetypes.length)
        errors.push(entry.id + ': no documented goal, boundary or archetype');
    });
  }
  for (const lesson of manifest.lessons) {
    for (const dep of lesson.prerequisiteIds) {
      const before = byId.get(dep);
      if (!before) errors.push(lesson.id + ': unknown prerequisite ' + dep);
      else if (levelOrder.indexOf(before.level) > levelOrder.indexOf(lesson.level) ||
               (before.level === lesson.level && before.order >= lesson.order))
        errors.push(lesson.id + ': forward prerequisite ' + dep);
    }
  }
  const approvals = lock.approvedChanges || [];
  if (lock.approvedRevision !== '2026-10-02-rewrite-1' &&
      (!approvals.length || approvals.at(-1).revision !== lock.approvedRevision ||
       approvals.at(-1).authorizedBy !== 'product-owner' || !approvals.at(-1).decisionReference ||
       !approvals.at(-1).rationale))
    errors.push('Changed curriculum has no explicit owner amendment record');
  if (lock.approvedRevision === '2026-10-02-rewrite-1' && approvals.length)
    errors.push('Baseline lock must not invent owner amendments');
  return errors;
}

export function validatePublishedCatalog({ manifest, runtimeCourse, legacy, readLesson = null }) {
  const errors = [];
  const canonicalById = new Map(manifest.lessons.map(l => [l.id, l]));
  const chapters = (runtimeCourse.stages || []).flatMap(s => s.chapters || []);
  const entries = chapters.flatMap(c => c.lessons || [])
    .filter(x => x && !Array.isArray(x) && /^A1-\d+$/.test(x.id || ''));
  const ids = entries.map(x => x.id);
  if (new Set(ids).size !== ids.length) errors.push('A1 runtime course repeats a lesson ID');
  const numbers = ids.map(x => Number(x.split('-')[1]));
  if (numbers.some((n, i) => n !== i + 1))
    errors.push('Published A1 order differs from the 126-lesson owner roadmap (must be a contiguous prefix)');
  const frozen = new Map((legacy.lockedMismatches||[]).map(x => [x.id, x]));
  const originallyPublished = new Set(legacy.legacyPublished);
  const metadataGrandfathered = new Set(['A1-1', 'A1-2']);
  for (const entry of entries) {
    const canonical = canonicalById.get(entry.id);
    if (!canonical) { errors.push(entry.id + ': missing from canonical roadmap'); continue; }
    const exception = frozen.get(entry.id);
    if (exception) {
      if (!originallyPublished.has(entry.id) || entry.title !== exception.catalogTitle)
        errors.push(entry.id + ': historical exception changed without migration');
      if (!entry.file || !readLesson) continue;
      const raw = readLesson(entry.file);
      if (!raw || gitBlobSha(raw) !== exception.legacyGitBlobSha)
        errors.push(entry.id + ': legacy content changed; use versioned curriculum migration');
      continue;
    }
    if (entry.title !== canonical.title && !legacy.contentGaps.some(g => g.id === entry.id && g.allowTitleAlias))
      errors.push(entry.id + ': published title differs from owner-approved target "' + canonical.title + '"');
    if (!readLesson || !entry.file) { if (!entry.file) errors.push(entry.id + ': published lesson lacks a file'); continue; }
    const raw = readLesson(entry.file);
    if (!raw) { errors.push(entry.id + ': missing published content'); continue; }
    const lesson = JSON.parse(raw);
    if (lesson.id !== entry.id) errors.push(entry.id + ': file lesson identifier mismatch');
    if (!metadataGrandfathered.has(entry.id)) {
      const ref = lesson.roadmapRef;
      if (!ref || ref.id !== entry.id || ref.revision !== manifest.revision ||
          ref.communicativeOutcome !== canonical.communicativeOutcome)
        errors.push(entry.id + ': new lesson must embed the canonical roadmapRef (id, revision, exact outcome)');
    }
  }
  // Old 6–9 are only grandfathered while they await replacement. Never add A1-10
  // to the live path before this mismatch has been resolved and removed.
  if ((legacy.lockedMismatches||[]).length && ids.some(id => Number(id.slice(3)) > 9))
    errors.push('Cannot publish another new A1 lesson before migrating existing wrong-order A1-6..9');
  const checked = new Set((legacy.lockedMismatches||[]).map(x => x.id));
  for (const mismatch of legacy.lockedMismatches||[]) {
    if (!originallyPublished.has(mismatch.id)) errors.push(mismatch.id + ': unauthorized legacy exception');
    if (!/^A1-[6-9]$/.test(mismatch.id)) errors.push(mismatch.id + ': only current A1-6..9 may be grandfathered');
    if (!mismatch.preserveProgress || !mismatch.legacyGitBlobSha || !mismatch.canonicalTarget)
      errors.push(mismatch.id + ': migration history incomplete');
    if (!ids.includes(mismatch.id)) errors.push(mismatch.id + ': legacy entry removed without documented progress migration');
  }
  if (checked.size !== (legacy.lockedMismatches||[]).length) errors.push('Repeated legacy exception ID');
  for(const archived of legacy.archivedMismatches||[]) {
    if(!archived.preserveProgress||!archived.legacyGitBlobSha||!archived.archivedFile)
      errors.push(archived.id+': archived lesson has no recovery record');
    const raw=readLesson?.(archived.archivedFile);
    if(!raw||gitBlobSha(raw)!==archived.legacyGitBlobSha)
      errors.push(archived.id+': immutable archived lesson changed');
    if(ids.includes(archived.id)&&!/-v[2-9]\d*\.json$/.test(entries.find(x=>x.id===archived.id)?.file||''))
      errors.push(archived.id+': replacement must use a distinct versioned file');
  }
  if((legacy.archivedMismatches||[]).length && legacy.progressMigration?.revision!=='a1-canonical-six-2026-10')
    errors.push('Historical progress migration contract is missing');
  if(legacy.cumulativeReorder){
    if(!legacy.cumulativeReorder.preserveProgress||!legacy.cumulativeReorder.archiveNamespace||legacy.cumulativeReorder.progressRevision!=='a1-cumulative-owner-2026-10')
      errors.push('A1 reorder is missing preserved learner-progress history');
    for(const previous of legacy.cumulativeReorder.previousActive||[]){
      const raw=readLesson?.(previous.file);
      if(!previous.gitBlobSha||!raw||gitBlobSha(raw)!==previous.gitBlobSha)
        errors.push(previous.id+': earlier active lesson body was not preserved');
      const replacement=legacy.cumulativeReorder.replacements?.[previous.id];
      if(!replacement||entries.find(x=>x.id===previous.id)?.file!==replacement||replacement===previous.file)
        errors.push(previous.id+': reordered lesson lacks a versioned replacement');
    }
  }
  return errors;
}

/**
 * All future pair/level catalogs use the same 126-slot path; unlike the frozen
 * fa-en A1 preview, they have no legacy exception. Indexes and objectives
 * are always checked, even when the pair has not been deployed yet.
 */
export function validateFutureLevelCatalog({manifest, course, readLesson = null}) {
  const errors = [];
  const level = course.level?.toUpperCase();
  if (!Object.hasOwn(LEVELS,level)) return ['Unknown level in future curriculum: ' + level];
  const rows=(course.stages || []).flatMap(s=>s.chapters || []).flatMap(c=>c.lessons || []);
  if (rows.some(row=>Array.isArray(row)))
    errors.push(level + ': future catalogs need canonical IDs, not untracked title-only placeholders');
  const entries=rows.filter(e=>e && !Array.isArray(e) && /^(?:A1|A2|B1|B2)-\d+$/.test(e.id || ''));
  const byId=new Map(manifest.lessons.map(l=>[l.id,l]));
  const present=new Set();
  entries.forEach((entry,index)=>{
    const expected=level+'-'+(index+1);
    if (entry.id!==expected)errors.push(level+': out of order or missing '+expected);
    if(present.has(entry.id))errors.push(level+': duplicate '+entry.id);
    present.add(entry.id);
    const canonical=byId.get(entry.id);
    if(!canonical || canonical.level!==level){errors.push(entry.id+': not in the approved level');return;}
    if(entry.title!==canonical.title)errors.push(entry.id+': incorrect canonical lesson title');
    if(entry.status==='sample' && !entry.file)errors.push(entry.id+': published without a file');
    if(!entry.file || !readLesson)return;
    const raw=readLesson(entry.file);
    if(!raw){errors.push(entry.id+': file missing');return;}
    let authored;
    try{authored=JSON.parse(raw);}catch{errors.push(entry.id+': lesson is invalid JSON');return;}
    if(authored.id!==entry.id)errors.push(entry.id+': content ID mismatch');
    const ref=authored.roadmapRef;
    if(!ref || ref.id!==entry.id || ref.revision!==manifest.revision ||
       ref.communicativeOutcome!==canonical.communicativeOutcome)
      errors.push(entry.id+': new lesson requires the approved roadmapRef');
  });
  return errors;
}

export function auditCurriculum(base = root) {
  const manifest = read('content/curriculum/universal-path.v1.json', base);
  const lock = read('content/curriculum/roadmap.lock.json', base);
  const legacy = read('content/curriculum/legacy-alignment.json', base);
  const source = readFileSync(join(base, manifest.sourcePath), 'utf8');
  const course = read('content/language-pairs/fa-en/curriculum.a1.json', base);
  const get = path => {
    const filepath = join(base, 'content/language-pairs/fa-en', path);
    return existsSync(filepath) ? readFileSync(filepath, 'utf8') : null;
  };
  const errors = [...validateCanonicalManifest({source, manifest, lock}),
    ...validatePublishedCatalog({manifest, runtimeCourse:course, legacy, readLesson:get})];
  const pairRoot = join(base,'content/language-pairs');
  for (const pairId of readdirSync(pairRoot,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name)) {
    const dir=join(pairRoot,pairId);
    for (const name of readdirSync(dir).filter(x=>/^curriculum\.(?:a1|a2|b1|b2)\.json$/i.test(x))) {
      if (pairId==='fa-en' && name==='curriculum.a1.json') continue;
      const otherCourse=JSON.parse(readFileSync(join(dir,name),'utf8'));
      const getOther=path=>{
        const filepath=join(dir,path);
        return existsSync(filepath)?readFileSync(filepath,'utf8'):null;
      };
      errors.push(...validateFutureLevelCatalog({manifest,course:otherCourse,readLesson:getOther})
        .map(error=>pairId+'/'+name+': '+error));
    }
  }
  return {errors, manifest, legacy};
}

function cli() {
  const mode = process.argv[2] || '--validate';
  const {errors,manifest,legacy} = auditCurriculum();
  if (errors.length) {
    console.error(errors.map(msg => 'FAIL: ' + msg).join('\n'));
    process.exitCode = 1; return;
  }
  if (mode === '--plan') {
    const id = process.argv[3];
    const lesson = manifest.lessons.find(l => l.id === id);
    if (!lesson) { console.error('Unknown lesson: ' + id); process.exitCode = 1; return; }
    console.log(JSON.stringify({
      ...lesson, roadmapRef:{id:lesson.id,revision:manifest.revision,
        communicativeOutcome:lesson.communicativeOutcome},
      status:(legacy.lockedMismatches||[]).some(l=>l.id===id)?'legacy-must-migrate':((legacy.lockedMismatches||[]).length && Number(id.split('-')[1])>9 && id.startsWith('A1-')?'blocked-until-legacy-migration':'approved-for-authoring'),
      authoringRule:'Use existing interaction modules; trace every target through introduction, practice, independent production and spaced review.'
    },null,2));
  } else if (mode === '--status') {
    console.log('Canonical path: 126 lessons; A1=34, A2=30, B1=29, B2=33');
    console.log('Live baseline: ' + legacy.legacyPublished.join(', '));
    console.log('Frozen out-of-plan content: ' + (legacy.lockedMismatches||[]).map(x=>x.id+' → '+x.canonicalTarget).join('; '));
    console.log('Archived legacy lessons: '+(legacy.archivedMismatches||[]).map(x=>x.id).join(', '));
    console.log('Known content gaps: ' + legacy.contentGaps.map(x=>x.id).join(', '));
    console.log((legacy.lockedMismatches||[]).length?'New publications blocked until existing A1-6..9 are safely migrated.':'Legacy content versioned and retired from the active path.');
  } else if (mode === '--validate') {
    console.log('PASS: canonical 126-lesson sequence, owner lock, prerequisites and published path');
  } else {
    console.error('Usage: node tools/curriculum-contract.mjs --validate | --status | --plan A1-10');
    process.exitCode = 1;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
