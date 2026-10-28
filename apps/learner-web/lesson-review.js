/** Tutivar lesson → Leitner bridge. Pure immutable operations; no browser coupling. */
import { lexemeKey } from './word-bank.js';
const array = v => Array.isArray(v) ? v : [];
const text = v => typeof v === 'string' ? v.trim().replace(/\s+/g,' ') : '';
const unique = v => [...new Set(v)];
export function lessonReviewCandidates(bank, lessonId) {
  if(!text(lessonId)) return [];
  return array(bank?.entries).filter(entry=>array(entry.sources).some(source=>source?.lessonId===lessonId));
}
function findMatchingEntry(catalog, target) {
  const key=lexemeKey(target);
  return array(catalog?.entries).find(entry => {
    const forms = Object.values(entry.forms||{}).flatMap(value=>array(value).length ? value : [value]);
    return [entry.target, entry.lemma, ...forms].some(form=>lexemeKey(form)===key);
  });
}
/** Pin a canonical bank word for next admission, or add a custom phrase once. */
export function addFromLesson(progress, bank, { lessonId, entryId, target, meaning, example = '', sectionId = null, activityId = null } = {}) {
  if(!text(lessonId)) throw new TypeError('A lesson id is required');
  const result={...progress,pinnedReviewIds:unique(array(progress?.pinnedReviewIds)),leitnerAdded:array(progress?.leitnerAdded).slice()};
  let card=array(bank?.entries).find(entry=>entry.id===entryId);
  if(entryId && !card) throw new RangeError('Word is not in the current bank');
  if(!card){
    const front=text(target), back=text(meaning);
    if(!front || !back) throw new TypeError('Both language fields are required');
    if(front.length>180 || back.length>250 || /[<>]/.test(front+back)) throw new TypeError('Invalid card text');
    card=findMatchingEntry(bank,front);
    if(!card) {
      const existing=result.leitnerAdded.find(item=>lexemeKey(item.front)===lexemeKey(front));
      const id=existing?.id || `en:custom:${lexemeKey(front)}`;
      card={id,target:front,meaning:back};
      if(!existing)result.leitnerAdded.push({id,front,back,example:text(example).slice(0,300),lessonId,source:{lessonId,sectionId,activityId},type:/\s/.test(front)?'phrase':'word'});
    }
  }
  if(!result.pinnedReviewIds.includes(card.id))result.pinnedReviewIds.push(card.id);
  return {progress:result,cardId:card.id,alreadyPinned:array(progress?.pinnedReviewIds).includes(card.id),isNewCustom:card.id.startsWith('en:custom:')};
}
