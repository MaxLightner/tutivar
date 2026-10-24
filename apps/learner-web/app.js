import { renderActivity } from './lesson-modules.js';
import { advanceDeck, answerDeck, deckState, jumpDeck, resumeDeck, wordId } from './word-review.js';
import { evaluateResponse, practiceState, submitPractice } from './practice-engine.js';

const $root = document.getElementById('app');
// The compiled JS URL carries the deployment SHA. Use it for lesson and course
// data too, so old service-worker/CDN caches cannot mix versions after a push.
const CONTENT_REVISION = new URL(import.meta.url).searchParams.get('v') || 'dev';
const contentUrl = (path) => `./data/${path}?v=${encodeURIComponent(CONTENT_REVISION)}`;
const STORAGE_KEY = 'tutivar:fa-en:preview:v1';
const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5zm-9 10 9 5 9-5M3 17l9 5 9-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  arrow: '<path d="m15 18-6-6 6-6"/>',
  message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8z"/>',
  family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20v-3a6 6 0 0 1 12 0v3M14 14a4 4 0 0 1 8 0v6"/>',
  objects: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4v17M12 9h4M12 13h4"/>',
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
  numbers: '<path d="M4 6h6M7 3v15M14 6h6l-6 9h6"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 3h10v6a5 5 0 0 1-10 0zM7 5H4v2a4 4 0 0 0 4 4M17 5h3v2a4 4 0 0 1-4 4"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 3-2 3-2 3 0-4-2-7-4-9 0 6-4 8-4 13a7 7 0 0 0 7 7z"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
  sound: '<path d="M11 5 6 9H3v6h3l5 4zM15.5 8a5 5 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m3 17 5-5 4 4 3-3 6 5"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  lock: '<rect x="5" y="11" width="14" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  chart: '<path d="M3 3v18h18M7 15v3M12 10v8M17 6v12"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.5 1a7 7 0 0 0-1.7-1L14.5 3h-4L10 6a7 7 0 0 0-1.7 1l-2.5-1-2 3.5L5.8 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.5-1a7 7 0 0 0 1.7 1l.5 3h4l.5-3a7 7 0 0 0 1.7-1l2.5 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z"/>',
  sparkles: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5zM20 18l.7 2.3L23 21l-2.3.7L20 24l-.7-2.3L17 21l2.3-.7z"/>',
  cards: '<rect x="7" y="3" width="14" height="18" rx="2"/><path d="M4 7H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10"/>',
  bag: '<path d="M4 8h16l-1 13H5zM9 8V6a3 3 0 0 1 6 0v2"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M19 21v-2a6 6 0 0 0-3-5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  repeat: '<path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3"/>',
  star: '<path d="m12 2 3 6 7 .9-5 4.9 1.2 7L12 17.5 5.8 21l1.2-7L2 8.9 9 8z"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2M20 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/>',
  coffee: '<path d="M4 8h13v7a6 6 0 0 1-12 0V8zm13 1h2a3 3 0 0 1 0 6h-2M3 21h17"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  route: '<circle cx="6" cy="18" r="2"/><path d="M8 18h6a5 5 0 0 0 0-10h-4a4 4 0 0 1 0-8"/><circle cx="18" cy="5" r="2"/>',
  plane: '<path d="M22 2 9 15M22 2l-7 20-4-9-9-4z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'
};
const icon = (name, size = '') => `<span class="icon ${size}"><svg aria-hidden="true" viewBox="0 0 24 24">${ICONS[name] || ICONS.star}</svg></span>`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const en = (text) => `<span class="en" lang="en" dir="ltr">${escapeHtml(text)}</span>`;
const defaultProgress = () => ({ completed: [], sectionCompleted: {}, quizAnswers: {}, chatAnswers: {}, written: {}, reviewCount: 0, historyDates: [], showTranslation: false, showDialogueTranslation: true, currentReview: 0, activeLevel: 'A1', activeStage: 'A1.1', matchAnswers: {}, sentenceAnswers: {}, roleplayAnswers: {}, wordProgress: {}, leitnerAdded: [], phraseChoices: {}, sentenceLabs: {}, guidedAnswers: {}, transformChoices: {}, transformStages: {}, dialogueSteps: {}, exchangeChoices: {}, practiceStates: {}, assessments: {}, settings: { reminders: false, sound: true } });
function readProgress() { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return { ...defaultProgress(), ...saved, settings: { ...defaultProgress().settings, ...(saved.settings || {}) } }; } catch { return defaultProgress(); } }
const progress = readProgress();
// Historical completion records predate skill evidence. Preserve them in storage,
// but don't label a revised activity as mastered before its new checks are passed.
function completedSections(lessonId) {
  const recorded = progress.sectionCompleted?.[lessonId] || (progress.completed.includes(lessonId) ? ['foundation', 'production'] : []);
  const lesson = lessonCache.get(lessonId);
  if (!lesson) return recorded;
  return recorded.filter((id) => {
    const section = lesson.sections.find((entry) => entry.id === id);
    return section && masteryMissing(lesson, section).length === 0;
  });
}
function nextSection(lessonId) { return completedSections(lessonId).includes('foundation') ? 'production' : 'foundation'; }
let manifest;
let route = { page: 'home', lessonId: null, part: null };
let lessonCache = new Map();
let activePerson = 0;
let ownerIdx = 0;
let objectIdx = 0;
let modal = null;
let toastTimeout;

const levelChapters = (level) => (manifest.levels[level]?.stages || [{ chapters: manifest.levels[level]?.chapters || [] }]).flatMap((stage) => stage.chapters);
const samples = () => levelChapters('A1').flatMap((chapter) => chapter.lessons).filter((entry) => entry.status === 'sample');
const nextLesson = () => samples().find((entry) => !progress.completed.includes(entry.id)) || samples()[0];
function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* local preview works without persistence */ } }
const allLeitnerCards = () => {
  const cards = [...(progress.leitnerAdded || []), ...manifest.leitner.cards];
  return cards.filter((card, index) => cards.findIndex((other) => other.front.toLowerCase().trim() === card.front.toLowerCase().trim()) === index);
};
function addToLeitner(entry, lessonId) {
  const front = entry.en.trim();
  if (allLeitnerCards().some((card) => card.front.toLowerCase().trim() === front.toLowerCase())) return;
  progress.leitnerAdded = [...(progress.leitnerAdded || []), { front, back: entry.fa, example: entry.examples?.[0] || entry.example || '', lessonId, id: `${lessonId}:${wordId(entry)}` }];
}
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function streak() { const days = new Set(progress.historyDates); let cursor = new Date(); if (!days.has(today())) cursor.setDate(cursor.getDate() - 1); let count = 0; for (let i = 0; i < 365; i++) { const date = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`; if (!days.has(date)) break; count++; cursor.setDate(cursor.getDate() - 1); } return count; }
function navButton(page, label, name) { return `<button class="nav-link ${route.page === page ? 'active' : ''}" data-nav="${page}" aria-label="${label}">${icon(name, 'nav-icon')}<span>${label}</span></button>`; }
function mobileButton(page, label, name) { return `<button class="${route.page === page ? 'active' : ''}" data-nav="${page}" aria-label="${label}">${icon(name, 'nav-icon')}<span>${label}</span></button>`; }
function logo() { return `<span class="brand-icon" aria-hidden="true">t.</span><span><span class="brand-word en">tutivar</span><span class="brand-caption">یاد بگیر، زندگی کن</span></span>`; }
function languageButton() { return `<button class="language-chip" data-action="language" aria-label="زبان یادگیری: ${escapeHtml(manifest.target.name)}"><span class="flag">${manifest.target.flag}</span><span>${escapeHtml(manifest.target.name)}</span></button>`; }
function shell(content) {
  return `<div class="shell">
    <aside class="sidebar"><div class="brand-row"><div class="logo-line">${logo()}</div>${languageButton()}</div><nav class="sidenav" aria-label="منوی اصلی">${navButton('home', 'خانه', 'home')}${navButton('lessons', 'مسیر یادگیری', 'book')}${navButton('leitner', 'لایتنر', 'layers')}${navButton('dashboard', 'داشبورد', 'user')}</nav>
      <div class="side-bottom"><div class="side-notice"><div class="caps">THE LITTLE STEPS</div><h3>هر روز، یک قدم.</h3></div><div class="side-profile"><div class="avatar">تو</div><div><strong class="body-sm">زبان‌آموز توتیوار</strong><div class="small muted">سطح فعلی · ${escapeHtml(progress.activeLevel)}</div></div></div></div>
    </aside>
    <div><div class="mobile-head"><div class="logo-line">${logo()}</div>${languageButton()}</div>
      <div class="page"><main class="main">${content}</main></div></div>
    <nav class="mobile-nav" aria-label="پیمایش پایین صفحه">${mobileButton('home', 'خانه', 'home')}${mobileButton('lessons', 'درس‌ها', 'book')}${mobileButton('leitner', 'لایتنر', 'layers')}${mobileButton('dashboard', 'داشبورد', 'user')}</nav>
  </div>${modal ? renderModal() : ''}<div id="toast-anchor"></div>`;
}

function sectionHeading(title, linkText, page) { return `<div class="section-head"><h2>${escapeHtml(title)}</h2>${page ? `<button class="link-button" data-nav="${page}">${escapeHtml(linkText)} ${icon('chevron')}</button>` : ''}</div>`; }
function statCard(name, count, label, color) { return `<div class="card stat-card"><span class="stat-icon ${color}">${icon(name)}</span><span><span class="stat-number">${count}</span><br><span class="stat-label">${label}</span></span></div>`; }
function homeView() {
  const lesson = nextLesson(); const done = progress.completed.length;
  return `<div class="hero"><div><span class="eyebrow">آماده‌ای شروع کنیم؟</span><h1>هر روز یه چیز تازه،<br>به زبان خودت.</h1><p>انگلیسی را با گفت‌وگو و تمرین واقعی یاد بگیر.</p><button class="primary-btn" data-open-lesson="${lesson.id}" data-start-section="${nextSection(lesson.id)}">ادامه یادگیری ${icon('arrow')}</button></div><div class="hero-art" aria-hidden="true"><div class="art-circle"><div class="art-sheet"><small class="en">LET'S GO</small><div class="en">Hello!</div><small>سلام!</small></div></div><span class="art-speech">✳</span><span class="art-bubble">✦</span></div></div>
    <div class="stats-row">${statCard('flame', streak(), 'روز استمرار', 'soft-peach')}${statCard('book', done, 'درس تکمیل‌شده', 'soft-green')}${statCard('bolt', progress.reviewCount, 'کارت مرورشده', 'soft-lilac')}</div>
    <div class="two-col"><div class="stack"><div class="card mission-card"><div><span class="eyebrow">ماموریت امروز</span><h3 style="font-size:21px;margin-top:6px">${escapeHtml(manifest.home.dailyMission.title)}</h3><p class="muted body-sm">${escapeHtml(manifest.home.dailyMission.description)}</p><div class="micro-step">${icon('check')} ${progress.historyDates.includes(today()) ? 'امروز یک درس به پایان رساندی' : 'هنوز درس امروز را شروع نکردی'}</div><button class="link-button" style="margin-top:12px" data-open-lesson="${lesson.id}">برو سراغ درس ${icon('arrow')}</button></div><div class="round-progress" style="--progress:${progress.historyDates.includes(today()) ? 65 : 0}%"><strong>${progress.historyDates.includes(today()) ? '۱/۲' : '۰/۲'}</strong></div></div>
      <div class="card activity-card"><span class="eyebrow">ادامه مسیر</span><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.subtitle)} · ${escapeHtml(lesson.feature)}</p><button class="secondary-btn" data-open-lesson="${lesson.id}" data-start-section="${nextSection(lesson.id)}">ادامه درس ${icon('chevron')}</button></div></div>
      <div class="stack"><div class="card activity-card" style="background:#ece8fa"><span class="caps" style="color:#806dba">REVIEW TIME</span><h3>مرورهای بین‌درسی</h3><p>کلمه‌ها و جمله‌هایی که ارزش یک بار دیگر دیدن دارند.</p><button class="outline-btn" data-nav="leitner">مرور کارت‌ها ${icon('cards')}</button><div class="feature-spark">✳</div></div><div class="card activity-card" style="background:#e7f3ed"><span class="caps" style="color:#397965">YOUR COACH</span><h3>مربی همراه</h3><p>پرسش و تمرین آزاد با مربی هوشمند.</p><button class="outline-btn" data-action="coach">ورود به چت ${icon('message')}</button><div class="feature-spark">✧</div></div></div></div>
    ${sectionHeading('کمی فراتر از درس', '', null)}
    <div class="palette-row"><div class="card activity-card"><h3>موضوع آزاد امروز</h3><p>${en(manifest.home.dailyDiscussion.topic)}</p><p>${escapeHtml(manifest.home.dailyDiscussion.translation)}</p><button class="link-button" data-action="discussion">گفت‌وگوی آزاد ${icon('chevron')}</button></div><div class="card activity-card"><h3>کارت بازار</h3><p>${escapeHtml(manifest.home.market.description)}</p><button class="link-button" data-action="market">مشاهده کارت ${icon('bag')}</button></div></div>`;
}

function pathPartButton(lesson, part, isSecond = false) {
  const ready = lesson.status === 'sample';
  const done = completedSections(lesson.id).includes(part);
  const name = part === 'foundation' ? (lesson.icon || 'book') : 'message';
  const partLabel = part === 'foundation' ? 'واژه تا جمله' : 'دیالوگ تا تمرین';
  return `<button class="${isSecond ? 'path-subnode' : 'path-node'} ${done ? 'done' : ready ? 'sample' : 'planned'}" ${ready ? `data-open-lesson="${escapeHtml(lesson.id)}" data-start-section="${part}"` : 'disabled'} aria-label="${escapeHtml(lesson.title)}، ${partLabel}" title="${partLabel}">${icon(done ? 'check' : name)}</button>`;
}
function pathLesson(lesson, index) {
  const isWorkshop = lesson.kind === 'workshop';
  const done = progress.completed.includes(lesson.id) && completedSections(lesson.id).length === (lessonCache.get(lesson.id)?.sections.length || 2);
  return `<div class="path-stop ${index % 2 ? 'swing-left' : 'swing-right'} ${isWorkshop ? 'workshop-stop' : ''}">
    <div class="path-orbit">${pathPartButton(lesson, 'foundation')}${isWorkshop ? '' : `<span class="path-link" aria-hidden="true"></span>${pathPartButton(lesson, 'production', true)}`}</div>
    <div class="node-info"><span class="node-code">${escapeHtml(lesson.id)}</span><h3>${escapeHtml(lesson.title)}</h3>${lesson.subtitle ? `<p>${escapeHtml(lesson.subtitle)}</p>` : ''}<div class="node-parts">${isWorkshop ? `<span>${icon('trophy')} کارگاه</span>` : `<span>۱ · واژه تا جمله</span><span>۲ · دیالوگ تا تمرین</span>`}${done ? `<span class="node-complete">✓ تکمیل شده</span>` : ''}</div></div>
  </div>`;
}
function lessonsView() {
  const level = progress.activeLevel; const data = manifest.levels[level];
  const stages = data.stages || [];
  const stage = stages.find((entry) => entry.id === progress.activeStage) || stages[0];
  const levels = `<div class="levels" role="tablist" aria-label="سطح آموزش">${manifest.availableLevels.map((key) => `<button class="level ${key === level ? 'active' : ''}" data-level="${key}" role="tab" aria-selected="${key === level}">${key}</button>`).join('')}</div>`;
  const stageTabs = stage ? `<div class="stage-tabs" role="tablist" aria-label="بخش‌های سطح ${level}">${stages.map((entry) => `<button class="stage-tab ${stage.id === entry.id ? 'active' : ''}" data-stage="${entry.id}" role="tab" aria-selected="${stage.id === entry.id}"><strong class="en">${escapeHtml(entry.id)}</strong><span>${escapeHtml(entry.title)}</span></button>`).join('')}</div>` : '';
  const chapters = stage?.chapters || data.chapters || [];
  return `<div class="path-intro"><div><span class="eyebrow">مسیر یادگیری</span><h2>درس‌ها</h2></div>${levels}</div>${stageTabs}
    ${stage ? `<div class="stage-summary"><div><span class="en">${escapeHtml(stage.id)}</span><strong>${escapeHtml(stage.title)}</strong><p>${escapeHtml(stage.description)}</p></div><span class="stage-count">${chapters.length} فصل</span></div>` : ''}
    ${chapters.length ? chapters.map((chapter, chapterIndex) => `<section class="chapter-section" aria-label="${escapeHtml(chapter.title)}"><div class="chapter-banner"><div><span class="chapter-index">فصل ${chapterIndex + 1}</span><h3>${escapeHtml(chapter.title)}</h3><p>${escapeHtml(chapter.description)}</p></div><span class="chapter-mark">${icon(chapter.icon || 'star')}</span></div><div class="path-card"><div class="trail">${chapter.lessons.map(pathLesson).join('')}</div></div></section>`).join('') : `<div class="card empty-level"><div><div class="empty-illustration">${icon('book')}</div><h2>${escapeHtml(data.title)}</h2><p>${escapeHtml(data.subtitle)}</p></div></div>`}`;
}

function vocabularyBlock(section) { return `<div class="lesson-block"><div class="block-top"><div><span class="block-label">۰۱ / بانک واژه</span><h3>اول واژه‌ها را بشناس</h3></div><span class="preview-tag">شنیدن تلفظ</span></div><div class="vocab-grid">${section.vocabulary.map((word) => `<div class="word-card"><div><div>${en(word.en)}</div><p>${escapeHtml(word.fa)}</p><span class="word-hint">${escapeHtml(word.hint)}</span></div><button class="sound-btn" data-speak="${escapeHtml(word.en)}" aria-label="شنیدن تلفظ ${escapeHtml(word.en)}">${icon('sound')}</button></div>`).join('')}</div></div>`; }
function patternBlock(section) { const pattern = section.pattern; return `<div class="lesson-block"><div class="block-top"><div><span class="block-label">۰۲ / از واژه تا جمله</span><h3>${escapeHtml(pattern.title)}</h3></div>${icon('sparkles')}</div><p class="body-sm muted">${escapeHtml(pattern.explanation)}</p><div class="pattern-main">${en(pattern.formula)}</div><div class="example-row">${pattern.examples.map((line) => `<span class="example-pill">${en(line)}</span>`).join('')}</div></div>`; }
function checkBlock(section, id) { const chosen = progress.quizAnswers[id]; const correct = chosen === section.check.answer; return `<div class="lesson-block"><div class="block-top"><div><span class="block-label">۰۳ / یک بررسی کوتاه</span><h3>نوبت تو!</h3></div>${icon('check')}</div><div class="question">${escapeHtml(section.check.question)}</div><div class="choices">${section.check.choices.map((choice, idx) => `<button class="choice ${chosen === idx ? 'selected ' + (correct ? 'correct' : 'wrong') : ''}" data-quiz="${id}" data-choice="${idx}">${en(choice)}</button>`).join('')}</div>${chosen !== undefined ? `<div class="feedback ${correct ? '' : 'error'}">${correct ? escapeHtml(section.check.feedback) : 'یک بار دیگر امتحان کن. معنی جمله را با دقت نگاه کن.'}</div>` : ''}</div>`; }
function dialogueBlock(section) { return `<div class="lesson-block"><div class="block-top"><div><span class="block-label">۰۴ / دیالوگ</span><h3>مکالمه را دنبال کن</h3></div><button class="outline-btn" data-action="toggle-translations">${progress.showDialogueTranslation ? 'پنهان‌کردن ترجمه' : 'نمایش ترجمه'}</button></div><div class="dialogue">${section.dialogue.map((line) => `<div class="dialogue-line"><span class="speaker-avatar">${escapeHtml(line.speaker.slice(0, 1))}</span><div class="bubble"><div class="tiny muted">${escapeHtml(line.speaker)}</div><div>${en(line.en)}</div>${progress.showDialogueTranslation ? `<p>${escapeHtml(line.fa)}</p>` : ''}</div></div>`).join('')}</div></div>`; }
function widgetBlock(widget, id) {
  if (widget.type === 'conversation') {
    const selected = progress.chatAnswers[id]; const correct = selected === widget.correctIndex;
    return `<div class="lesson-block special-block"><div class="block-top"><div><span class="block-label">ویژگی خاص این درس</span><h3>${escapeHtml(widget.title)}</h3></div>${icon('message')}</div><p class="feature-description">${escapeHtml(widget.description)}</p><div class="bot-message">${en(widget.message)}</div><div class="choices">${widget.choices.map((choice, idx) => `<button class="choice ${selected === idx ? 'selected ' + (correct ? 'correct' : 'wrong') : ''}" data-chat="${id}" data-choice="${idx}">${en(choice)}</button>`).join('')}</div>${selected !== undefined ? `<div class="feedback ${correct ? '' : 'error'}">${correct ? `${en(widget.response)}<p>${escapeHtml(widget.success)}</p>` : 'هنوز نه؛ پاسخ مرتبط با پرسش اسم را انتخاب کن.'}</div>` : ''}</div>`;
  }
  if (widget.type === 'family') {
    const person = widget.people[activePerson] || widget.people[0];
    return `<div class="lesson-block special-block"><div class="block-top"><div><span class="block-label">ویژگی خاص این درس</span><h3>${escapeHtml(widget.title)}</h3></div>${icon('family')}</div><p class="feature-description">${escapeHtml(widget.description)}</p><div class="tree-grid">${widget.people.map((entry, idx) => `<button class="person ${idx === activePerson ? 'active' : ''}" data-person="${idx}"><span class="person-face">${escapeHtml(entry.initial)}</span><span><span class="en">${escapeHtml(entry.name)}</span><small>${escapeHtml(entry.fa)}</small></span></button>`).join('')}</div><div class="feature-output"><div>${en(person.sentence)}<br><small>${escapeHtml(person.fa)} · ${en(person.relation)}</small></div></div></div>`;
  }
  if (widget.type === 'ownership') {
    const owner = widget.owners[ownerIdx] || widget.owners[0]; const object = widget.objects[objectIdx] || widget.objects[0];
    return `<div class="lesson-block special-block"><div class="block-top"><div><span class="block-label">ویژگی خاص این درس</span><h3>${escapeHtml(widget.title)}</h3></div>${icon('repeat')}</div><p class="feature-description">${escapeHtml(widget.description)}</p><div class="form-pickers"><label><div class="picker-label">مالک</div><select class="picker-select" data-picker="owner">${widget.owners.map((entry, i) => `<option value="${i}" ${i === ownerIdx ? 'selected' : ''}>${escapeHtml(entry.label)}</option>`).join('')}</select></label><label><div class="picker-label">وسیله</div><select class="picker-select" data-picker="object">${widget.objects.map((entry, i) => `<option value="${i}" ${i === objectIdx ? 'selected' : ''}>${escapeHtml(entry.label)}</option>`).join('')}</select></label></div><div class="feature-output"><div><div class="object-art" id="widget-object-art">${escapeHtml(object.emoji)}</div><div id="widget-result">${en(`This is ${owner.en} ${object.en}.`)}</div></div></div></div>`;
  }
  return `<div class="banner-note">الگوی تعاملی «${escapeHtml(widget.type)}» هنوز پیاده‌سازی نشده است.</div>`;
}
function productionBlock(section, id) { const draft = progress.written[id] || ''; return `<div class="lesson-block"><div class="block-top"><div><span class="block-label">۰۶ / تولید مستقل</span><h3>حالا جمله خودت را بساز</h3></div>${icon('star')}</div><label class="input-label" for="free-response">${escapeHtml(section.production.prompt)}</label><textarea id="free-response" class="free-input" placeholder="${escapeHtml(section.production.placeholder)}" rows="3">${escapeHtml(draft)}</textarea><p class="hint">${escapeHtml(section.production.hint)}</p><button class="secondary-btn" data-action="save-production">ذخیره پاسخ ${icon('check')}</button><p class="tiny muted" style="margin-top:10px">این پاسخ فقط روی دستگاه شما ذخیره می‌شود؛ تصحیح هوشمند هنوز فعال نیست.</p></div>`; }
async function loadLesson(lessonId) { if (lessonCache.has(lessonId)) return lessonCache.get(lessonId); const entry = samples().find((x) => x.id === lessonId); if (!entry) return null; const response = await fetch(contentUrl(entry.file)); if (!response.ok) throw new Error('lesson load failed'); const lesson = await response.json(); lessonCache.set(lessonId, lesson); return lesson; }
function sectionActivities(section, lessonId) {
  if (section.activities) return section.activities.map((activity, index) => renderActivity(activity, { lessonId, index, e: escapeHtml, en, i: icon, progress })).join('');
  return section.id === 'foundation'
    ? vocabularyBlock(section) + patternBlock(section) + checkBlock(section, lessonId)
    : dialogueBlock(section) + widgetBlock(section.featureWidget, lessonId) + productionBlock(section, lessonId);
}
function masteryMissing(lesson, section) {
  return (section.masteryActivityIds || []).filter((id) => {
    const activity = section.activities?.find((entry) => entry.id === id);
    if (!activity) return true;
    const key = `${lesson.id}:${id}`;
    if (activity.type === 'free-write') return !progress.assessments?.[key]?.passed || progress.assessments[key].revision !== (activity.assessment?.revision || 1);
    return practiceState(progress.practiceStates?.[key], activity).answers.length < (activity.tasks || activity.turns || []).length;
  });
}
function lessonOrientation(lesson) {
  const intro = lesson.orientation || {};
  const goal = intro.goal || lesson.goal;
  const prerequisites = intro.prerequisites?.length ? intro.prerequisites.map((item) => `<li>${escapeHtml(item)}</li>`).join('') : '<li>پیش‌نیاز اجباری ندارد.</li>';
  const previously = intro.previously ? `<p class="orientation-before"><strong>تا اینجا یاد گرفته‌ای:</strong> ${escapeHtml(intro.previously)}</p>` : '';
  const visual = lesson.visual || {};
  const image = visual.src ? `<img src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt || '')}" loading="lazy">` : `<span class="visual-slot-icon">${icon('image')}</span><span>${escapeHtml(visual.caption || 'جای تصویر این درس')}</span>`;
  const check = intro.quickCheck;
  const challenge = check ? `<details class="lesson-quickcheck"><summary>${escapeHtml(check.title || 'این درس را از قبل بلدی؟')}</summary><p>${escapeHtml(check.question)}</p><div class="quickcheck-example">${en(check.example)} <button class="sound-btn" data-speak="${escapeHtml(check.example)}" aria-label="شنیدن مثال">${icon('sound')}</button></div><details class="quickcheck-solution"><summary>دیدن معنی و پاسخ</summary><p>${escapeHtml(check.explanation)}</p></details>${check.allowSkip ? `<button class="outline-btn" data-quick-skip="${escapeHtml(lesson.id)}">این را بلدم؛ رفتن به درس بعد</button>` : ''}</details>` : '';
  return `<section class="lesson-orientation" aria-label="آغاز درس"><div class="orientation-content"><h2>در این درس چه یاد می‌گیری؟</h2><p>${escapeHtml(goal)}</p><div class="orientation-prerequisite"><strong>پیش‌نیاز این درس</strong><ul>${prerequisites}</ul></div>${previously}${challenge}</div><div class="lesson-visual"><div class="lesson-visual-frame ${visual.src ? 'has-image' : ''}">${image}</div>${visual.src && visual.caption ? `<p>${escapeHtml(visual.caption)}</p>` : ''}</div></section>`;
}
function lessonView(lesson) { if (!lesson) return `<div class="empty-level">درس مورد نظر پیدا نشد.</div>`;
  const activePart = lesson.sections.some((section) => section.id === route.part) ? route.part : lesson.sections[0].id;
  const activeIndex = lesson.sections.findIndex((section) => section.id === activePart);
  const activeSection = lesson.sections[activeIndex];
  const isLast = activeIndex === lesson.sections.length - 1;
  const alreadyDone = completedSections(lesson.id).includes(activePart);
  const missing = masteryMissing(lesson, activeSection);
  return `<div class="lesson-page"><button class="back-link" data-nav="lessons">${icon('arrow')} بازگشت به مسیر درس‌ها</button><div class="lesson-hero"><span class="caps">${escapeHtml(lesson.id)} · بخش ${activeIndex + 1} از ${lesson.sections.length}</span><h1>${escapeHtml(lesson.title)}</h1><div class="lesson-meta"><span class="meta-chip">◷ ${escapeHtml(lesson.duration)}</span><span class="meta-chip">✳ ${escapeHtml(lesson.feature)}</span></div></div>
    <div class="lesson-tabs" aria-label="بخش‌های مستقل درس">${lesson.sections.map((section, index) => `<button class="lesson-tab ${section.id === activePart ? 'active' : ''}" data-section="${escapeHtml(section.id)}" aria-current="${section.id === activePart ? 'step' : 'false'}">${completedSections(lesson.id).includes(section.id) ? '✓' : String(index + 1).padStart(2, '0')} · ${escapeHtml(section.label)}</button>`).join('')}</div>
    ${activeIndex === 0 ? lessonOrientation(lesson) : `<div class="lesson-stage-note">${icon('message')} اکنون در بخش دوم هستی. این بخش مستقل از مرور واژه‌هاست و روی مکالمه و تولید تمرکز دارد.</div>`}
    <div class="lesson-flow"><section id="lesson-${escapeHtml(activePart)}" class="lesson-section"><div class="phase-heading"><span class="phase-number">${String(activeIndex + 1).padStart(2, '0')}</span><div><h2>${escapeHtml(activeSection.label)}</h2><p>${escapeHtml(activeSection.intro || '')}</p></div></div>${sectionActivities(activeSection, lesson.id)}</section></div>
    <div class="lesson-end"><div><h3>${missing.length ? 'برای ثبت یادگیری، یک تمرین مانده' : alreadyDone ? 'این بخش قبلاً تمام شده ✓' : 'آمادهٔ پایان این بخش هستی ✓'}</h3><p>${missing.length ? `${missing.length} فعالیتِ هدف هنوز تأیید نشده. مرور کلمات اجباری نیست؛ پاسخ‌های اصلی را بساز.` : 'پاسخ‌های اصلی بررسی شده‌اند؛ حالا می‌توانی وارد مرحلهٔ بعد شوی.'}</p></div><div class="lesson-end-actions"><button class="dark-btn" data-finish-section="${escapeHtml(activePart)}">${isLast ? 'ثبت یادگیری و بازگشت به مسیر' : 'ثبت بخش اول · ورود به بخش دوم'}</button>${missing.length ? `<button class="outline-btn" ${isLast ? 'data-nav="lessons"' : `data-section="${escapeHtml(lesson.sections[activeIndex + 1].id)}"`}>${isLast ? 'بازگشت بدون ثبت' : 'فعلاً ادامه می‌دهم'}</button>` : ''}</div></div></div>`;
}

function leitnerView() { const cards = allLeitnerCards(); const card = cards[progress.currentReview % cards.length]; const completedThisReview = progress.reviewCount % cards.length;
  return `<div class="path-intro"><div><span class="eyebrow">مرور واژه‌ها</span><h1>لایتنر هفت‌کلیدی</h1><p>کلمه را ببین، معنی‌اش را به خاطر بیاور و پاسخ را آشکار کن.</p></div></div><div class="review-layout"><div><div class="flash-card"><div><span class="caps">TAP TO REVEAL</span><div style="margin:23px 0">${en(card.front)}</div>${progress.showTranslation ? `<div class="translation">${escapeHtml(card.back)}</div><p class="example">${en(card.example)}</p>` : '<p class="body-sm" style="color:#a4c8b4">معنی را در ذهن مرور کن</p>'}<button class="primary-btn" style="margin-top:20px" data-action="reveal">${progress.showTranslation ? 'پنهان‌کردن پاسخ' : 'نمایش پاسخ'}</button></div></div><div class="review-buttons" aria-label="کلیدهای هفت‌گانه مرور">${[1, 2, 3, 4, 5, 6, 7].map((key) => `<button class="review-key" data-review="${key}" title="کلید ${key}">${key}</button>`).join('')}</div></div><div class="card review-aside"><span class="eyebrow">جلسه مرور</span><h3 style="margin-top:10px">یک مرور کوتاه</h3><p>${escapeHtml(manifest.leitner.note)}</p><div class="review-tally">${progress.reviewCount} <span class="body-sm muted">مرور ثبت‌شده</span></div><div class="review-sequence">${cards.map((_, index) => `<span class="review-dot ${index < completedThisReview ? 'filled' : ''}"></span>`).join('')}</div><button class="outline-btn" style="margin-top:15px" data-nav="dashboard">تنظیمات لایتنر ${icon('settings')}</button></div></div>`;
}
function dashboardView() { return `<div class="path-intro"><div><span class="eyebrow">فضای شخصی</span><h2>داشبورد</h2></div><div class="avatar" style="width:66px;height:66px;border-radius:24px">تو</div></div><div class="stats-row">${statCard('book', progress.completed.length, 'درس کامل', 'soft-green')}${statCard('flame', streak(), 'روز استمرار', 'soft-peach')}${statCard('cards', progress.reviewCount, 'مرور کارت', 'soft-lilac')}</div><div class="dashboard-grid">
    <div class="card dash-card"><h3>${icon('settings')} تنظیمات یادگیری</h3><div class="settings-row"><span>زبان یادگیری</span><button class="language-chip" data-action="language">🇬🇧 انگلیسی</button></div><div class="settings-row"><span>زبان رابط</span><strong>🇮🇷 فارسی</strong></div><div class="settings-row"><span>سطح فعال</span><button class="outline-btn" data-nav="lessons">${escapeHtml(progress.activeLevel)}</button></div><div class="settings-row"><span>یادآوری روزانه</span><span class="muted">غیرفعال</span></div></div>
    <div class="card dash-card"><h3>${icon('cards')} تنظیمات لایتنر</h3><div class="settings-list"><div class="setting-item"><span>جعبه‌های مرور</span><strong>۷ کلید</strong></div><div class="setting-item"><span>کارت‌های موجود</span><strong>${allLeitnerCards().length}</strong></div></div><button class="secondary-btn" style="margin-top:19px" data-nav="leitner">رفتن به لایتنر ${icon('arrow')}</button></div>
    <div class="card dash-card"><h3>${icon('chart')} آمار پیشرفت</h3><div class="settings-list"><div class="setting-item"><span>درس‌های کامل‌شده</span><strong>${progress.completed.length}</strong></div><div class="setting-item"><span>آخرین روز فعالیت</span><strong>${progress.historyDates.at(-1) || 'ثبت نشده'}</strong></div><div class="setting-item"><span>جمله‌های تمرینی ذخیره‌شده</span><strong>${Object.values(progress.written).filter(Boolean).length}</strong></div></div></div>
    <div class="card dash-card"><h3>${icon('users')} دوستان و رقابت</h3><div class="placeholder-callout" style="margin-top:15px"><div style="font-size:36px;margin-bottom:5px">✳</div>دوستان · لیگ هفتگی · رتبه‌بندی ماهانه</div></div>
    <div class="card dash-card"><h3>${icon('trophy')} نشان‌های من</h3><div class="badge-grid"><div class="achievement ${progress.completed.length ? '' : 'locked'}"><span class="emoji">🌱</span><strong>اولین قدم</strong><span>${progress.completed.length ? 'دریافت‌شده' : 'قفل'}</span></div><div class="achievement locked"><span class="emoji">🔥</span><strong>هفت روز</strong><span>بعداً</span></div><div class="achievement locked"><span class="emoji">⭐</span><strong>استاد جمله</strong><span>بعداً</span></div></div></div>
    <div class="card dash-card"><h3>${icon('user')} حساب کاربری</h3><p class="body-sm muted" style="margin-top:9px">پیشرفت فعلاً روی این دستگاه ذخیره می‌شود.</p><div class="settings-row"><span>ورود و همگام‌سازی</span><span class="muted">غیرفعال</span></div><button class="outline-btn" style="margin-top:16px" data-action="account">گزینه‌های حساب ${icon('chevron')}</button></div>
    </div>`; }

function renderModal() { return `<div class="demo-modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading"><div class="modal-content"><span class="eyebrow">در نقشه محصول</span><h2 id="modal-heading">${escapeHtml(modal.title)}</h2><p>${escapeHtml(modal.body)}</p><button class="dark-btn" data-action="close-modal">متوجه شدم</button></div></div>`; }
function showModal(title, body) { modal = { title, body }; draw(true); }
function showToast(message) { clearTimeout(toastTimeout); document.getElementById('toast-anchor')?.replaceChildren(); const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = message; document.getElementById('toast-anchor')?.append(toast); toastTimeout = setTimeout(() => toast.remove(), 3200); }
function draw(keepScroll = false) { const scroll = window.scrollY; let content = route.page === 'home' ? homeView() : route.page === 'lessons' ? lessonsView() : route.page === 'leitner' ? leitnerView() : route.page === 'dashboard' ? dashboardView() : lessonView(lessonCache.get(route.lessonId)); $root.className = ''; $root.innerHTML = shell(content); if (keepScroll) window.scrollTo({ top: scroll, behavior: 'instant' }); }
function parseHash() { const [page, id, part] = location.hash.replace(/^#\/?/, '').split('/'); if (page === 'lesson' && id) return { page: 'lesson', lessonId: decodeURIComponent(id), part: ['foundation', 'production'].includes(part) ? part : 'foundation' }; return { page: ['home', 'lessons', 'leitner', 'dashboard'].includes(page) ? page : 'home', lessonId: null, part: null }; }
async function syncRoute() { route = parseHash(); if (route.page === 'lesson') { try { const lesson = await loadLesson(route.lessonId); if (!lesson) { route = { page: 'lessons', lessonId: null, part: null }; } } catch { showModal('بارگذاری درس', 'محتوای این درس بارگذاری نشد. اتصال اینترنت را بررسی کن یا صفحه را تازه‌سازی کن.'); route = { page: 'lessons', lessonId: null, part: null }; } } draw(); window.scrollTo(0, 0); }
function navigate(page, id = null, part = null) { const target = page === 'lesson' ? `#/lesson/${id}${part ? '/' + part : ''}` : `#/${page}`; if (location.hash === target) { syncRoute(); return; } location.hash = target; }
function updateInline() { draw(true); }
const lessonVocabulary = (key) => lessonCache.get(route.lessonId)?.sections.flatMap((section) => section.activities || []).find((item) => item.type === 'vocabulary' && `${route.lessonId}:${item.id}` === key);
const lessonActivity = (key) => lessonCache.get(route.lessonId)?.sections.flatMap((section) => section.activities || []).find((item) => `${route.lessonId}:${item.id}` === key);
function saveDeckState(key, state) { progress.wordProgress[key] = state; persist(); updateInline(); }
function submitPracticeAnswer(key, answer) {
  const activity = lessonActivity(key);
  if (!activity) return;
  const { state, result } = submitPractice(progress.practiceStates?.[key], activity, answer);
  progress.practiceStates[key] = state;
  persist(); updateInline();
  if (result.ok) {
    if (state.answers.length === (activity.tasks || activity.turns || []).length) showToast('درست بود؛ این تمرین کامل شد.');
  } else {
    document.querySelector(`[data-practice-form="${key}"] input`)?.focus({ preventScroll: true });
  }
}
function submitWordAnswer(key, input) {
  const activity = lessonVocabulary(key);
  if (!activity || !input.trim()) return showToast('پاسخ را به انگلیسی بنویس.');
  const result = answerDeck(progress.wordProgress[key], activity, input);
  if (result.correct === false) addToLeitner(result.entry, route.lessonId);
  saveDeckState(key, result.state);
  if (result.correct === true && result.state.phase === 'test') document.querySelector('[data-word-answer]')?.focus({ preventScroll: true });
  if (result.correct === true && result.state.phase === 'done') showToast('همهٔ کارت‌های آزمون را درست جواب دادی.');
}
async function speech(text) { if (!('speechSynthesis' in window)) { showToast('پخش صوت در این مرورگر پشتیبانی نمی‌شود.'); return; } window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US'; utterance.rate = .84; window.speechSynthesis.speak(utterance); }
function speakPair(lines) {
  if (!('speechSynthesis' in window)) { showToast('پخش صوت در این مرورگر پشتیبانی نمی‌شود.'); return; }
  window.speechSynthesis.cancel();
  for (const line of lines) {
    const utterance = new SpeechSynthesisUtterance(line.en || line);
    utterance.lang = 'en-US';
    utterance.rate = .84;
    window.speechSynthesis.speak(utterance);
  }
}
function currentDialoguePair(key) {
  const activity = lessonActivity(key);
  if (activity?.type !== 'dialogue' || !activity.lines?.length) return [];
  const maximum = Math.max(0, activity.lines.length - 2);
  const step = Math.max(0, Math.min(maximum, Number(progress.dialogueSteps?.[key]) || 0));
  return activity.lines.slice(step, step + 2);
}
function moveDialogue(key, newStep) {
  const activity = lessonActivity(key);
  if (activity?.type !== 'dialogue' || !activity.lines?.length) return;
  const maximum = Math.max(0, activity.lines.length - 2);
  progress.dialogueSteps[key] = Math.max(0, Math.min(maximum, Number(newStep) || 0));
  persist();
  updateInline();
  speakPair(currentDialoguePair(key));
}
let swipeStart = null;
function wordSwipeStart(event) {
  const card = event.target.closest('[data-word-swipe]');
  if (!card || event.target.closest('button')) return;
  swipeStart = { key: card.dataset.wordSwipe, x: event.touches[0].clientX, y: event.touches[0].clientY };
}
function wordSwipeEnd(event) {
  if (!swipeStart) return;
  const moveX = event.changedTouches[0].clientX - swipeStart.x;
  const moveY = event.changedTouches[0].clientY - swipeStart.y;
  const key = swipeStart.key; swipeStart = null;
  if (Math.abs(moveX) < 55 || Math.abs(moveX) < Math.abs(moveY) * 1.4) return;
  const activity = lessonVocabulary(key);
  if (!activity) return;
  const current = deckState(progress.wordProgress[key], activity);
  saveDeckState(key, moveX < 0 ? advanceDeck(current, activity) : jumpDeck(current, activity, current.index - 1));
}
function wordKeydown(event) {
  const card = event.target.closest('[data-word-swipe]');
  if (!card || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const key = card.dataset.wordSwipe;
  const activity = lessonVocabulary(key);
  if (!activity) return;
  event.preventDefault();
  const current = deckState(progress.wordProgress[key], activity);
  saveDeckState(key, event.key === 'ArrowLeft' ? advanceDeck(current, activity) : jumpDeck(current, activity, current.index - 1));
  document.querySelector('[data-word-swipe]')?.focus({ preventScroll: true });
}
function onClick(event) {
  const el = event.target.closest('button[data-nav],button[data-open-lesson],button[data-action],button[data-level],button[data-stage],button[data-section],button[data-quiz],button[data-chat],button[data-person],button[data-finish-section],button[data-review],button[data-planned],button[data-speak],button[data-match],button[data-build-token],button[data-build-reset],button[data-roleplay],button[data-word-key],button[data-phrase-key],button[data-lab-key],button[data-transform-key],button[data-transform-stage-key],button[data-exchange-key],button[data-dialogue-key],button[data-dialogue-play],button[data-practice-reset],button[data-quick-skip]');
  if (!el) return;
  if (el.dataset.nav) { modal = null; navigate(el.dataset.nav); return; }
  if (el.dataset.openLesson) { modal = null; activePerson = 0; ownerIdx = 0; objectIdx = 0; navigate('lesson', el.dataset.openLesson, el.dataset.startSection || null); return; }
  if (el.dataset.level) { progress.activeLevel = el.dataset.level; persist(); updateInline(); return; }
  if (el.dataset.stage) { progress.activeStage = el.dataset.stage; persist(); updateInline(); document.querySelector('.stage-summary')?.scrollIntoView({behavior:'smooth',block:'start'}); return; }
  if (el.dataset.planned) { showModal('درس قفل است', 'با آماده‌شدن این درس، امکان شروع آن فعال می‌شود.'); return; }
  if (el.dataset.section) { navigate('lesson', route.lessonId, el.dataset.section); return; }
  if (el.dataset.speak) { speech(el.dataset.speak); return; }
  if (el.dataset.quickSkip) {
    const ordered = samples();
    const index = ordered.findIndex((item) => item.id === el.dataset.quickSkip);
    if (index >= 0 && ordered[index + 1]) navigate('lesson', ordered[index + 1].id);
    else showToast('درس بعدی هنوز برای اجرا آماده نیست.');
    return;
  }
  if (el.dataset.wordKey) {
    const key = el.dataset.wordKey;
    const activity = lessonVocabulary(key);
    if (!activity) return;
    if (el.dataset.wordAction === 'restart') { delete progress.wordProgress[key]; persist(); updateInline(); return; }
    const state = deckState(progress.wordProgress[key], activity);
    const action = el.dataset.wordAction;
    if (action === 'known' || action === 'test' || action === 'next') return saveDeckState(key, advanceDeck(state, activity, action));
    if (action === 'prev') return saveDeckState(key, jumpDeck(state, activity, state.index - 1));
    if (action === 'resume' || action === 'skip-failed') return saveDeckState(key, resumeDeck(state, activity, action === 'skip-failed'));
    return;
  }
  if (el.dataset.phraseKey) {
    const key = el.dataset.phraseKey;
    const selection = progress.phraseChoices[key] || [];
    selection[Number(el.dataset.phraseSlot)] = Number(el.dataset.phraseOption);
    progress.phraseChoices[key] = selection; persist(); updateInline(); return;
  }
  if (el.dataset.labKey) {
    const key = el.dataset.labKey;
    const state = progress.sentenceLabs[key] || { structure: 0, variable: 0 };
    state[el.dataset.labKind] = Number(el.dataset.labIndex);
    progress.sentenceLabs[key] = state; persist(); updateInline(); return;
  }
  if (el.dataset.exchangeKey) {
    const key = el.dataset.exchangeKey;
    const activity = lessonActivity(key);
    if (activity?.type !== 'exchange-lab') return;
    const current = progress.exchangeChoices[key] || { pair: 0, variant: 0 };
    const pair = el.dataset.exchangePair !== undefined ? Number(el.dataset.exchangePair) : current.pair;
    const validPair = Math.max(0, Math.min(activity.pairs.length - 1, pair));
    const variant = el.dataset.exchangePair !== undefined ? 0 : Number(el.dataset.exchangeVariant);
    const validVariant = Math.max(0, Math.min(activity.pairs[validPair].variants.length - 1, variant));
    progress.exchangeChoices[key] = { pair: validPair, variant: validVariant };
    persist(); updateInline();
    const entry = activity.pairs[validPair];
    speakPair([entry.question, entry.variants[validVariant].en]);
    return;
  }
  if (el.dataset.dialogueKey) {
    const key = el.dataset.dialogueKey;
    moveDialogue(key, (Number(progress.dialogueSteps[key]) || 0) + Number(el.dataset.dialogueNav));
    return;
  }
  if (el.dataset.dialoguePlay) { speakPair(currentDialoguePair(el.dataset.dialoguePlay)); return; }
  if (el.dataset.transformKey) { progress.transformChoices[el.dataset.transformKey] = Number(el.dataset.transformIndex); persist(); updateInline(); return; }
  if (el.dataset.transformStageKey) { progress.transformStages[el.dataset.transformStageKey] = el.dataset.transformStage; persist(); updateInline(); return; }
  if (el.dataset.practiceReset) { delete progress.practiceStates[el.dataset.practiceReset]; persist(); updateInline(); return; }
  if (el.dataset.match) {
    const key = el.dataset.match;
    const pair = Number(el.dataset.pair);
    const state = progress.matchAnswers[key] || { selected: null, solved: [] };
    if (state.solved.includes(pair)) return;
    if (el.dataset.matchSide === 'source') state.selected = pair;
    else if (state.selected === pair) { state.solved.push(pair); state.selected = null; }
    else { state.selected = null; showToast('این جفت درست نیست؛ دوباره تلاش کن.'); }
    progress.matchAnswers[key] = state; persist(); updateInline(); return;
  }
  if (el.dataset.buildToken) {
    const key = el.dataset.buildToken;
    const current = progress.sentenceAnswers[key] || [];
    const tokenIndex = Number(el.dataset.tokenIndex);
    if (!current.includes(tokenIndex)) current.push(tokenIndex);
    progress.sentenceAnswers[key] = current; persist(); updateInline(); return;
  }
  if (el.dataset.buildReset) { delete progress.sentenceAnswers[el.dataset.buildReset]; persist(); updateInline(); return; }
  if (el.dataset.roleplay) {
    const key = el.dataset.roleplay;
    const activity = lessonCache.get(route.lessonId)?.sections.flatMap((section) => section.activities || []).find((item) => `${route.lessonId}:${item.id}` === key);
    if (!activity) return;
    const answers = progress.roleplayAnswers[key] || [];
    const turn = activity.turns[answers.length];
    if (!turn) return;
    const selected = Number(el.dataset.roleChoice);
    if (selected !== turn.correctIndex) { showToast('این پاسخ با گفت‌وگو جور نیست؛ یک بار دیگر امتحان کن.'); return; }
    answers.push(selected); progress.roleplayAnswers[key] = answers; persist(); updateInline(); return;
  }
  if (el.dataset.quiz) { progress.quizAnswers[el.dataset.quiz] = Number(el.dataset.choice); persist(); updateInline(); return; }
  if (el.dataset.chat) { progress.chatAnswers[el.dataset.chat] = Number(el.dataset.choice); persist(); updateInline(); return; }
  if (el.dataset.person !== undefined) { activePerson = Number(el.dataset.person); updateInline(); return; }
  if (el.dataset.finishSection) {
    const id = route.lessonId;
    const lesson = lessonCache.get(id);
    const part = el.dataset.finishSection;
    const section = lesson?.sections.find((entry) => entry.id === part);
    if (!lesson || part !== route.part || !section) return;
    const missing = masteryMissing(lesson, section);
    if (missing.length) {
      showToast('برای ثبت تسلط، تمرین‌های اصلی این بخش را کامل کن.');
      const pendingPanel = document.querySelector(`[data-practice-key="${id}:${missing[0]}"]`) || document.querySelector('[data-module="free-write"]');
      pendingPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const sections = [...new Set([...completedSections(id), part])];
    progress.sectionCompleted[id] = sections;
    const allDone = lesson.sections.every((section) => sections.includes(section.id));
    if (allDone && !progress.completed.includes(id)) progress.completed.push(id);
    if (!progress.historyDates.includes(today())) progress.historyDates.push(today());
    persist();
    const index = lesson.sections.findIndex((section) => section.id === part);
    if (index < lesson.sections.length - 1) navigate('lesson', id, lesson.sections[index + 1].id);
    else navigate('lessons');
    return;
  }
  if (el.dataset.review) { progress.reviewCount++; progress.currentReview = (progress.currentReview + 1) % allLeitnerCards().length; progress.showTranslation = false; persist(); updateInline(); showToast('پاسخ ثبت شد؛ کارت بعدی'); return; }
  switch (el.dataset.action) {
    case 'language': showModal('زبان‌های توتیوار', 'اولین مسیر فعال «انگلیسی برای فارسی‌زبانان» است. با اضافه‌شدن جفت‌زبان‌های جدید، همین اپ محتوای آن‌ها را از فایل‌های مستقل بارگذاری می‌کند.'); break;
    case 'coach': showModal('مربی توتیوار', 'جای چت مربی در صفحه اصلی تعیین شده است. فعلاً اتصال به مدل هوش مصنوعی و حافظه گفت‌وگو پیاده نشده‌اند.'); break;
    case 'discussion': showModal('موضوع آزاد امروز', 'موضوع امروز: What makes a good friend? صفحه بحث و گفت‌وگوی گروهی پس از طراحی هویت و ذخیره‌سازی کاربران فعال می‌شود.'); break;
    case 'market': showModal('بازار توتیوار', 'این کارت جایگاه بازار، پاداش‌ها و امکانات انگیزشی را مشخص می‌کند. هیچ خرید یا پرداختی در این نسخه انجام نمی‌شود.'); break;
    case 'account': showModal('حساب کاربری', 'این نسخه به حساب کاربری وصل نیست. تکلیف پروفایل، همگام‌سازی، دوستان و حریم خصوصی در فازهای بعد مشخص می‌شود.'); break;
    case 'toggle-reminders': progress.settings.reminders = !progress.settings.reminders; persist(); updateInline(); break;
    case 'toggle-translations': progress.showDialogueTranslation = !progress.showDialogueTranslation; persist(); updateInline(); break;
    case 'reveal': progress.showTranslation = !progress.showTranslation; persist(); updateInline(); break;
    case 'save-production': {
      const value = document.getElementById('free-response')?.value.trim();
      if (!value) return showToast('اول جمله خودت را بنویس.');
      progress.written[route.lessonId] = value;
      const activity = lessonCache.get(route.lessonId)?.sections.flatMap((section) => section.activities || []).find((item) => item.type === 'free-write');
      if (activity?.assessment) {
        const result = evaluateResponse(activity.assessment, value);
        progress.assessments[`${route.lessonId}:${activity.id}`] = { passed: result.ok, feedback: result.feedback, repair: result.repair, revision: activity.assessment.revision || 1 };
        persist(); updateInline();
      } else { persist(); showToast('جمله روی همین دستگاه ذخیره شد.'); }
      break;
    }
    case 'close-modal': modal = null; draw(true); break;
  }
}
function onChange(event) {
  if (event.target.dataset.dialogueSlider) {
    moveDialogue(event.target.dataset.dialogueSlider, Number(event.target.value));
    return;
  }
  if (event.target.dataset.wordSlider) {
    const key = event.target.dataset.wordSlider;
    const activity = lessonVocabulary(key);
    if (activity) saveDeckState(key, jumpDeck(progress.wordProgress[key], activity, Number(event.target.value) - 1));
    return;
  }
  if (!event.target.dataset.picker) return;
  if (event.target.dataset.picker === 'owner') ownerIdx = Number(event.target.value); else objectIdx = Number(event.target.value);
  const widget = lessonCache.get(route.lessonId)?.sections[1]?.featureWidget;
  if (!widget || widget.type !== 'ownership') return;
  const owner = widget.owners[ownerIdx], object = widget.objects[objectIdx];
  const output = document.getElementById('widget-result'); if (output) output.innerHTML = en(`This is ${owner.en} ${object.en}.`);
  const art = document.getElementById('widget-object-art'); if (art) art.textContent = object.emoji;
}
async function hydrateCurricula() {
  for (const level of Object.values(manifest.levels)) {
    if (!level.curriculumFile) continue;
    const response = await fetch(contentUrl(level.curriculumFile));
    if (!response.ok) throw new Error('curriculum load failed');
    const curriculum = await response.json();
    level.stages = curriculum.stages.map((stage) => ({
      ...stage,
      chapters: stage.chapters.map((chapter, chapterIndex) => ({
        ...chapter,
        lessons: chapter.lessons.map((entry, index) => Array.isArray(entry) ? {
          id: `${stage.id}-C${chapterIndex + 1}-L${index + 1}`,
          title: entry[0], icon: entry[1] || 'book', kind: entry[2] || 'lesson', status: 'planned'
        } : { kind: 'lesson', status: 'planned', ...entry })
      }))
    }));
  }
}
async function main() { try { const response = await fetch(contentUrl('manifest.json')); if (!response.ok) throw new Error(`HTTP ${response.status}`); manifest = await response.json(); if (manifest.pairId !== 'fa-en' || manifest.status !== 'draft') throw new Error('wrong course manifest'); await hydrateCurricula(); $root.addEventListener('click', onClick); $root.addEventListener('change', onChange); $root.addEventListener('submit', (event) => { const form = event.target.closest('form[data-word-form],form[data-practice-form]'); if (!form) return; event.preventDefault(); if (form.dataset.wordForm) submitWordAnswer(form.dataset.wordForm, form.querySelector('[data-word-answer]')?.value || ''); else submitPracticeAnswer(form.dataset.practiceForm, form.elements.response?.value || ''); }); $root.addEventListener('touchstart', wordSwipeStart, { passive: true }); $root.addEventListener('touchend', wordSwipeEnd, { passive: true }); $root.addEventListener('keydown', wordKeydown); addEventListener('hashchange', syncRoute); await syncRoute(); if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {}); } catch (error) { console.error(error); $root.innerHTML = `<div class="boot"><span class="boot-logo">t.</span><strong>صفحه بارگذاری نشد</strong><p class="muted">اتصال را بررسی کن و دوباره تلاش کن.</p></div>`; } }
main();
