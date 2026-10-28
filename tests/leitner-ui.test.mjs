import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLeitner,renderLeitnerSettings,renderWordBank } from '../apps/learner-web/leitner-ui.js';
import { ensureDailySession,reviewSummary,createLeitnerState } from '../apps/learner-web/leitner-engine.js';
const bank={entries:[{id:'en:plate',target:'plate',meaning:'بشقاب',partsOfSpeech:['noun'],example:'Put the plate on the table.',sources:[{lessonId:'A1-13'}],forms:{plural:['plates']},relations:[]}]};
const state=ensureDailySession(createLeitnerState({settings:{dailyLimit:10}}),bank,new Date('2026-10-27T12:00:00Z'));
test('front: exactly initial two buttons; meaning hidden',()=>{
 const ui=renderLeitner({state,bank,summary:reviewSummary(state,bank),pending:null});
 assert.match(ui,/>بلدم<\/button>/);assert.match(ui,/>بلد نیستم<\/button>/);
 assert.doesNotMatch(ui,/>حدس درست<\/button>/);assert.doesNotMatch(ui,/>اشتباه کردم<\/button>/);
 assert.doesNotMatch(ui,/tv-l-reveal/);
});
test('reveal: exact final labels, displays example and forms',()=>{
 const ui=renderLeitner({state,bank,summary:reviewSummary(state,bank),pending:{id:'en:plate',guess:'known'}});
 assert.match(ui,/>حدس درست<\/button>/);assert.match(ui,/>اشتباه کردم<\/button>/);
 assert.doesNotMatch(ui,/>حدسم درست بود<\/button>/);
 assert.match(ui,/plates/);assert.match(ui,/Put the plate/);
});
test('meaning-first setting reverses only center prompt, not example or morphology',()=>{
 const other=structuredClone(state);other.settings.direction='meaning-first';
 const ui=renderLeitner({state:other,bank,summary:reviewSummary(other,bank),pending:null});
 assert.match(ui,/<h2[^>]*>بشقاب<\/h2>/);
 assert.doesNotMatch(ui,/data-speak="plate"/); // avoid revealing the answer via audio before flip
});
test('settings and lexicon produce meaningful navigable UI',()=>{
 assert.match(renderLeitnerSettings({settings:state.settings,summary:reviewSummary(state,bank)}),/سقف کارت‌های متفاوت روزانه/);
 assert.match(renderWordBank({bank,reviewState:state}),/بانک لغات/);
});
