// The former published A1-6..9 taught different outcomes. Their completion and
// activity state are archived under a versioned key, never credited to new IDs.
// Retain the archived data in the same user record for future recovery.
export const TARGET_REVISION='a1-canonical-six-2026-10';
const LEGACY_IDS=new Set(['A1-6','A1-7','A1-8','A1-9']);
const isLegacyKey=key=>[...LEGACY_IDS].some(id=>key===id||key.startsWith(id+':'));
export function migrateLegacyProgress(saved) {
  if(!saved || typeof saved!=='object'||saved.curriculumRevision===TARGET_REVISION)return saved;
  const result=JSON.parse(JSON.stringify(saved));
  const archive={revision:'oct-2026-preview-a1-6-9',completed:[],
    fields:{},leitnerAdded:[]};
  if(Array.isArray(result.completed)) {
    archive.completed=result.completed.filter(id=>LEGACY_IDS.has(id));
    result.completed=result.completed.filter(id=>!LEGACY_IDS.has(id));
  }
  for(const [field,value] of Object.entries(result)) {
    if(field==='legacyCurriculum'||field==='completed'||field==='leitnerAdded'||!value||Array.isArray(value)||typeof value!=='object')continue;
    const moved=Object.fromEntries(Object.entries(value).filter(([key])=>isLegacyKey(key)));
    if(Object.keys(moved).length) {
      archive.fields[field]=moved;
      result[field]=Object.fromEntries(Object.entries(value).filter(([key])=>!isLegacyKey(key)));
    }
  }
  if(Array.isArray(result.leitnerAdded)) {
    archive.leitnerAdded=result.leitnerAdded.filter(card=>LEGACY_IDS.has(card.lessonId));
    result.leitnerAdded=result.leitnerAdded.filter(card=>!LEGACY_IDS.has(card.lessonId));
  }
  result.legacyCurriculum={...(result.legacyCurriculum||{}),[archive.revision]:archive};
  result.curriculumRevision=TARGET_REVISION;
  return result;
}
