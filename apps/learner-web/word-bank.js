/** Language-specific lexeme identity with no invented semantic relations. */
export const BANK_SCHEMA_VERSION = 1;
const clean = s => String(s ?? '').normalize('NFKC').trim().replace(/\s+/g,' ');
const identity = s => clean(s).toLocaleLowerCase('en-US').replace(/[’]/g,"'").replace(/^["'.,!?\s]+|["'.,!?\s]+$/g,'');
export function lexemeKey(raw) { return identity(raw); }
const IRREGULAR = {
  better:'good',best:'good',worse:'bad',worst:'bad',
  went:'go',gone:'go',goes:'go',
  was:'be',were:'be',am:'be',is:'be',are:'be',been:'be',being:'be',
  has:'have',had:'have',does:'do',did:'do',done:'do',
  children:'child',men:'man',women:'woman',teeth:'tooth',feet:'foot',mice:'mouse',
};
const avoidStemming = new Set(['news','species','series','glass','class','bus','plus','this','his','us','as','has','was','is']);
/** Don't invent new lemmas from suffixes: merge only when the base exists in corpus. */
export function resolveLemma(word, existingLemmas = new Set()) {
  const w=identity(word);
  if (!w) return '';
  if (IRREGULAR[w]) return IRREGULAR[w];
  if (avoidStemming.has(w)) return w;
  const candidates=[];
  if(w.endsWith('ies') && w.length>4) candidates.push(w.slice(0,-3)+'y');
  if(w.endsWith('est') && w.length>5) candidates.push(w.slice(0,-3),w.slice(0,-3)+'e');
  if(w.endsWith('er') && w.length>4) candidates.push(w.slice(0,-2),w.slice(0,-2)+'e');
  if(w.endsWith('ing') && w.length>5) candidates.push(w.slice(0,-3),w.slice(0,-3)+'e');
  if(w.endsWith('ed') && w.length>3) candidates.push(w.slice(0,-2),w.slice(0,-1));
  if(w.endsWith('es') && w.length>4) candidates.push(w.slice(0,-2),w.slice(0,-1));
  if(w.endsWith('s') && w.length>3) candidates.push(w.slice(0,-1));
  // doubled consonant: bigger -> big, running -> run.
  for(const candidate of [...candidates]) {
    const end=candidate.at(-1);
    if (end && end===candidate.at(-2) && /[bcdfghjklmnpqrstvwxyz]/.test(end)) candidates.push(candidate.slice(0,-1));
  }
  return candidates.find(candidate=>existingLemmas.has(candidate)) || w;
}
const stringOr = (...vals)=>vals.find(v=>typeof v==='string' && v.trim())?.trim() || '';
const validWord = s => !!s && !/[.!?\n]/.test(s) && s.split(' ').length<=3 && s.length<=70;
const valueExample= raw => {
  const first = Array.isArray(raw) ? raw.find(Boolean) : raw;
  if(typeof first==='string')return first;
  if(first && typeof first==='object')return stringOr(first.en,first.target,first.text,first.sentence);
  return '';
};
const isWordListActivity = type => /^(vocabulary|word-review|word-bank|word-deck|vocabulary-deck|vocab-grid|word-study|lexicon)$/i.test(String(type || ''));
const fromItem=(raw,source)=>{
  if(!raw || typeof raw!=='object' || Array.isArray(raw))return null;
  const target=stringOr(raw.en,raw.english,raw.target,raw.word);
  const meaning=stringOr(raw.fa,raw.persian,raw.translation,raw.meaning);
  if(!validWord(target)||!meaning)return null;
  const pos=stringOr(raw.partOfSpeech,raw.pos,raw.wordClass,raw.grammar?.partOfSpeech,'unknown');
  const forms={};
  const potential = {plural:raw.plural || raw.grammar?.plural,comparative:raw.comparative || raw.grammar?.comparative,superlative:raw.superlative || raw.grammar?.superlative,verbForms:raw.verbForms || raw.grammar?.verbForms};
  for(const [key,val] of Object.entries(potential)) if(typeof val==='string' && val.trim() || Array.isArray(val) && val.length) forms[key]=val;
  return {target:clean(target),meaning:clean(meaning),pos,lemma:stringOr(raw.lemma,raw.baseForm),example:valueExample(raw.examples || raw.example),forms,source};
};
/** Narrow extraction intentionally avoids scraping unrelated dialogue/quiz distractors. */
export function extractLessonVocabulary(lesson,{lessonId=lesson.id||'',lessonOrder=0}={}){
  const result=[];
  function collect(items,sectionId,activityId){
    if (!Array.isArray(items))return;
    for(const entry of items){const word=fromItem(entry,{lessonId,sectionId,activityId,lessonOrder});if(word)result.push(word);}
  }
  collect(lesson.vocabulary,'','lesson-vocabulary');
  for(const section of lesson.sections||[]){
    const sectionId=section.id||'';
    collect(section.vocabulary,sectionId,'section-vocabulary');
    for(const activity of section.activities||[]){
      if(isWordListActivity(activity.type)) {
        collect(activity.items,sectionId,activity.id||activity.type);
        collect(activity.words,sectionId,activity.id||activity.type);
        collect(activity.vocabulary,sectionId,activity.id||activity.type);
      }
    }
  }
  return result;
}
const unique = arr => [...new Set(arr)];
/** Group by target-language lemma; many translations and POS may be senses of one lexeme. */
export function createWordBank(lessons,{pairId='fa-en',targetLanguage='en'}={}){
  const found=lessons.flatMap((value,i)=>extractLessonVocabulary(value.lesson||value,{lessonId:value.id||value.lesson?.id,lessonOrder:i}));
  const corpus=new Set(found.map(v=>identity(v.target)).filter(Boolean));
  const lexemes=new Map();
  for(const entry of found){
    const lemma=identity(entry.lemma)||resolveLemma(entry.target,corpus);
    const id=`${targetLanguage}:${lemma}`;
    const existing=lexemes.get(id)||{id,lemma,target:entry.lemma||entry.target,meaning:entry.meaning,meanings:[],partsOfSpeech:[],example:'',forms:{},sources:[],relations:[]};
    existing.meanings=unique([...existing.meanings,entry.meaning]);
    if(!existing.partsOfSpeech.includes(entry.pos))existing.partsOfSpeech.push(entry.pos);
    if(!existing.example && entry.example)existing.example=entry.example;
    if(identity(entry.target)===lemma)existing.target=entry.target;
    if(identity(entry.target)!==lemma){
      existing.forms.attested=unique([...(existing.forms.attested||[]),entry.target]);
      if(entry.lemma)existing.target=entry.lemma;
    }
    for(const [key,v] of Object.entries(entry.forms)) {
      const values=Array.isArray(v)?v:[v];
      existing.forms[key]=unique([...(existing.forms[key]||[]),...values.map(clean).filter(Boolean)]);
    }
    if(!existing.sources.some(source=>source.lessonId===entry.source.lessonId && source.activityId===entry.source.activityId))existing.sources.push(entry.source);
    lexemes.set(id,existing);
  }
  return {schemaVersion:BANK_SCHEMA_VERSION,pairId,targetLanguage,generatedFrom:'approved-active-lessons',entries:[...lexemes.values()]};
}
export function mergeLegacyCards(bank,legacyCards=[]){
  const entries=[...(bank?.entries||[])];
  const known=new Set();
  for(const entry of entries){
    const forms=[entry.target,entry.lemma,...Object.values(entry.forms||{}).flatMap(v=>Array.isArray(v)?v:[v])];
    for(const form of forms)if(typeof form==='string'&&form.trim())known.add(lexemeKey(form));
  }
  for(const card of legacyCards){
    if(!card||typeof card.front!=='string'||typeof card.back!=='string')continue;
    const key=lexemeKey(card.front);
    if(!key||known.has(key))continue;
    known.add(key);
    const id=typeof card.id==='string'&&card.id.startsWith('en:custom:')?card.id:`${bank?.targetLanguage||'en'}:${key}`;
    entries.push({id,lemma:key,target:card.front,meaning:card.back,meanings:[card.back],
      partsOfSpeech:[card.type==='phrase'?'phrase':'unknown'],example:card.example||'',forms:{},
      sources:card.source?[card.source]:card.lessonId?[{lessonId:card.lessonId}]:[],relations:[]});
  }
  return {...bank,entries};
}
