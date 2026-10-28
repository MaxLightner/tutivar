import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordBank, extractLessonVocabulary, resolveLemma, mergeLegacyCards } from '../apps/learner-web/word-bank.js';
const lessons=[
 {id:'A1-1',lesson:{id:'A1-1',sections:[{id:'foundation',activities:[{type:'vocabulary',id:'vocab',items:[
  {en:'good',fa:'خوب',pos:'adjective',examples:['A good day.'],comparative:'better',superlative:'best'},
  {en:'plate',fa:'بشقاب',pos:'noun',plural:'plates'},
  {en:'plates',fa:'بشقاب‌ها',pos:'noun'},
  {en:'better',fa:'بهتر',pos:'adjective'},
  {en:'best',fa:'بهترین',pos:'adjective'}
 ]}]}]}},
 {id:'A1-2',lesson:{sections:[{id:'foundation',vocabulary:[{en:'plate',fa:'بشقاب',pos:'noun'},{en:'spoon',fa:'قاشق'}],activities:[{type:'dialogue',lines:[{en:'Come here',fa:'بیا اینجا'}]}]}]}}
];
test('extracts vocabulary only; no unrelated dialogue lines or quiz distractors',()=>{
 assert.equal(extractLessonVocabulary(lessons[1].lesson).length,2);
});
test('lexemes are unique; inflected forms are not separate review cards',()=>{
 const bank=createWordBank(lessons);
 assert.equal(bank.entries.length,3);
 const good=bank.entries.find(x=>x.id==='en:good');
 assert.deepEqual(good.meanings,['خوب','بهتر','بهترین']);
 assert.deepEqual(good.forms.comparative,['better']);
 const plate=bank.entries.find(x=>x.id==='en:plate');
 assert.equal(plate.sources.length,2);
 assert.deepEqual(plate.forms.plural,['plates']);
 assert.deepEqual(plate.forms.attested,['plates']);
});
test('does not invent relationships or aggressive suffix stemming',()=>{
 const b=createWordBank(lessons);
 assert.deepEqual(b.entries.find(x=>x.id==='en:spoon').relations,[]);
 assert.equal(resolveLemma('news',new Set(['new'])),'news');
 assert.equal(resolveLemma('better',new Set()),'good');
});
test('legacy cards deduplicate against live word bank',()=>{
 const b=mergeLegacyCards(createWordBank(lessons),[{front:'Plate',back:'بشقاب'},{front:'table',back:'میز'}]);
 assert.equal(b.entries.length,4);
});
