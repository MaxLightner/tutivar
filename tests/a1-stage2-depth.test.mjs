import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderActivity } from '../apps/learner-web/lesson-modules.js';
import { reduceStage2Mission } from '../apps/learner-web/stage2-missions.js';
import { inspectVocabularyContinuity, inspectCorePracticeCoverage } from '../tools/audit-vocabulary.mjs';
import { validateSentenceComposer, resolveSentenceComposer, composeSegments } from '../apps/learner-web/sentence-composer.js';
import { evaluateResponse } from '../apps/learner-web/practice-engine.js';
import { projectRoot } from '../tools/validate.mjs';

const root=join(projectRoot,'content/language-pairs/fa-en/');
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const course=read('curriculum.a1.json');
const lessons=course.stages[1].chapters.flatMap(ch=>ch.lessons).filter(c=>Number(c.id.split('-')[1])>=15).map(c=>read(c.file));
const all=l=>l.sections.flatMap(s=>s.activities);
const get=(l,t)=>all(l).find(a=>a.type===t);

test('all ten revised lessons use meaningful interactions, numerous retrieval prompts and visible bilingual grammar',()=>{
  assert.equal(lessons.length,10);
  assert.deepEqual(inspectVocabularyContinuity(lessons),[]);
  assert.deepEqual(inspectCorePracticeCoverage(lessons),[]);
  for(const l of lessons){
    const activities=all(l),v=get(l,'vocabulary'),questions=get(l,'exchange-lab'),composer=get(l,'sentence-composer');
    assert.ok(v.items.filter(w=>w.role!=='supplementary').length>=8,l.id+' core vocabulary');
    assert.ok(v.items.filter(w=>w.role==='supplementary').length>=3,l.id+' supplementary vocabulary');
    assert.ok(questions.pairs.length>=7,l.id+' question exploration');
    assert.equal(questions.requireRecall,true);
    for(const exchange of questions.pairs.slice(-4)){
      assert.ok(exchange.variants.length>=2,l.id+' contextual answer variations');
      assert.notEqual(exchange.questionFa,exchange.variants[0].fa,l.id+' answer translation must not repeat question');
      assert.notEqual(exchange.variants[0].en,exchange.variants[1].en,l.id+' independent contextual answers');
      assert.ok(exchange.variants.every(variant=>variant.fa.length>=8),l.id+' translated answers');
    }
    assert.ok(get(l,'response-practice').tasks.length>=8,l.id+' own-language production');
    assert.ok(get(l,'guided-dialogue').turns.length>=7,l.id+' contextual production');
    assert.ok(activities.some(a=>a.type==='mission-lab'),l.id+' missing mission');
    assert.equal(activities.some(a=>a.type==='quiz-set'),false,l.id+' still generic quiz');
    assert.deepEqual(validateSentenceComposer(composer),[],l.id+' composer');
    assert.ok(composer.patterns.every(p=>p.translationSegments?.length>0),l.id+' translations');
    const p=resolveSentenceComposer(composer);
    assert.ok(composeSegments(p.pattern.translationSegments,composer,p).length>8,l.id+' visible meaning');
  }
});

test('comparison, body, symptoms, roles and clothing require correct visual decisions before advancing',()=>{
  for(const l of lessons.filter(l=>Number(l.id.split('-')[1])<=19)){
    const a=all(l).find(a=>a.type==='mission-lab'),scene=a.scenes[0];
    assert.ok(a.scenes.length>=8,l.id);
    const wrong=scene.options.find(o=>o.id!==scene.correct).id;
    const checkedWrong=reduceStage2Mission(a,{},'choose',wrong);
    assert.equal(checkedWrong.solved,false,l.id);
    assert.equal(reduceStage2Mission(a,checkedWrong,'next','').round,undefined);
    const checkedRight=reduceStage2Mission(a,checkedWrong,'choose',scene.correct);
    assert.equal(checkedRight.solved,true,l.id);
    assert.equal(reduceStage2Mission(a,checkedRight,'next','').round,1,l.id);
  }
});

test('shopping list and receipt retain quantities, enforce exact lists and require paying',()=>{
  for(const n of [20,21]){
    const a=all(lessons.find(l=>l.id==='A1-'+n)).find(a=>a.type==='mission-lab'&&a.mode==='basket');
    const scenario=a.scenes[0];let s={};
    s=reduceStage2Mission(a,s,'check','');assert.equal(s.solved,false);
    for(const p of scenario.products) for(let i=0;i<p.need;i++)s=reduceStage2Mission(a,s,'add',p.id);
    s=reduceStage2Mission(a,s,'check','');assert.equal(s.solved,true);
    if(a.checkout){
      assert.equal(reduceStage2Mission(a,s,'next','').round,undefined,'payment is mandatory before advancing');
      s=reduceStage2Mission(a,s,'method','cash');s=reduceStage2Mission(a,s,'pay','');assert.equal(s.paid,true);
    }
  }
});

test('city map has ten destinations and navigation accepts an alternative valid route',()=>{
  const city=all(lessons.find(l=>l.id==='A1-22')).find(a=>a.type==='mission-lab');
  assert.equal(city.mode,'city');assert.ok(city.missions.length>=9);
  let state=reduceStage2Mission(city,{},'choose',city.missions[0].correct);
  assert.equal(state.solved,true);
  const route=all(lessons.find(l=>l.id==='A1-23')).find(a=>a.type==='mission-lab');
  assert.equal(route.mode,'route');
  // Route from (0,1) to the actual park at (1,2): south then east is valid too.
  let walk={};for(const dir of ['south','east'])walk=reduceStage2Mission(route,walk,'move',dir);
  assert.equal(walk.solved,true);
});

test('clothing has bilingual sentence and supplementary terms; city map and receipt render as actual controls',()=>{
  const clothing=lessons.find(l=>l.id==='A1-16');
  const activity=get(clothing,'sentence-composer');
  const selected=resolveSentenceComposer(activity);
  assert.match(composeSegments(selected.pattern.translationSegments,activity,selected),/پوشیده/);
  for(const n of [16,21,22,23]){
    const l=lessons.find(l=>l.id==='A1-'+n),mission=all(l).find(a=>a.type==='mission-lab');
    const html=renderActivity(mission,{lessonId:l.id,index:0,e:String,en:String,i:()=>'',progress:{missionLabStates:{}}});
    assert.match(html,/data-mission-key=/);
    if(n===21)assert.match(html,/shopping|SHOPPING/i);
    if(n===22)assert.match(html,/city-map/);
  }
});

test('new lessons do not combine invalid grammar or reject equivalent practical replies',()=>{
  for(const n of [15,17,19,23]){
    const l=lessons.find(l=>l.id==='A1-'+n),composer=get(l,'sentence-composer');
    const picked=n===19?{role:'role-0'}:{};
    for(const pattern of composer.patterns){
      const resolved=resolveSentenceComposer(composer,{pattern:pattern.id,slots:picked});
      const english=composeSegments(pattern.segments,composer,resolved);
      const persian=composeSegments(pattern.translationSegments,composer,resolved);
      assert.doesNotMatch(english,/I think [A-Z]|is builder|Go straight at the park/,l.id+' grammar');
      assert.ok(persian.length>=10,l.id+' meaning');
    }
  }
  const illness=lessons.find(l=>l.id==='A1-18');
  const eye=all(illness).find(a=>a.type==='response-practice').tasks.find(t=>t.example==='My right eye hurts.');
  assert.equal(evaluateResponse(eye.assessment,'I have pain in my right eye.').ok,true);
  const jobs=all(lessons.find(l=>l.id==='A1-19')).find(a=>a.type==='response-practice');
  const builder=jobs.tasks.find(t=>t.example.includes('This man is a builder.'));
  assert.equal(evaluateResponse(builder.assessment,'He is a builder and he builds houses.').ok,true);
  const city=all(lessons.find(l=>l.id==='A1-22')).find(a=>a.type==='mission-lab');
  const park=city.places.find(p=>p.id==='park'),market=city.places.find(p=>p.id==='market');
  assert.equal(Math.abs(park.x-market.x)+Math.abs(park.y-market.y),1,'market is next to park');
  const route=all(lessons.find(l=>l.id==='A1-23')).find(a=>a.type==='mission-lab');
  const routePark=route.places.find(p=>p.id==='park');
  assert.deepEqual(route.missions[0].end,{x:routePark.x,y:routePark.y},'first route must reach park');
});
