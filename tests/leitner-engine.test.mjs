import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeitnerState, ensureDailySession, answerCard, reviewSummary, isReviewDue, normalizeReviewSettings } from '../apps/learner-web/leitner-engine.js';
const bank = n => ({entries:Array.from({length:n},(_,i)=>({id:`w${i}`,target:`word${i}`,meaning:`معنی${i}`}))});
const t = date => new Date(`${date}T12:00:00Z`);
function grade(s,id,guess,correct,when){return answerCard(s,id,{guess,correct},t(when));}
test('day quota unique count, due always precedes new and backlog blocks new',()=>{
 let s=createLeitnerState({settings:{dailyLimit:2}});
 s=ensureDailySession(s,bank(5),t('2026-10-27'));
 assert.deepEqual(s.day.admitted,['w0','w1']);
 assert.deepEqual(s.day.queue,['w0','w1']);
 s=grade(s,'w0','known',true,'2026-10-27');s=grade(s,'w1','known',true,'2026-10-27');
 s=ensureDailySession(s,bank(5),t('2026-10-27'));assert.deepEqual(s.day.queue,[]);
 s=ensureDailySession(s,bank(5),t('2026-10-28'));assert.deepEqual(s.day.queue,['w0','w1']);
 assert.equal(s.cards.w2,undefined);
});
test('first two correct answers zero→1→4, then normal increments',()=>{
 let s=ensureDailySession(createLeitnerState({settings:{dailyLimit:1}}),bank(1),t('2026-10-27'));
 s=grade(s,'w0','known',true,'2026-10-27');
 assert.equal(s.cards.w0.box,1); assert.equal(s.cards.w0.fastTrack,true);
 s=ensureDailySession(s,bank(1),t('2026-10-28'));
 s=grade(s,'w0','known',true,'2026-10-28');
 assert.equal(s.cards.w0.box,4);assert.equal(s.cards.w0.fastTrack,false);
 s=ensureDailySession(s,bank(1),t('2026-11-01'));
 s=grade(s,'w0','known',true,'2026-11-01');assert.equal(s.cards.w0.box,8);
});
test('not knowing zero repeats last; first-time failure permanently disables skip',()=>{
 let s=ensureDailySession(createLeitnerState({settings:{dailyLimit:2}}),bank(2),t('2026-10-27'));
 s=grade(s,'w0','unknown',false,'2026-10-27');
 assert.deepEqual(s.day.queue,['w1','w0']);
 s=grade(s,'w1','known',true,'2026-10-27');s=grade(s,'w0','known',true,'2026-10-27');
 s=ensureDailySession(s,bank(2),t('2026-10-28'));
 s=grade(s,'w0','known',true,'2026-10-28');assert.equal(s.cards.w0.box,2);
});
test('failure in higher houses moves one ordinal house back and disables future skips',()=>{
 let s=ensureDailySession(createLeitnerState({settings:{dailyLimit:1}}),bank(1),t('2026-10-27'));
 s=grade(s,'w0','known',true,'2026-10-27');
 s=ensureDailySession(s,bank(1),t('2026-10-28'));
 s=grade(s,'w0','known',false,'2026-10-28');
 assert.equal(s.cards.w0.box,0);assert.deepEqual(s.day.queue,['w0']);
 s=grade(s,'w0','known',true,'2026-10-28');assert.equal(s.cards.w0.box,1);
 s=ensureDailySession(s,bank(1),t('2026-10-29'));s=grade(s,'w0','known',true,'2026-10-29');
 assert.equal(s.cards.w0.box,2);
});
test('64 is terminal and not counted as due',()=>{
 let s=ensureDailySession(createLeitnerState({settings:{dailyLimit:1}}),bank(1),t('2026-10-27'));
 s.cards.w0.box=32;s.cards.w0.dueAt=t('2026-10-27').toISOString();
 s=grade(s,'w0','known',true,'2026-10-27');
 assert.equal(s.cards.w0.box,64);assert.equal(s.cards.w0.dueAt,null);
 assert.equal(isReviewDue(s.cards.w0,t('2027-02-01')),false);
 assert.equal(reviewSummary(s,bank(1),t('2027-02-01')).learned,1);
 assert.deepEqual(ensureDailySession(s,bank(1),t('2027-02-01')).day.queue,[]);
});
test('daily limit clamps, settings keep grammar preferences and direction',()=>{
 let v=normalizeReviewSettings({dailyLimit:500,direction:'meaning-first',forms:{plural:false},tts:false});
 assert.equal(v.dailyLimit,200); assert.equal(v.forms.plural,false);assert.equal(v.forms.superlative,true);
 assert.equal(v.tts,false);assert.equal(v.direction,'meaning-first');
});
test('session has no duplicate cards, persists between reloads',()=>{
 let s=ensureDailySession(createLeitnerState({settings:{dailyLimit:3}}),bank(3),t('2026-10-27'));
 s=grade(s,'w0','unknown',false,'2026-10-27');
 s=ensureDailySession(JSON.parse(JSON.stringify(s)),bank(3),t('2026-10-27'));
 assert.deepEqual(s.day.queue,['w1','w2','w0']);assert.equal(s.day.admitted.length,3);
});
test('unfinished zero-house cards remain in queue on following day ahead of new cards',()=>{
 let s=ensureDailySession(createLeitnerState({settings:{dailyLimit:1}}),bank(2),t('2026-10-27'));
 assert.deepEqual(s.day.queue,['w0']);
 s=ensureDailySession(s,bank(2),t('2026-10-28'));
 assert.deepEqual(s.day.queue,['w0']);
 assert.equal(s.cards.w1,undefined);
});
