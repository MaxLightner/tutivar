import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const site='https://maxlightner.github.io/tutivar/';
const bankResponse=await fetch(site+'data/word-bank.json?v=479d2e786a61');
assert.equal(bankResponse.ok,true,'deployed word bank must be accessible');
const bank=await bankResponse.json();
assert.equal(bank.sourceLessonIds.length,24,'all 24 active lessons should contribute');
assert.ok(bank.entries.length>100,'bank should have substantial vocabulary');
assert.equal(new Set(bank.entries.map(x=>x.id)).size,bank.entries.length,'no duplicate lexeme IDs');
console.log('Deployed word bank:',bank.entries.length,'unique entries from',bank.sourceLessonIds.length,'lessons');

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,acceptDownloads:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(site+'?v=479d2e786a61#/home',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.tv-home').waitFor({timeout:45000});
  assert.ok(await page.locator('.tv-home .tv-quick-card').count()>=3,'home shortcuts');
  await page.locator('button[data-nav="lessons"]:visible').last().click();
  await page.locator('.tv-lessons').waitFor();
  await page.locator('button[data-stage="A1.2"]').click();
  assert.equal(await page.locator('button.tv-lesson-row:not([disabled])').count(),12,'stage two ready lessons');
  await page.goto(site+'?v=479d2e786a61#/lesson/A1-1/foundation',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.lesson-page').waitFor({timeout:45000});
  const reviewPanel=page.locator('.tv-l-lesson-panel');
  await reviewPanel.waitFor();
  await reviewPanel.locator('summary').click();
  const pin=reviewPanel.locator('button[data-pin-review]:not([disabled])').first();
  assert.ok(await pin.count(),'lesson should expose vocabulary for review');
  await pin.click();
  let saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('tutivar:fa-en:preview:v1')));
  assert.ok(saved.pinnedReviewIds?.length>0,'lesson word pinned for review');
  await page.goto(site+'?v=479d2e786a61#/leitner',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.tv-l-card').waitFor({timeout:45000});
  await page.locator('[data-action="leitner-known"]').click();
  await page.locator('[data-action="leitner-correct"]').click();
  saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('tutivar:fa-en:preview:v1')));
  assert.ok(saved.leitnerV2?.history?.length>=1,'review history persisted');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.tv-l-page').waitFor();
  saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('tutivar:fa-en:preview:v1')));
  assert.ok(saved.leitnerV2?.history?.length>=1,'progress survives reload');
  await page.setViewportSize({width:320,height:720});
  await page.goto(site+'?v=479d2e786a61#/home',{waitUntil:'domcontentloaded'});
  await page.locator('.tv-home').waitFor();
  const size=await page.evaluate(()=>({content:document.documentElement.scrollWidth,width:window.innerWidth}));
  assert.ok(size.content<=size.width+2,'mobile home must not overflow horizontally: '+JSON.stringify(size));
  assert.deepEqual(errors,[],'unhandled browser JS errors');
  console.log('Mobile browser smoke passed: Home, stage 2, lesson, pin, review, persistence, 320px width.');
} finally {
  await browser.close();
}
