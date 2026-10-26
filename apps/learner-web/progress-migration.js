// Old A1-6..9 and the previously active A1-3..6 have different teaching goals.
// Preserve their completion and activity state separately from the new lessons.
export const TARGET_REVISION='a1-owner-twelve-per-stage-2026-10-26';
const INTERMEDIATE_REVISION='a1-cumulative-owner-2026-10';
const PREVIOUS_REVISION='a1-canonical-six-2026-10';
const LEGACY_IDS=new Set(['A1-6','A1-7','A1-8','A1-9']);
const REORDERED_IDS=new Set(['A1-3','A1-4','A1-5','A1-6']);
const isLegacyKey=(key,ids)=>[...ids].some(id=>key===id||key.startsWith(id+':'));
function moveToArchive(result,ids,revision){
  const archive={revision,completed:[],fields:{},leitnerAdded:[]};
  if(Array.isArray(result.completed)) {
    archive.completed=result.completed.filter(id=>ids.has(id));
    result.completed=result.completed.filter(id=>!ids.has(id));
  }
  for(const [field,value] of Object.entries(result)) {
    if(field==='legacyCurriculum'||field==='completed'||field==='leitnerAdded'||!value||Array.isArray(value)||typeof value!=='object')continue;
    const moved=Object.fromEntries(Object.entries(value).filter(([key])=>isLegacyKey(key,ids)));
    if(Object.keys(moved).length) {
      archive.fields[field]=moved;
      result[field]=Object.fromEntries(Object.entries(value).filter(([key])=>!isLegacyKey(key,ids)));
    }
  }
  if(Array.isArray(result.leitnerAdded)) {
    archive.leitnerAdded=result.leitnerAdded.filter(card=>ids.has(card.lessonId));
    result.leitnerAdded=result.leitnerAdded.filter(card=>!ids.has(card.lessonId));
  }
  result.legacyCurriculum={...(result.legacyCurriculum||{}),[revision]:archive};
}
export function migrateLegacyProgress(saved) {
  if(!saved || typeof saved!=='object'||saved.curriculumRevision===TARGET_REVISION)return saved;
  const result=JSON.parse(JSON.stringify(saved));
  if(result.curriculumRevision!==INTERMEDIATE_REVISION) {
    if(result.curriculumRevision!==PREVIOUS_REVISION)
      moveToArchive(result,LEGACY_IDS,'oct-2026-preview-a1-6-9');
    moveToArchive(result,REORDERED_IDS,'oct-2026-canonical-before-reorder');
  }
  // Preserve a complete pre-October-26 snapshot for audit and safe recovery.
  const previous=JSON.parse(JSON.stringify(result));
  delete previous.legacyCurriculum;
  const map=new Map([
    ['A1-3','A1-4'],['A1-4','A1-3'],
    ['A1-8','A1-9'],['A1-9','A1-10'],['A1-10','A1-11'],
    ['A1-11','A1-13'],['A1-12','A1-14']
  ]);
  const moveId=id=>map.get(id)||id;
  const moveKey=key=>String(key).replace(/^(A1-\d+)(?=$|:)/,(_,id)=>moveId(id));
  if(Array.isArray(result.completed))result.completed=[...new Set(result.completed.map(moveId))];
  if(Array.isArray(result.leitnerAdded))result.leitnerAdded=result.leitnerAdded.map(card=>({ ...card, lessonId:moveId(card.lessonId) }));
  for(const [field,value] of Object.entries(result)) {
    if(field==='legacyCurriculum'||field==='completed'||field==='leitnerAdded'||!value||Array.isArray(value)||typeof value!=='object')continue;
    result[field]=Object.fromEntries(Object.entries(value).map(([key,entry])=>[moveKey(key),entry]));
  }
  result.legacyCurriculum={...(result.legacyCurriculum||{}),'oct-2026-before-twelve-per-stage':previous};
  result.curriculumRevision=TARGET_REVISION;
  return result;
}
