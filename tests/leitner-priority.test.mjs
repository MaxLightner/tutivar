import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeitnerState,ensureDailySession,answerCard } from '../apps/learner-web/leitner-engine.js';
const bank={entries:Array.from({length:4},(_,i)=>({id:`w${i}`,target:`word${i}`,meaning:`معنی${i}`}))};
const date=d=>new Date(d+'T12:00:00Z');
test('a pinned word is admitted before ordinary new words',()=>{
 const s=ensureDailySession(createLeitnerState({settings:{dailyLimit:2}}),bank,date('2026-10-27'),{priorityIds:['w3']});
 assert.deepEqual(s.day.admitted,['w3','w0']);
});
test('older due reviews precede pinned new words and quota is respected',()=>{
 let s=createLeitnerState({settings:{dailyLimit:1},cards:{w0:{id:'w0',box:1,dueAt:'2026-10-26T12:00:00Z',correct:1,failures:0,fastTrack:false,attempts:1}}});
 s=ensureDailySession(s,bank,date('2026-10-27'),{priorityIds:['w3']});
 assert.deepEqual(s.day.admitted,['w0']);
 assert.equal(s.cards.w3,undefined);
});
test('pinned words do not get added twice on session reload',()=>{
 let s=ensureDailySession(createLeitnerState({settings:{dailyLimit:1}}),bank,date('2026-10-27'),{priorityIds:['w3']});
 s=answerCard(s,'w3',{guess:'known',correct:true},date('2026-10-27'));
 s=ensureDailySession(s,bank,date('2026-10-27'),{priorityIds:['w3']});
 assert.deepEqual(s.day.queue,[]);assert.equal(s.day.admitted.length,1);
});
