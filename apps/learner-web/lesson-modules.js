import { coreItems, deckState, supplementaryItems, wordId } from './word-review.js';
import { practiceState } from './practice-engine.js';
import { LESSON_PHASE_LABELS } from './lesson-flow.js';
import { normalizePuzzleState, puzzleTokenBank, puzzleDisplayWord } from './sentence-puzzle.js';
import { composeSegments, composerSegmentValue, composerSlotForm, resolveSentenceComposer } from './sentence-composer.js';
import { resolveMeaningForm, selectedSpatialPosition } from './visual-learning.js';

/*
 * Tutivar's teaching components. Lesson text, exercise items, answers and their
 * sequence are supplied by language-pair JSON files, never embedded here.
 */
const MODULE_LABELS = {
  intro: 'موقعیت', vocabulary: 'واژه‌ها', pattern: 'ساختار', match: 'تطبیق',
  'sentence-builder': 'جمله‌سازی', 'quiz-set': 'آزمون', dialogue: 'گفت‌وگو',
  roleplay: 'مکالمه', 'free-write': 'تولید مستقل',
  'phrase-composer': 'ترکیب واژه‌ها', 'pattern-lab': 'کشف الگو', 'sentence-lab': 'جمله‌ساز پویا',
  'guided-dialogue': 'تمرین مکالمه',
  'response-practice': 'ساختن پاسخ',
  'exchange-lab': 'سؤال و جواب',
  'sentence-transform': 'تبدیل جمله',
  'dialogue-transfer': 'مکالمه در موقعیت تازه',
  'family-tree': 'درخت خانواده', 'family-lab': 'خانوادهٔ تصویری', 'spatial-lab': 'بازی موقعیت توپ',
  'expression-study': 'عبارت‌های کاربردی', shadowing: 'سایه‌خوانی', 'shadowing-review': 'سایه‌خوانی دوباره',
  'picture-description': 'توصیف تصویر', 'meaning-cluster': 'یک مفهوم، چند بیان',
  'count-visual': 'یک یا چند شیء', 'plural-pair-lab': 'مفرد و جمع تصویری',
  'agreement-lab': 'جمله‌ساز وابسته', 'sentence-composer': 'جمله‌ساز تعاملی', 'composer-view': 'کشف و تغییر جمله',
  'tap-attributes-lab': 'تغییر ویژگی در تصویر و جمله'
};
function wrapper(body, activity, idx, e, extra = '') {
  return `<div class="lesson-block module-block ${extra}" data-module="${e(activity.type)}"><div class="block-top"><div><span class="block-label">${String(idx + 1).padStart(2, '0')} / ${e(activity.typeLabel || LESSON_PHASE_LABELS[activity.phase] || MODULE_LABELS[activity.type] || 'فعالیت')}</span><h3>${e(activity.title || '')}</h3></div></div>${body}</div>`;
}
function soundButton(text, e, i) {
  return `<button class="sound-btn" data-speak="${e(text)}" aria-label="شنیدن تلفظ ${e(text)}">${i('sound')}</button>`;
}
function exampleFocus(line, entry, c) {
  const phrase = entry.en.replace(/[?!.,]/g, '').trim();
  if (!phrase) return c.en(line);
  const lowerLine = line.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  let start = lowerLine.indexOf(lowerPhrase);
  while (start >= 0) {
    const before = start === 0 || !/[a-z]/i.test(line[start - 1]);
    const afterIndex = start + phrase.length;
    const after = afterIndex >= line.length || !/[a-z]/i.test(line[afterIndex]);
    if (before && after) break;
    start = lowerLine.indexOf(lowerPhrase, start + 1);
  }
  if (start < 0) return c.en(line);
  return '<span class="en" lang="en" dir="ltr">' + c.e(line.slice(0, start)) +
    '<mark class="example-target">' + c.e(line.slice(start, start + phrase.length)) + '</mark>' +
    c.e(line.slice(start + phrase.length)) + '</span>';
}
function exampleGallery(entry, c) {
  const examples = entry.examples?.length ? entry.examples : entry.example ? [entry.example] : [];
  if (!examples.length) return '';
  return `<div class="example-gallery-heading">${examples.length} مثال · افقی ورق بزن و جمله را لمس کن</div><div class="example-gallery" aria-label="مثال‌های قابل لمس ${c.e(entry.en)}">${examples.map((line, index) => `<div class="example-mini-card"><div class="example-mini-top"><span>مثال ${index + 1}</span>${soundButton(line, c.e, c.i)}</div><button type="button" class="example-reveal" data-example-reveal aria-expanded="false" aria-label="پیداکردن عبارت ${c.e(entry.en)} در مثال">${exampleFocus(line, entry, c)}</button><p class="example-mini-meaning">${c.e(entry.fa)} · عبارت اصلی: ${c.en(entry.en)}</p></div>`).join('')}</div>`;
}
function intro(a, c) {
  return wrapper(`<p class="module-intro-text">${c.e(a.text)}</p><div class="module-intro-focus">${c.en(a.focus)}${soundButton(a.focus, c.e, c.i)}</div>`, a, c.index, c.e, 'module-intro');
}
function vocabulary(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const state = deckState(c.progress.wordProgress?.[key], a);
  const items = coreItems(a);
  const optionalItems = supplementaryItems(a);
  const total = items.length;
  const optional = optionalItems.length ? `<details class="vocab-supplementary"><summary><span><strong>واژگان تکمیلی</strong><small>${optionalItems.length} واژهٔ اختیاری برای گسترش دامنهٔ بیان</small></span><span class="supplementary-toggle">نمایش / بستن</span></summary><ul class="supplementary-list" aria-label="واژگان تکمیلی">${optionalItems.map((item) => `<li class="supplementary-item"><span class="supplementary-en" lang="en" dir="ltr">${c.en(item.en)}</span><span class="supplementary-fa" dir="rtl">${c.e(item.fa)}</span></li>`).join('')}</ul></details>` : '';
  const render = (body) => wrapper(`${body}${optional}`, a, c.index, c.e, 'module-vocabulary');
  if (!total || state.phase === 'done') {
    const difficult = Object.keys(state.failed).length;
    return render(`<div class="vocab-finished">${c.i('check')} آزمون واژگان تمام شد. ${difficult ? `${difficult} واژه برای مرور بیشتر به لایتنر اضافه شد. ` : 'می‌توانی هر زمان خواستی دوباره مرور کنی.'}<button class="outline-btn" data-word-key="${c.e(key)}" data-word-action="restart">مرور واژه‌ها</button></div>`);
  }
  if (state.phase === 'test') {
    const entry = items.find((item) => wordId(item) === state.queue[0]);
    return render(`<div class="vocab-deck-top"><span>آزمون واژگان · ${state.queue.length} کارت باقی‌مانده</span><button class="outline-btn" data-word-key="${c.e(key)}" data-word-action="restart">بازگشت به واژه‌ها</button></div><div class="word-test-card"><span class="word-test-label">معادل انگلیسی را بنویس</span><div class="word-test-question">${c.e(entry.testPrompt || entry.fa)}</div>${entry.testHint ? `<p class="word-hint">${c.e(entry.testHint)}</p>` : ''}<form class="word-test-form" data-word-form="${c.e(key)}"><input data-word-answer="${c.e(key)}" type="text" lang="en" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="معادل انگلیسی ${c.e(entry.fa)}" placeholder="به انگلیسی بنویس…" required><button class="secondary-btn" type="submit">بررسی پاسخ</button></form><p class="word-test-help">پاسخ درست این کارت را از صف حذف می‌کند؛ پاسخ اشتباه آن را برای مرور برمی‌گرداند.</p></div>`);
  }
  const entry = state.phase === 'retry' ? items.find((item) => wordId(item) === state.lastWrong?.id) : items[state.index];
  const index = state.index;
  const batchSize = Math.max(1, a.batchSize || 5);
  const batch = Math.floor(index / batchSize) + 1;
  const batches = Math.ceil(total / batchSize);
  const examples = exampleGallery(entry, c);
  if (state.phase === 'retry') {
    return render(`<div class="word-test-alert">این واژه هنوز نیاز به مرور دارد. پاسخ درست: ${c.en(entry.en)}</div><div class="vocab-focus-card"><div class="word-focus-title">${c.en(entry.en)}${soundButton(entry.en, c.e, c.i)}</div><div class="word-focus-meaning">${c.e(entry.fa)}</div>${examples}</div><div class="vocab-deck-actions"><button class="outline-btn" data-word-key="${c.e(key)}" data-word-action="skip-failed">فعلاً در لایتنر بماند</button><button class="secondary-btn" data-word-key="${c.e(key)}" data-word-action="resume">ادامهٔ آزمون</button></div>`);
  }
  const slider = `<div class="vocab-navigation"><div class="vocab-range-label"><strong>مرور آزاد واژه‌ها</strong><span>${index + 1} / ${total} · دسته ${batch} از ${batches}</span></div><div class="vocab-scrubber"><button type="button" class="word-nav-btn" data-word-key="${c.e(key)}" data-word-action="prev" ${index === 0 ? 'disabled' : ''} aria-label="واژهٔ قبلی">‹</button><input type="range" data-word-slider="${c.e(key)}" min="1" max="${total}" step="1" value="${index + 1}" aria-label="جابه‌جایی بین ${total} واژه"><button type="button" class="word-nav-btn" data-word-key="${c.e(key)}" data-word-action="next" ${index === total - 1 ? 'disabled' : ''} aria-label="واژهٔ بعدی">›</button></div><p>با فلش‌ها، دستگیره یا کشیدن کارت بین واژه‌ها جابه‌جا شو.</p></div>`;
  return render(`<div class="vocab-deck-top"><span>واژه ${index + 1} از ${total}</span><button class="outline-btn vocab-test-start" data-word-key="${c.e(key)}" data-word-action="start-test">آزمون واژگان</button></div><div class="vocab-deck-bar"><span style="width:${total ? ((index + 1) / total) * 100 : 0}%"></span></div><div class="vocab-focus-card" data-word-swipe="${c.e(key)}" tabindex="0" aria-label="کارت واژه؛ برای جابه‌جایی از کلیدهای جهت‌نما استفاده کن"><div class="word-focus-title">${c.en(entry.en)}${soundButton(entry.en, c.e, c.i)}</div><div class="word-focus-meaning">${c.e(entry.fa)}</div>${entry.hint ? `<p class="word-hint">${c.e(entry.hint)}</p>` : ''}${examples}</div>${slider}`);
}
function phraseComposer(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const selected = c.progress.phraseChoices?.[key] || a.slots.map(() => 0);
  const slots = a.slots.map((slot, slotIndex) => `<div class="phrase-slot"><span>${c.e(slot.label)}</span><div class="phrase-options">${slot.options.map((option, optionIndex) => `<button class="phrase-option ${selected[slotIndex] === optionIndex ? 'active' : ''}" data-phrase-key="${c.e(key)}" data-phrase-slot="${slotIndex}" data-phrase-option="${optionIndex}">${c.en(option)}</button>`).join('')}</div></div>`).join('');
  const outcome = a.outcomes.find((entry) => entry.selection.every((choice, index) => choice === (selected[index] || 0)));
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="phrase-composer">${slots}</div>${outcome ? `<div class="phrase-outcome">${c.en(outcome.en)}${soundButton(outcome.en, c.e, c.i)}<span dir="rtl">${c.e(outcome.fa)}</span></div>` : ''}`, a, c.index, c.e, 'module-phrase');
}

function patternLab(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const saved = c.progress.phraseChoices?.[key] || [];
  const selected = a.slots.map((slot, index) => Math.max(0, Math.min(slot.options.length - 1, Number(saved[index]) || 0)));
  const controls = a.slots.map((slot, slotIndex) => `<div class="phrase-slot"><span>${c.e(slot.label)}</span><div class="phrase-options">${slot.options.map((option, optionIndex) => `<button type="button" class="phrase-option ${selected[slotIndex] === optionIndex ? 'active' : ''}" data-phrase-key="${c.e(key)}" data-phrase-slot="${slotIndex}" data-phrase-option="${optionIndex}" aria-pressed="${selected[slotIndex] === optionIndex}">${c.en(option)}</button>`).join('')}</div></div>`).join('');
  const outcome = a.outcomes.find((entry) => entry.selection.every((choice, index) => choice === selected[index]));
  let sentence = '';
  if (outcome) {
    const text = String(outcome.en || '');
    const focus = String(outcome.focus || '');
    const at = focus ? text.toLowerCase().indexOf(focus.toLowerCase()) : -1;
    sentence = at < 0
      ? c.en(text)
      : `<span class="en" lang="${c.e(a.targetLanguage || 'en')}" dir="ltr">${c.e(text.slice(0, at))}<mark class="pattern-focus">${c.e(text.slice(at, at + focus.length))}</mark>${c.e(text.slice(at + focus.length))}</span>`;
  }
  const result = outcome ? `<div class="phrase-outcome pattern-lab-result">${sentence}${soundButton(outcome.en, c.e, c.i)}<span dir="rtl">${c.e(outcome.fa || '')}</span></div>${outcome.observation ? `<details class="pattern-observation"><summary>چه چیزی تغییر کرد؟</summary><p>${c.e(outcome.observation)}</p></details>` : ''}` : '';
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="phrase-composer pattern-lab-controls">${controls}</div>${result}`, a, c.index, c.e, 'module-pattern-lab');
}


/** A shared scene for interactive point-and-name grammar.
 * Both near and far objects are drawn from the currently selected word;
 * the pointer is tied to the very same distance slot as This/That.
 */
function perspectiveGlyph(word, person=false) {
  const shapes={
    cat:'<path d="M18 26L16 5L35 16Q53 13 68 16L85 5L81 29Q94 44 81 68Q67 87 49 87Q29 87 17 68Q6 44 18 26Z" fill="#d4ac84" stroke="#775945" stroke-width="4"/><ellipse cx="36" cy="49" rx="5" ry="7" fill="#3d594b"/><ellipse cx="65" cy="49" rx="5" ry="7" fill="#3d594b"/><path d="M45 66L50 71L55 66Z" fill="#ab7473"/><path d="M23 64L3 59M23 70L3 75M78 64L98 59M78 70L98 75" stroke="#775945" stroke-width="3"/>',
    dog:'<ellipse cx="49" cy="58" rx="36" ry="30" fill="#bb8f6b" stroke="#805d45" stroke-width="4"/><path d="M20 35Q-1 25 8 62L25 63M80 35Q104 26 93 62L76 63" fill="#8b624a" stroke="#805d45" stroke-width="4"/><circle cx="35" cy="56" r="5" fill="#342e2b"/><circle cx="65" cy="56" r="5" fill="#342e2b"/><ellipse cx="50" cy="72" rx="10" ry="7" fill="#4c3930"/>',
    book:'<path d="M6 18L48 13L48 83L6 88Z" fill="#a6c5be" stroke="#42786c" stroke-width="4"/><path d="M49 13L94 18V88L49 83Z" fill="#d7e5e0" stroke="#42786c" stroke-width="4"/><path d="M49 13V85M16 34L37 32M16 46L37 43M60 32L84 34M60 45L84 47" stroke="#7c9e95" stroke-width="3"/>',
    bag:'<rect x="12" y="32" width="76" height="56" rx="12" fill="#8aa8bf" stroke="#476f88" stroke-width="5"/><path d="M30 35V24A20 20 0 0 1 70 24V35" fill="none" stroke="#476f88" stroke-width="7"/><path d="M15 60H85" stroke="#d2e3ed" stroke-width="4"/>',
    phone:'<rect x="27" y="4" width="48" height="92" rx="11" fill="#3e5364" stroke="#243d4d" stroke-width="5"/><rect x="34" y="17" width="34" height="63" rx="3" fill="#b5d8d2"/><circle cx="51" cy="88" r="4" fill="#e4efed"/>',
    computer:'<rect x="4" y="12" width="92" height="58" rx="6" fill="#617f8e" stroke="#3e5967" stroke-width="5"/><rect x="13" y="21" width="74" height="39" rx="2" fill="#b9dad7"/><path d="M50 71V88M25 90H76" stroke="#516a76" stroke-width="8" stroke-linecap="round"/>',
    flower:'<path d="M49 49V97M49 75Q24 55 17 80Q33 93 49 75M50 79Q71 51 90 72Q76 88 50 79" fill="#7eaa80" stroke="#497b58" stroke-width="4"/><circle cx="50" cy="33" r="13" fill="#edbe58"/><circle cx="50" cy="13" r="16" fill="#de92ac"/><circle cx="70" cy="30" r="16" fill="#de92ac"/><circle cx="61" cy="52" r="16" fill="#de92ac"/><circle cx="38" cy="52" r="16" fill="#de92ac"/><circle cx="31" cy="30" r="16" fill="#de92ac"/>',
    car:'<path d="M14 60L25 32Q50 20 77 32L89 61V81H10V61Z" fill="#9aadc1" stroke="#5a7893" stroke-width="5"/><path d="M30 36H70L79 56H20Z" fill="#dceef0" stroke="#5a7893" stroke-width="3"/><circle cx="26" cy="80" r="11" fill="#354653"/><circle cx="75" cy="80" r="11" fill="#354653"/>',
    picture:'<rect x="10" y="11" width="80" height="79" rx="6" fill="#dfb589" stroke="#9c764b" stroke-width="6"/><rect x="21" y="22" width="58" height="57" fill="#b3d6d5"/><circle cx="62" cy="39" r="9" fill="#f4d18a"/><path d="M21 74L44 49L55 62L70 43L80 58V79H21Z" fill="#789d85"/>',
    bird:'<path d="M12 62Q23 32 49 40Q78 35 83 64Q68 88 44 81Q20 86 12 62Z" fill="#8dafbf" stroke="#537a90" stroke-width="4"/><path d="M43 58Q35 29 75 19Q89 46 63 62Z" fill="#b6d0d8"/><circle cx="25" cy="56" r="4" fill="#304752"/><path d="M12 62L0 69L12 74M72 79L88 91" fill="#e4b168" stroke="#8f6b45" stroke-width="3"/>',
    rabbit:'<path d="M27 39L19 3Q28 -2 39 5L46 36M60 37L67 3Q83 0 82 11L74 48" fill="#d5b4a5" stroke="#906f66" stroke-width="5"/><ellipse cx="50" cy="66" rx="35" ry="29" fill="#e6d3c4" stroke="#9c7c70" stroke-width="5"/><circle cx="38" cy="63" r="5" fill="#4d514c"/><circle cx="62" cy="63" r="5" fill="#4d514c"/><path d="M46 77L50 81L54 77" fill="#c99496" stroke="#9c7c70" stroke-width="2"/>',

    pillow:'<rect x="9" y="22" width="81" height="56" rx="20" fill="#dfc9b7" stroke="#ad9181" stroke-width="5"/><path d="M20 39Q49 20 79 39M20 64Q49 83 79 64" fill="none" stroke="#eaddcf" stroke-width="4"/>',
    blanket:'<path d="M16 14H84V89H16Z" fill="#b6c5df" stroke="#738eae" stroke-width="5"/><path d="M21 35H80M21 53H80M21 71H80" stroke="#e2eafa" stroke-width="5"/>',
    basket:'<path d="M10 35H90L80 88H22Z" fill="#c7a780" stroke="#93714f" stroke-width="5"/><path d="M23 45L34 83M43 44V83M60 44V83M76 45L67 83" stroke="#e4c6a0" stroke-width="5"/><path d="M25 37Q28 7 50 9Q73 8 75 37" fill="none" stroke="#93714f" stroke-width="6"/>',
    plant:'<path d="M29 66H73L64 95H39Z" fill="#b38a77" stroke="#805f52" stroke-width="5"/><path d="M50 67V15M50 41Q24 26 19 42Q35 59 50 47M50 51Q80 24 85 42Q69 60 50 55" fill="#83af81" stroke="#517f59" stroke-width="5"/>',
    keys:'<circle cx="27" cy="27" r="20" fill="none" stroke="#bf9a64" stroke-width="8"/><path d="M41 41L85 85M71 71L81 61M81 81L91 71" stroke="#bf9a64" stroke-width="9" stroke-linecap="round"/>',
    notebook:'<rect x="16" y="10" width="74" height="81" rx="5" fill="#a3bacf" stroke="#607e9a" stroke-width="5"/><path d="M24 18V83M38 33H80M38 47H80M38 61H80" stroke="#fff" stroke-width="4"/>',
    laptop:'<rect x="11" y="9" width="78" height="61" rx="5" fill="#536e83" stroke="#2e4d61" stroke-width="4"/><rect x="18" y="17" width="64" height="45" fill="#a8d5d6"/><path d="M3 77H97L88 90H12Z" fill="#91a9ad" stroke="#526d7b" stroke-width="4"/>',
    bottle:'<path d="M38 8H62V24L72 39V89Q51 103 28 89V39L38 24Z" fill="#a4c5cb" stroke="#56828f" stroke-width="4"/><path d="M39 14H61M29 63H71" stroke="#d6eff1" stroke-width="5"/>',
    toy:'<circle cx="51" cy="26" r="22" fill="#d8b18e" stroke="#9b7863" stroke-width="4"/><ellipse cx="31" cy="16" rx="10" ry="14" fill="#d4a17b"/><ellipse cx="70" cy="16" rx="10" ry="14" fill="#d4a17b"/><ellipse cx="51" cy="71" rx="30" ry="25" fill="#d8b18e" stroke="#9b7863" stroke-width="4"/><circle cx="44" cy="28" r="3" fill="#53423b"/><circle cx="58" cy="28" r="3" fill="#53423b"/>',
    glasses:'<circle cx="28" cy="53" r="22" fill="none" stroke="#596d74" stroke-width="6"/><circle cx="74" cy="53" r="22" fill="none" stroke="#596d74" stroke-width="6"/><path d="M50 47Q54 40 56 47M6 43L0 39M96 43L100 39" stroke="#596d74" stroke-width="6" fill="none"/>',
    headphones:'<path d="M17 59V40Q17 10 50 10Q83 10 83 40V59" fill="none" stroke="#527b91" stroke-width="12"/><rect x="11" y="49" width="20" height="35" rx="8" fill="#86aabd"/><rect x="70" y="49" width="20" height="35" rx="8" fill="#86aabd"/>',
    apple:'<path d="M49 27Q19 10 13 37Q8 71 31 88Q43 91 49 83Q59 93 70 87Q93 71 88 37Q81 11 50 27Z" fill="#d87962" stroke="#994c43" stroke-width="4"/><path d="M49 27Q47 13 57 7M55 13Q76 3 83 16Q70 24 55 13Z" fill="#62916d" stroke="#497e58" stroke-width="4"/>',
    ball:'<circle cx="50" cy="50" r="40" fill="#d9a06c" stroke="#a76f48" stroke-width="5"/><path d="M18 24Q69 41 81 78M20 77Q45 31 79 23" fill="none" stroke="#f5d7a9" stroke-width="4"/>',
    lamp:'<path d="M50 60V85M27 88H74M27 48L39 11H62L75 48Z" fill="#d1b681" stroke="#8e7853" stroke-width="5"/><circle cx="51" cy="54" r="9" fill="#e8d19c"/>',
    table:'<path d="M8 47H92V59H8ZM22 59V96M78 59V96" fill="#ba9369" stroke="#826141" stroke-width="6"/>',
    chair:'<path d="M24 14V70H83V79H16V20M25 72V96M75 78V96" fill="none" stroke="#9b7859" stroke-width="10" stroke-linecap="round"/>',
    bedroom:'<path d="M10 57H91V78H10Z" fill="#b8cad0" stroke="#5b7d8a" stroke-width="5"/><rect x="15" y="39" width="72" height="23" rx="9" fill="#e6ccbf"/><path d="M18 76V93M83 76V93M12 38V76" stroke="#5b7d8a" stroke-width="6"/>',
    kitchen:'<rect x="13" y="30" width="75" height="58" rx="6" fill="#d2e0de" stroke="#668d87" stroke-width="5"/><path d="M13 45H88M51 45V88M25 60H43M61 60H79" stroke="#729994" stroke-width="4"/><path d="M26 30V15H75V30" fill="#98bec0" stroke="#668d87" stroke-width="4"/>',
    bathroom:'<path d="M13 49H88V65Q83 91 62 91H36Q17 91 13 65Z" fill="#c6e3e7" stroke="#6995a2" stroke-width="5"/><path d="M18 48V20Q18 13 28 13H46V25M16 92H27M78 92H88" fill="none" stroke="#6995a2" stroke-width="5"/>',
    garage:'<path d="M9 40L50 9L91 40V91H9Z" fill="#c2ccd6" stroke="#6b8295" stroke-width="5"/><path d="M25 50H76V91H25Z" fill="#89a0ae" stroke="#547083" stroke-width="4"/><path d="M25 63H76M25 76H76" stroke="#d6e5ea" stroke-width="3"/>'
  };
  if(person){
    const dress=word==='doctor'||word==='nurse'?'#f0ece3':word==='teacher'||word==='student'?'#86a6b6':'#a2b595';
    const accessory=word==='doctor'||word==='nurse'?'<path d="M50 61V85M38 73H62" stroke="#d66e63" stroke-width="7"/>':
      word==='teacher'?'<path d="M13 76H35V93H13Z" fill="#e8cb87" stroke="#8c6c43" stroke-width="3"/>':
      word==='chef'?'<path d="M18 13Q10 -6 31 2Q49 -13 64 2Q91 -4 83 13Z" fill="#f5f4e8" stroke="#9ca7a0" stroke-width="3"/>':
      word==='pilot'?'<path d="M26 16Q49 -2 75 16L72 23H28Z" fill="#4c6173" stroke="#35495b" stroke-width="3"/><circle cx="49" cy="12" r="4" fill="#e4c079"/>':
      word==='artist'||word==='painter'?'<ellipse cx="77" cy="81" rx="17" ry="13" fill="#d4b594"/><circle cx="73" cy="77" r="4" fill="#d56b66"/><circle cx="85" cy="79" r="4" fill="#709cb4"/><circle cx="78" cy="89" r="4" fill="#e3bd54"/>':
      word==='driver'?'<circle cx="78" cy="76" r="16" stroke="#576974" fill="none" stroke-width="6"/>':'';
    return '<svg viewBox="0 0 100 100" width="100" height="100" aria-hidden="true"><circle cx="50" cy="25" r="18" fill="#d8ac8d" stroke="#916c57" stroke-width="3"/><path d="M32 25Q28 -1 52 5Q70 5 69 25Q53 13 32 25Z" fill="#59493c"/><path d="M23 91L28 48Q51 38 72 48L77 91Z" fill="'+dress+'" stroke="#658375" stroke-width="4"/><path d="M31 89V99M69 89V99" stroke="#596c69" stroke-width="8"/>'+accessory+'</svg>';
  }
  return '<svg viewBox="0 0 100 100" width="100" height="100" aria-hidden="true">'+(shapes[word]||shapes.book)+'</svg>';
}
function roomMapScene(source, view, resolved, key, e) {
  const scene=view.scene||source.scene;
  const selected=resolved.state.slots?.[scene.entitySlot||'room']||'kitchen';
  const rooms=[
    {id:'kitchen',label:'KITCHEN',detail:'stove'},
    {id:'bedroom',label:'BEDROOM',detail:'bed'},
    {id:'bathroom',label:'BATHROOM',detail:'bath'},
    {id:'living-room',label:'LIVING ROOM',detail:'sofa'},
    {id:'dining-room',label:'DINING ROOM',detail:'dining'},
    {id:'hallway',label:'HALLWAY',detail:'hall'},
    {id:'garage',label:'GARAGE',detail:'car'},
    {id:'balcony',label:'BALCONY',detail:'balcony'},
    {id:'garden',label:'GARDEN',detail:'garden'}
  ];
  const icons={
    stove:'<rect x="16" y="23" width="62" height="46" rx="6" fill="#b7cbd0" stroke="#688995" stroke-width="4"/><circle cx="34" cy="38" r="9" fill="#7d9ca5"/><circle cx="59" cy="38" r="9" fill="#7d9ca5"/><path d="M20 56H75" stroke="#7d9ca5" stroke-width="3"/>',
    bed:'<rect x="8" y="31" width="80" height="47" rx="7" fill="#e2b9ad" stroke="#ae8176" stroke-width="4"/><rect x="14" y="31" width="28" height="18" rx="7" fill="#f4e9df"/><path d="M9 76V87M87 76V87" stroke="#947363" stroke-width="5"/>',
    bath:'<path d="M8 42H87V60Q80 81 53 81H41Q15 81 8 60Z" fill="#c0e1e4" stroke="#6997a1" stroke-width="4"/><path d="M14 43V23H41" fill="none" stroke="#6997a1" stroke-width="5"/>',
    sofa:'<rect x="10" y="41" width="76" height="31" rx="9" fill="#96b5a0" stroke="#668d73" stroke-width="4"/><path d="M16 49V24Q49 12 81 24V49M15 73V82M80 73V82" stroke="#668d73" fill="none" stroke-width="5"/>',
    dining:'<ellipse cx="48" cy="44" rx="32" ry="19" fill="#caa17b" stroke="#8f704f" stroke-width="4"/><path d="M48 62V85M10 41H17M79 41H90" stroke="#8f704f" stroke-width="6"/>',
    hall:'<path d="M22 82V15H78V82M36 80V30H65V80" stroke="#a18f76" stroke-width="7" fill="none"/><circle cx="58" cy="58" r="4" fill="#c29a65"/>',
    car:'<path d="M13 58L25 35H73L86 58V73H12Z" fill="#a0b6cc" stroke="#62809d" stroke-width="4"/><circle cx="27" cy="75" r="9" fill="#3e5966"/><circle cx="73" cy="75" r="9" fill="#3e5966"/>',
    balcony:'<path d="M12 36H86V82H12Z" stroke="#8b9aa4" stroke-width="5" fill="none"/><path d="M25 37V82M44 37V82M64 37V82M80 37V82" stroke="#8b9aa4" stroke-width="4"/><path d="M48 36V16" stroke="#579267" stroke-width="5"/><circle cx="49" cy="16" r="12" fill="#8db58a"/>',
    garden:'<path d="M48 80V31M48 63Q28 43 18 57M48 58Q68 38 79 52" fill="none" stroke="#608f67" stroke-width="6"/><circle cx="48" cy="27" r="14" fill="#e5acb6"/><circle cx="48" cy="27" r="5" fill="#e4c66f"/><path d="M8 84H89" stroke="#80ab7e" stroke-width="6"/>'
  };
  const tiles=rooms.map((room,i)=>{
    const x=15+(i%3)*215,y=17+Math.floor(i/3)*148;
    const active=room.id===selected;
    return '<g transform="translate('+x+' '+y+')">'+
      '<rect width="207" height="137" rx="13" fill="'+(active?'#d0eee0':'#f2f6f2')+'" stroke="'+(active?'#247855':'#9eb8aa')+'" stroke-width="'+(active?'5':'2')+'"/>'+
      '<g transform="translate(55 8) scale(.86)">'+icons[room.detail]+'</g>'+
      '<text x="104" y="122" font-family="Arial,sans-serif" font-size="16" text-anchor="middle" font-weight="'+(active?'bold':'normal')+'" fill="'+(active?'#246746':'#4d6957')+'">'+room.label+'</text>'+
      (active?'<circle cx="189" cy="17" r="9" fill="#247855"/>':'')+'</g>';
  }).join('');
  return '<figure class="perspective-visual room-map-visual" data-room-selected="'+e(selected)+'">'+
     '<svg class="perspective-picture room-map-picture" viewBox="0 0 680 472" role="img" aria-label="نقشهٔ خانه، اتاق انتخاب‌شده: '+e(selected)+'"><rect width="680" height="472" rx="20" fill="#e9f2ea"/>'+tiles+'</svg>'+
     '<figcaption>روی نام اتاق در جمله بزن؛ همان اتاق روی نقشه روشن می‌شود.</figcaption></figure>';
}

/** A1 house facts: the shared selected word slots determine the picture,
 * numeric tokens, highlighted floor or apartment area, not a separate button. */
function houseFactsScene(source,view,resolved,key,e){
 const scene=view.scene||source.scene,focus=scene.focus||'count';
 const s=resolved.state.slots||{};
 const quantity={one:1,two:2,three:3,four:4}[s.amount]||2;
 const thing=s.feature||'bedroom';
 const level=s.level||'second';
 const area=s.area||'eighty';
 const title=focus==='count'?'COUNT: '+quantity+' '+(quantity===1?thing:thing+'s'):focus==='floor'?'FLOOR: '+level.toUpperCase():'AREA: '+area.toUpperCase()+' m²';
 const symbols={bedroom:'<rect x="6" y="18" width="65" height="45" rx="8" fill="#d5b3ab" stroke="#aa8074" stroke-width="4"/><rect x="10" y="20" width="26" height="22" rx="5" fill="#fff0e4"/>',
 bathroom:'<path d="M5 22H72V41Q69 61 48 62H26Q8 60 5 41Z" fill="#c2dde4" stroke="#7595a4" stroke-width="4"/>',
 window:'<rect x="9" y="5" width="63" height="60" fill="#b8d9e0" stroke="#6b929b" stroke-width="5"/><path d="M40 7V65M10 35H72" stroke="#fff" stroke-width="4"/>',
 door:'<rect x="12" y="3" width="55" height="65" fill="#cbac8c" stroke="#8b6749" stroke-width="5"/><circle cx="56" cy="36" r="4" fill="#faf0da"/>'};
 const icons=Array.from({length:quantity},(_,i)=>{
  const x=60+(i%4)*132;
  return '<g transform="translate('+x+' 121) scale(.95)">'+symbols[thing]+'</g>';
 }).join('');
 const countSvg='<g>'+icons+'</g>';
 const levels=['ground','first','second'].map((v,i)=>{
  const y=242-i*58,hi=v===level;
  return '<rect x="178" y="'+y+'" width="305" height="51" rx="6" fill="'+(hi?'#acd8c0':'#e4ece4')+'" stroke="'+(hi?'#287356':'#90a79a')+'" stroke-width="'+(hi?'4':'2')+'"/>'+
   '<text x="330" y="'+(y+32)+'" text-anchor="middle" font-size="22" fill="#355c4b">'+v.toUpperCase()+'</text>';
 }).join('');
 const areas={forty:40,sixty:60,eighty:80,hundred:100},number=areas[area]||80;
 const overview='<path d="M122 78H496V277H122Z" fill="#f8faf6" stroke="#557b67" stroke-width="7"/>'+
  '<path d="M316 78V277M122 187H496" stroke="#94af9f" stroke-width="5"/>'+
  '<path d="M171 78H254M365 78H455" stroke="#77adbd" stroke-width="9"/>'+
  '<path d="M122 227V260" stroke="#bf9b72" stroke-width="12"/>'+
  '<text x="309" y="187" text-anchor="middle" font-size="54" font-weight="bold" fill="#236d50">'+number+' m²</text>';
 const content=focus==='count'?countSvg:focus==='floor'?levels:overview;
 return '<figure class="perspective-visual house-facts-visual" data-house-fact="'+e(focus)+'" data-house-quantity="'+quantity+'" data-house-feature="'+e(thing)+'" data-house-floor="'+e(level)+'" data-house-area="'+number+'">'+
 '<svg viewBox="0 0 620 330" role="img" aria-label="'+e(title)+'"><rect width="620" height="330" rx="22" fill="#eff6f0"/>'+
 '<text x="310" y="48" text-anchor="middle" font-size="25" font-weight="bold" fill="#365e4b">'+e(title)+'</text>'+content+'</svg>'+
 '<figcaption>عدد، بخش خانه، طبقه و مساحت مستقیماً از کلمه‌های همین جمله می‌آیند.</figcaption></figure>';
}
/** A shared rearrangeable room scene: moving a word on/under/next to changes
 * the visual location of the object without teaching any new control gesture. */
function roomObjectScene(source,view,resolved,key,e){
 const scene=view.scene||source.scene,s=resolved.state.slots||{};
 const item=s[scene.entitySlot||'object']||'book',surface=s[scene.surfaceSlot||'surface']||'desk';
 const pos=s[scene.positionSlot||'position']||'on';
 const surfaceSvg={
  desk:'<rect x="125" y="166" width="400" height="21" rx="6" fill="#c6a27b" stroke="#81674d" stroke-width="5"/><path d="M152 184V293M491 184V293" stroke="#81674d" stroke-width="15"/>',
  table:'<rect x="130" y="158" width="392" height="24" rx="6" fill="#bfa078" stroke="#81674d" stroke-width="5"/><path d="M161 179V296M488 179V296" stroke="#81674d" stroke-width="16"/>',
  bed:'<rect x="116" y="168" width="417" height="65" rx="13" fill="#c4d8db" stroke="#73969a" stroke-width="7"/><rect x="136" y="161" width="88" height="39" rx="12" fill="#f3e4d7"/><path d="M128 230V295M524 230V295" stroke="#73969a" stroke-width="14"/>',
  shelf:'<path d="M112 170H528V187H112Z" fill="#c5a078" stroke="#826245" stroke-width="5"/><path d="M132 185V288M507 185V288" stroke="#826245" stroke-width="13"/>'
 }[surface]||'';
 const at={on:{x:258,y:72},under:{x:272,y:203},'next-to':{x:539,y:192}}[pos]||{x:258,y:72};
 const chosen=perspectiveGlyph(item);
 const svg='<svg viewBox="0 0 700 330" role="img" aria-label="'+e(item+' '+pos+' '+surface)+'">'+
  '<rect width="700" height="330" rx="20" fill="#f4f8f2"/><path d="M0 253H700V330H0Z" fill="#e1e9dc"/>'+
  '<rect x="32" y="28" width="120" height="110" rx="4" fill="#b4d6db" stroke="#729ca3" stroke-width="8"/>'+
  '<path d="M92 30V137M34 83H150" stroke="#e9f7f6" stroke-width="6"/>'+
  surfaceSvg+
  '<g transform="translate('+at.x+' '+at.y+') scale(.74)">'+chosen+'</g>'+
  '<text x="350" y="317" font-size="22" text-anchor="middle" fill="#345c48">'+e(item+' · '+pos+' · '+surface)+'</text></svg>';
 return '<figure class="perspective-visual room-objects-visual" data-room-object="'+e(item)+'" data-room-position="'+e(pos)+'" data-room-surface="'+e(surface)+'">'+
  svg+'<figcaption>روی شیء، موقعیت یا وسیلهٔ زیر آن در جمله بزن؛ تصویر همان تغییر را نشان می‌دهد.</figcaption></figure>';
}

function perspectiveScene(source, view, resolved, key, e) {
  const scene = view.scene || source.scene;
  if(scene?.type==='rooms')return roomMapScene(source,view,resolved,key,e);
  if(scene?.type==='house-facts')return houseFactsScene(source,view,resolved,key,e);
  if(scene?.type==='room-objects')return roomObjectScene(source,view,resolved,key,e);
  if(!scene || scene.type!=='perspective')return '';
  const distanceSlot=scene.distanceSlot||'distance';
  const entitySlot=scene.entitySlot||'object';
  const wordId=resolved.state.slots?.[entitySlot];
  const distance=resolved.state.slots?.[distanceSlot]||'this';
  const near=distance==='this';
  const label=String(wordId||'book').replace(/[^a-z-]/gi,'');
  const symbol=perspectiveGlyph(label,scene.entityKind==='person');
  const staticNear=perspectiveGlyph('book');
  const staticFar=perspectiveGlyph('lamp');
  const uid='perspective-'+key.replace(/[^a-z0-9]+/gi,'-');
  const arrow=near?'M190 43Q192 68 206 102':'M500 43Q515 75 538 117';
  const svg='<svg class="perspective-picture" viewBox="0 0 760 320" role="img" aria-label="'+e(near?'اشاره به '+label+' نزدیک':'اشاره به '+label+' دور')+'">'+
    '<defs><marker id="'+uid+'-head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#28765b"/></marker></defs>'+
    '<rect x="2" y="2" width="756" height="315" rx="22" fill="#eff6f2"/><path d="M3 195L758 145V318H3Z" fill="#dce8d9"/>'+
    '<path d="M395 5L395 317" stroke="#b6cbbd" stroke-width="3" stroke-dasharray="8 8"/>'+
    '<path d="M410 175L748 95V135L410 213Z" fill="#d0dfd7"/>'+
    '<path d="M35 276L352 276L378 304L16 304Z" fill="#b4c8b4"/>'+
    '<g transform="translate(38 208) scale(.7)">'+staticNear+'</g>'+
    '<g transform="translate(288 235) scale(.47)">'+perspectiveGlyph('ball')+'</g>'+
    '<g transform="translate(648 139) scale(.55)">'+staticFar+'</g>'+
    '<g transform="translate(442 178) scale(.35)">'+perspectiveGlyph('flower')+'</g>'+
    '<g transform="translate(142 112) scale(1.35)">'+symbol+'</g>'+
    '<g transform="translate(526 145) scale(.68)">'+symbol+'</g>'+
    '<text x="210" y="264" text-anchor="middle" font-size="18" fill="#365b4d">'+e(label)+'</text>'+
    '<text x="560" y="228" text-anchor="middle" font-size="15" fill="#365b4d">'+e(label)+'</text>'+
    '<rect x="24" y="19" width="140" height="36" rx="18" fill="'+(near?'#d1e8dd':'#fff')+'"/><text x="94" y="43" text-anchor="middle" font-size="19" font-weight="700" fill="#2b6d51">THIS · near</text>'+
    '<rect x="597" y="19" width="140" height="36" rx="18" fill="'+(!near?'#d1e8dd':'#fff')+'"/><text x="667" y="43" text-anchor="middle" font-size="19" font-weight="700" fill="#2b6d51">THAT · far</text>'+
    '<path d="'+arrow+'" stroke="#28765b" stroke-width="7" fill="none" stroke-linecap="round" marker-end="url(#'+uid+'-head)"/>'+
    '</svg>';
  return '<figure class="perspective-visual" data-perspective-distance="'+e(distance)+'" data-perspective-object="'+e(label)+'">'+
    svg+'<figcaption>این: نزدیک به دوربین · آن: دورتر از دوربین. فلش به نمونهٔ انتخاب‌شده اشاره می‌کند.</figcaption></figure>';
}

function sentenceComposer(a, c) {
  const source = a.type === 'composer-view' ? c.activitiesById?.[a.sourceActivityId] : a;
  if (!source || source.type !== 'sentence-composer') throw new Error('Missing sentence composer source: ' + a.sourceActivityId);
  // Each stage has its own selections, although all stages share the same JSON grammar and word sets.
  const key = `${c.lessonId}:${a.id}`;
  const saved = c.progress.sentenceComposers?.[key] || {};
  const allowed = a.type === 'composer-view' ? (a.patternIds || [a.patternId || source.defaultPattern]) : [source.defaultPattern];
  const selectedPattern = allowed.includes(saved.pattern) && !a.patternId ? saved.pattern : allowed[0];
  const resolved = resolveSentenceComposer(source, { ...saved, pattern: selectedPattern });
  const pattern = resolved.pattern;
  const renderSegments = (segments, interactive = false) => (segments || []).map((segment) => {
    const cycleSlot = segment.slot || segment.cycleSlot;
    if (interactive && cycleSlot) {
      return `<button type="button" class="composer-token" data-composer-key="${c.e(key)}" data-composer-action="cycle" data-composer-slot="${c.e(cycleSlot)}" aria-label="تغییر ${c.e(source.slots.find((slot) => slot.id === cycleSlot)?.label || cycleSlot)}">${c.e(composerSegmentValue(segment, source, resolved))}</button>`;
    }
    return `<span class="composer-segment">${c.e(composerSegmentValue(segment, source, resolved))}</span>`;
  }).join('');
  const patterns = a.type === 'composer-view' && a.patternIds?.length > 1
    ? `<div class="composer-patterns" role="group" aria-label="شکل جمله">${allowed.map((id) => {
        const entry = source.patterns.find((item) => item.id === id);
        return entry ? `<button type="button" class="composer-pattern ${entry.id === pattern.id ? 'active' : ''}" data-composer-key="${c.e(key)}" data-composer-action="pattern" data-composer-pattern="${c.e(entry.id)}" aria-pressed="${entry.id === pattern.id}">${c.e(entry.label)}</button>` : '';
      }).join('')}</div>` : '';
  const translation = pattern.translationSegments?.length
    ? `<p class="composer-translation" dir="rtl">${renderSegments(pattern.translationSegments)}</p>` : '';
  const note = a.showNote && pattern.note ? `<p class="composer-note">${c.e(pattern.note)}</p>` : '';
  const english = composeSegments(pattern.segments, source, resolved);
  const scene = perspectiveScene(source, a, resolved, key, c.e);
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p>${patterns}${scene}<div class="composer-stage"><div class="composer-sentence" lang="${c.e(source.targetLanguage || 'en')}" dir="ltr">${renderSegments(pattern.segments, true)}${soundButton(english, c.e, c.i)}</div>${translation}</div>${note}`, a, c.index, c.e, 'module-sentence-composer');
}

function sentenceLab(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const state = c.progress.sentenceLabs?.[key] || { structure: 0, variable: 0 };
  const structure = a.structures[state.structure] || a.structures[0];
  const variable = a.variables[state.variable] || a.variables[0];
  const result = `${structure.before || ''}${variable}${structure.after || ''}`;
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="lab-switches"><div class="lab-selector"><strong>${c.e(a.structureLabel || 'چطور بگویی؟')}</strong><div>${a.structures.map((item, index) => `<button class="lab-option ${index === state.structure ? 'active' : ''}" data-lab-key="${c.e(key)}" data-lab-kind="structure" data-lab-index="${index}">${c.en(item.label)}</button>`).join('')}</div></div><div class="lab-selector"><strong>${c.e(a.variableLabel || 'چه کسی؟')}</strong><div>${a.variables.map((item, index) => `<button class="lab-option ${index === state.variable ? 'active' : ''}" data-lab-key="${c.e(key)}" data-lab-kind="variable" data-lab-index="${index}">${c.en(item)}</button>`).join('')}</div></div></div><div class="lab-sentence">${c.en(result)}${soundButton(result, c.e, c.i)}</div>${structure.note ? `<p class="lab-note">${c.e(structure.note)}</p>` : ''}`, a, c.index, c.e, 'module-sentence-lab');
}
function familyTree(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const selected = Math.min(Math.max(Number(c.progress.familyPeople?.[key]) || 0, 0), a.people.length - 1);
  const person = a.people[selected];
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="family-tree-picker" role="group" aria-label="انتخاب عضو خانواده">${a.people.map((entry, index) => `<button type="button" class="family-person ${index === selected ? 'active' : ''}" data-family-key="${c.e(key)}" data-family-index="${index}" aria-pressed="${index === selected}"><span>${c.e(entry.initial || entry.name[0])}</span><strong>${c.en(entry.name)}</strong><small>${c.e(entry.fa)}</small></button>`).join('')}</div><div class="family-tree-result"><div class="family-tree-primary">${c.en(person.sentence)}${soundButton(person.sentence, c.e, c.i)}</div><p>${c.e(person.explanation || person.fa)}</p>${person.followup ? `<div class="family-tree-followup">${c.en(person.followup)}${soundButton(person.followup, c.e, c.i)}</div>` : ''}</div>`, a, c.index, c.e, 'module-family-tree');
}
function meaningCluster(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const choices = c.progress.meaningChoices?.[key] || {};
  const cards = a.concepts.map((concept) => {
    const form = resolveMeaningForm(a, concept, choices);
    const currentIndex = (Number(choices[concept.id]) || 0) % concept.forms.length;
    return `<div class="meaning-card" data-meaning-concept-card="${c.e(concept.id)}"><p class="meaning-idea">${c.e(concept.fa)}</p><div class="meaning-expression" lang="en" dir="ltr">${c.en(form.en)}${soundButton(form.en, c.e, c.i)}</div><p class="meaning-translation">${c.e(form.fa)}</p><p class="meaning-nuance">${form.relation === 'related' ? '<strong>مفهوم مرتبط، نه کاملاً هم‌معنا:</strong> ' : ''}${c.e(form.note || '')}</p><div class="meaning-bottom"><span>${currentIndex + 1} / ${concept.forms.length}</span><button type="button" class="meaning-next" data-meaning-key="${c.e(key)}" data-meaning-concept="${c.e(concept.id)}" aria-label="شیوهٔ بیان بعدی">بیان بعدی <span aria-hidden="true">←</span></button></div></div>`;
  }).join('');
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="meaning-grid">${cards}</div>`, a, c.index, c.e, 'module-meaning-cluster');
}

function familyLab(a, c) {
  const sceneWidth = a.scene?.width || 500;
  const sceneHeight = a.scene?.height || 335;
  const floorY = Math.round(sceneHeight * .51);
  const key = `${c.lessonId}:${a.id}`;
  const selected = Math.min(Math.max(Number(c.progress.familyPeople?.[key]) || 0, 0), a.people.length - 1);
  const person = a.people[selected];
  const figures = a.people.map((member, index) => {
    const { x, y, shirt, skin, hair } = member.scene;
    const active = index === selected;
    return `<g transform="translate(${x} ${y})" class="family-figure ${active ? 'is-selected' : ''}" aria-hidden="true">
      <ellipse cy="80" rx="43" ry="8" fill="#b9c8be" opacity=".5"/>
      <path d="M -36 73 Q -40 4 -14 5 L 17 5 Q 40 11 35 73 Z" fill="${c.e(shirt)}" stroke="#4c665a" stroke-width="2.5"/>
      <path d="M -30 75 H -9 L -12 104 H -31 Z M 9 75 H 30 L 31 104 H 11 Z" fill="#425b68"/>
      <circle cy="-30" r="24" fill="${c.e(skin)}" stroke="#8f7964" stroke-width="2"/>
      <path d="M-25-32 Q-26-60 0-59 Q23-59 26-32 Q 8-51 -10-39 Z" fill="${c.e(hair)}"/>
      <circle cx="-9" cy="-30" r="2.5" fill="#443b38"/><circle cx="9" cy="-30" r="2.5" fill="#443b38"/>
      <path d="M-7-18 Q0-12 7-18" fill="none" stroke="#8f5c51" stroke-width="2" stroke-linecap="round"/>
      <text y="123" text-anchor="middle" font-size="15" font-weight="700" fill="#365246">${c.e(member.name)}</text>
    </g>`;
  }).join('');
  const { x, y } = person.scene;
  const arrowOffset = y > sceneHeight / 2 ? 38 : 55;
  const arrow = `<g class="family-point-arrow" transform="translate(${x} ${y - arrowOffset})" aria-hidden="true"><path d="M0 -30V-2" stroke="#e56b49" stroke-width="6" stroke-linecap="round"/><path d="M-11-13L0 2L11-13" fill="none" stroke="#e56b49" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  const hits = a.people.map((entry, index) => `<button class="family-hit" type="button" style="left:${entry.scene.x / sceneWidth * 100}%;top:${entry.scene.y / sceneHeight * 100}%" data-family-key="${c.e(key)}" data-family-index="${index}" aria-pressed="${index === selected}" aria-label="اشاره به ${c.e(entry.name)}؛ ${c.e(entry.fa)}"></button>`).join('');
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="family-scene" role="group" aria-label="تصویر خانواده؛ هر نفر را لمس کن"><svg viewBox="0 0 ${sceneWidth} ${sceneHeight}" role="img" aria-label="${a.people.length} عضو خانواده و فلش اشاره به فرد انتخاب‌شده"><rect width="${sceneWidth}" height="${sceneHeight}" rx="22" fill="#edf6ec"/><path d="M0 ${floorY}H${sceneWidth}V${sceneHeight}H0Z" fill="#dcebd8"/>${figures}${arrow}</svg>${hits}</div><div class="family-tree-picker" role="group" aria-label="انتخاب عضو خانواده">${a.people.map((entry, index) => `<button type="button" class="family-person ${index === selected ? 'active' : ''}" data-family-key="${c.e(key)}" data-family-index="${index}" aria-pressed="${index === selected}"><strong>${c.en(entry.name)}</strong><small>${c.e(entry.fa)}</small></button>`).join('')}</div><div class="family-tree-result"><div class="family-tree-primary">${c.en(person.sentence)}${soundButton(person.sentence,c.e,c.i)}</div><p>${c.e(person.explanation || person.fa)}</p>${person.followup ? `<div class="family-tree-followup">${c.en(person.followup)}${soundButton(person.followup,c.e,c.i)}</div>` : ''}</div>`, a, c.index, c.e, 'module-family-lab module-family-tree');
}

function spatialBallSVG(layer, position) {
  return `<g class="spatial-ball spatial-ball-${layer}" data-spatial-ball-layer="${layer}" style="transform:translate(${position.ball.x}px,${position.ball.y}px);opacity:${position.ball.layer === layer ? 1 : 0}"><ellipse cy="37" rx="30" ry="8" fill="#344b43" opacity=".18"/><circle r="36" fill="#f4773c" stroke="#a83f22" stroke-width="4"/><ellipse cx="-11" cy="-13" rx="12" ry="8" fill="#ffd0aa" opacity=".85"/><path d="M12 19Q24 10 22-4" stroke="#e45a2e" stroke-width="4" opacity=".55" fill="none"/></g>`;
}
function spatialLab(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const position = selectedSpatialPosition(a, c.progress.spatialChoices?.[key]);
  if (!position) throw new Error('Spatial activity needs positions');
  const lift = position.boxLift || 0;
  const sideways = position.id === 'on';
  const inside = position.ball.layer === 'inside';
  const options = a.positions.map((entry) => `<button type="button" class="spatial-option ${entry.id === position.id ? 'active' : ''}" data-spatial-key="${c.e(key)}" data-spatial-position="${c.e(entry.id)}" aria-pressed="${entry.id === position.id}"><span lang="en">${c.e(entry.label)}</span><small>${c.e(entry.fa)}</small></button>`).join('');
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="spatial-lab-stage" data-spatial-stage="${c.e(key)}" data-spatial-current="${c.e(position.id)}"><svg class="spatial-svg" viewBox="0 0 520 410" role="img" aria-label="جعبهٔ سه‌بعدی و توپ بزرگ؛ برای روی جعبه، جعبه به پهلو خوابانده می‌شود؛ برای داخل، دیوارهٔ جلو نیمه‌شفاف می‌شود">
    <defs><linearGradient id="spatial-board" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f6eddc"/><stop offset="1" stop-color="#ebd3af"/></linearGradient><linearGradient id="spatial-front" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#deb17b"/><stop offset="1" stop-color="#bf8956"/></linearGradient></defs>
    <rect width="520" height="410" rx="23" fill="#f4f8f1"/><path d="M0 349Q260 337 520 348V410H0Z" fill="#e0ebdb"/><ellipse cx="258" cy="362" rx="146" ry="15" fill="#b6c3b4" opacity=".38"/>
    ${spatialBallSVG('behind', position)}
    <g class="spatial-box-mode" data-spatial-orientation="open" style="opacity:${sideways ? 0 : 1}">
      <g class="spatial-box-part" data-box-part="back" style="transform:translateY(-${lift}px)">
        <path d="M152 164L236 110L369 144L294 195Z" fill="#96603d" stroke="#986d49" stroke-width="3"/>
        <path d="M236 110L369 144L390 127L250 94Z" fill="#e4b782" stroke="#986d49" stroke-width="3"/>
        <path d="M152 164L236 110L216 94L129 145Z" fill="#edc695" stroke="#986d49" stroke-width="3"/>
        <path d="M152 164L294 195L369 144L369 271L294 314L152 275Z" fill="#94613d" stroke="#93643d" stroke-width="3"/>
        <path d="M176 187L292 214L343 180L343 260L292 285L176 254Z" fill="#b78251" opacity=".9"/>
      </g>
      ${spatialBallSVG('inside', position)}
      <g class="spatial-box-part" data-box-part="front" style="transform:translateY(-${lift}px)">
        <g data-spatial-cutaway style="opacity:${inside ? .14 : 1}">
          <path d="M152 164L294 195L294 314L152 275Z" fill="url(#spatial-front)" stroke="#956a44" stroke-width="3"/>
          <path d="M294 195L369 144L369 271L294 314Z" fill="#c08c59" stroke="#91643d" stroke-width="3"/>
        </g>
        <path d="M152 164L294 195L267 235L108 195Z" fill="#efc58e" stroke="#a47247" stroke-width="3"/>
        <path d="M294 195L369 144L417 174L336 236Z" fill="#dfb17c" stroke="#a47247" stroke-width="3"/>
      </g>
    </g>
    <g class="spatial-box-mode" data-spatial-orientation="side" style="opacity:${sideways ? 1 : 0}">
      <path d="M132 208L224 151L412 183L322 239Z" fill="#edc48d" stroke="#9a6a43" stroke-width="4"/>
      <path d="M132 208L322 239L322 320L132 286Z" fill="url(#spatial-front)" stroke="#9a6a43" stroke-width="4"/>
      <path d="M322 239L412 183L412 268L322 320Z" fill="#bd8752" stroke="#95623c" stroke-width="4"/>
      <path d="M170 216L283 235" stroke="#fff0d1" stroke-width="5" opacity=".65"/>
    </g>
    ${spatialBallSVG('front', position)}
  </svg><div class="spatial-caption" aria-live="polite"><strong class="spatial-English" lang="en" dir="ltr">${c.e(position.en)}</strong><p class="spatial-Persian" dir="rtl">${c.e(position.faSentence)}</p>${soundButton(position.en,c.e,c.i)}</div><div class="spatial-controls" role="group" aria-label="موقعیت توپ نسبت به جعبه">${options}</div></div>`, a, c.index, c.e, 'module-spatial-lab');
}
function agreementLab(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const saved = c.progress.agreementChoices?.[key] || {};
  const index = Math.max(0, Math.min(a.members.length - 1, Number(saved.member) || 0));
  const selected = a.members[index];
  const direct = saved.perspective === 'you';
  const subject = direct ? 'You' : selected.subject;
  const verb = direct ? 'are' : 'is';
  const possessive = direct ? 'Your' : selected.possessive;
  const sentence = `${subject} ${verb} my ${selected.en}.`;
  const negative = `${subject} ${verb} not my ${selected.en}.`;
  const question = direct ? `Are you my ${selected.en}?` : `Is ${subject.toLowerCase()} your ${selected.en}?`;
  const name = `${possessive} name is ${selected.name}.`;
  const options = a.members.map((member, i) => `<button type="button" class="agreement-option ${i === index ? 'active' : ''}" data-agreement-key="${c.e(key)}" data-agreement-choice="member" data-agreement-index="${i}" aria-pressed="${i === index}">${c.en(member.en)}<small>${c.e(member.fa)}</small></button>`).join('');
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="agreement-stage" data-agreement-module="${c.e(key)}"><div class="agreement-caption">روی هر واژهٔ رنگی بزن و تغییر بقیهٔ جمله را ببین.</div><div class="agreement-live-line" lang="en" dir="ltr"><button type="button" class="agreement-token" data-agreement-key="${c.e(key)}" data-agreement-choice="perspective" aria-label="تغییر میان He یا She و You">${c.e(subject)}</button><button type="button" class="agreement-token" data-agreement-key="${c.e(key)}" data-agreement-choice="perspective" aria-label="تغییر is و are">${c.e(verb)}</button><span>my</span><button type="button" class="agreement-token agreement-role-switch" data-agreement-key="${c.e(key)}" data-agreement-choice="next-member" aria-label="تغییر عضو خانواده">${c.e(selected.en)}</button><span>.</span>${soundButton(sentence, c.e, c.i)}</div><div class="agreement-member-options" role="group" aria-label="انتخاب نسبت خانوادگی">${options}</div><div class="agreement-compare"><div><span>منفی</span>${c.en(negative)}${soundButton(negative, c.e, c.i)}</div><div><span>سؤالی</span>${c.en(question)}${soundButton(question, c.e, c.i)}</div><div><span>نام او / تو</span>${c.en(name)}${soundButton(name, c.e, c.i)}</div></div><p class="agreement-rule">${direct ? 'وقتی مستقیم به کسی می‌گویی «تو»، You با are می‌آید؛ فرقی نمی‌کند خواهر باشد یا برادر.' : `چون ${c.e(selected.fa)} ${selected.subject === 'He' ? 'مذکر' : 'مؤنث'} است، ضمیر ${c.en(selected.subject)} با is می‌آید و برای نامش ${c.en(selected.possessive)} می‌گوییم.`}</p></div>`, a, c.index, c.e, 'module-agreement-lab');
}
function practiceSequence(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const state = practiceState(c.progress.practiceStates?.[key], a);
  const tasks = a.tasks || a.turns || [];
  const task = tasks[state.answers.length];
  const history = state.answers.length ? `<details class="practice-past"><summary>${state.answers.length} پاسخ ساخته‌شده · مرور</summary>${state.answers.map((answer, index) => `<div class="practice-answer-past"><span>✓ ${c.e(tasks[index].task)}</span><div>${c.en(answer)}${soundButton(answer, c.e, c.i)}</div></div>`).join('')}</details>` : '';
  const markers = `<div class="practice-progress" aria-label="${state.answers.length} از ${tasks.length} پاسخ درست">${tasks.map((_, index) => `<span class="${index < state.answers.length ? 'complete' : index === state.answers.length ? 'active' : ''}"></span>`).join('')}</div>`;
  const source = task?.incoming || task?.source;
  const audioSource = task?.sourceMode === 'audio';
  const prompt = !source ? '' : audioSource
    ? `<div class="practice-source practice-listening"><span>${c.e(task.speaker || 'صدای مخاطب')} · اول گوش کن، بعد جواب بده</span><div class="practice-audio-prompt">${soundButton(source, c.e, c.i)}<strong>شنیدن جمله</strong></div><details class="practice-audio-fallback"><summary>صدا پخش نشد؟ نمایش متن</summary><div>${c.en(source)}</div></details></div>`
    : `<div class="practice-source"><span>${c.e(task.speaker || task.sourceLabel || 'جملهٔ آغاز')}</span><div>${c.en(source)}${soundButton(source, c.e, c.i)}</div></div>`;
  const feedback = state.feedback ? `<div class="practice-feedback error" role="status"><strong>${c.e(state.feedback.feedback)}</strong>${state.feedback.repair ? `<p>${c.e(state.feedback.repair)}</p>` : ''}<span>پاسخ را اصلاح کن و دوباره امتحان کن.</span></div>` : '';
  const help = task ? `<details class="guided-hint" ${state.attempts > 1 ? 'open' : ''}><summary>راهنمایی ${state.attempts > 1 ? 'و یک نمونه پاسخ' : 'می‌خواهم'}</summary><p>${c.e(task.hint || '')}</p>${state.attempts > 1 && task.example ? `<div class="practice-model">${c.en(task.example)}${soundButton(task.example, c.e, c.i)}</div>` : ''}</details>` : '';
  return `<div class="practice-sequence" data-practice-key="${c.e(key)}">${markers}${history}${task ? `${prompt}<label class="practice-instruction" for="practice-${c.e(a.id)}">${c.e(task.task)}</label><form class="practice-form" data-practice-form="${c.e(key)}"><input id="practice-${c.e(a.id)}" name="response" value="${c.e(state.draft)}" type="text" lang="en" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="پاسخت را به انگلیسی بساز…" aria-label="${c.e(task.task)}" required><button class="secondary-btn" type="submit">بررسی پاسخ</button></form>${feedback}${help}` : `<div class="practice-finished" role="status"><strong>✓ این مهارت را در ${tasks.length} موقعیت تمرین کردی.</strong><p>${c.e(a.completion || 'حالا بدون راهنمایی، در بخش بعدی از آن استفاده کن.')}</p><button class="outline-btn" data-practice-reset="${c.e(key)}">تمرین دوباره</button></div>`}</div>`;
}
function responsePractice(a, c) {
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p>${practiceSequence(a, c)}`, a, c.index, c.e, 'module-response-practice');
}
function exchangeLab(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const saved = c.progress.exchangeChoices?.[key] || { pair: 0, variant: 0 };
  const pairIndex = Math.max(0, Math.min(a.pairs.length - 1, Number(saved.pair) || 0));
  const pair = a.pairs[pairIndex];
  const variantIndex = Math.max(0, Math.min(pair.variants.length - 1, Number(saved.variant) || 0));
  const variant = pair.variants[variantIndex];
  const question = `<div class="exchange-bubble question-bubble"><span class="exchange-speaker">نفر اول · سؤال</span><div class="exchange-spoken">${c.en(pair.question)}${soundButton(pair.question, c.e, c.i)}</div><small>${c.e(pair.questionFa)}</small></div>`;
  const answer = `<div class="exchange-bubble answer-bubble"><span class="exchange-speaker">نفر دوم · پاسخ</span><div class="exchange-spoken">${c.en(variant.en)}${soundButton(variant.en, c.e, c.i)}</div><small>${c.e(variant.fa)}</small></div>`;
  const pairNav = `<div class="exchange-pair-tabs" role="group" aria-label="انتخاب سؤال">${a.pairs.map((entry, index) => `<button type="button" class="exchange-pair-btn ${index === pairIndex ? 'active' : ''}" aria-pressed="${index === pairIndex}" data-exchange-key="${c.e(key)}" data-exchange-pair="${index}">سؤال ${index + 1}</button>`).join('')}</div>`;
  const variants = `<div class="exchange-variants" role="group" aria-label="مقایسه پاسخ‌ها">${pair.variants.map((entry, index) => `<button type="button" class="exchange-variant-btn ${index === variantIndex ? 'active' : ''}" aria-pressed="${index === variantIndex}" data-exchange-key="${c.e(key)}" data-exchange-variant="${index}">${c.e(entry.label)}</button>`).join('')}</div>`;
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p>${pairNav}<div class="exchange-stage">${question}${answer}</div>${variants}<p class="exchange-note">${c.e(variant.note || '')}</p>`, a, c.index, c.e, 'module-exchange-lab');
}
function sentenceTransform(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const stage = c.progress.transformStages?.[key] || 'explore';
  const selected = Math.max(0, Math.min(a.forms.length - 1, c.progress.transformChoices?.[key] || 0));
  const form = a.forms[selected];
  const sentence = `<div class="transform-sentence">${c.en(form.en)}${soundButton(form.en, c.e, c.i)}</div>`;
  const modes = `<div class="transform-modes" role="group" aria-label="تبدیل جمله">${a.forms.map((entry, index) => `<button class="transform-mode ${index === selected ? 'active' : ''}" data-transform-key="${c.e(key)}" data-transform-index="${index}" aria-pressed="${index === selected}">${c.e(entry.label)}</button>`).join('')}</div>`;
  const exploration = `<p class="module-description">${c.e(a.description || '')}</p>${modes}<div class="transform-card"><div class="transform-position">حالت ${selected + 1} از ${a.forms.length}</div>${sentence}<div class="transform-meaning">${c.e(form.fa)}</div><p class="transform-rule">${c.e(form.rule)}</p><div class="transform-actions"><button class="outline-btn" data-transform-key="${c.e(key)}" data-transform-index="${Math.max(0, selected - 1)}" ${selected === 0 ? 'disabled' : ''}>جملهٔ قبل</button><button class="secondary-btn" data-transform-key="${c.e(key)}" data-transform-index="${Math.min(a.forms.length - 1, selected + 1)}" ${selected === a.forms.length - 1 ? 'disabled' : ''}>تغییر بعدی ←</button></div></div><button class="transform-start secondary-btn" data-transform-stage="practice" data-transform-stage-key="${c.e(key)}">${c.e(a.practiceTitle || 'حالا خودت امتحان کن')} ←</button>`;
  const practice = `<button class="transform-return outline-btn" data-transform-stage="explore" data-transform-stage-key="${c.e(key)}">← بازگشت به کارت‌های جمله</button><div class="transform-practice-heading"><strong>${c.e(a.practiceTitle || 'حالا خودت تغییر بده')}</strong><p>${c.e(a.practiceIntro || '')}</p></div>${practiceSequence(a, c)}`;
  return wrapper(stage === 'practice' ? practice : exploration, a, c.index, c.e, 'module-sentence-transform');
}
function guidedDialogue(a, c) {
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p>${practiceSequence(a, c)}`, a, c.index, c.e, 'module-guided-dialogue');
}
function dialogueTransfer(a, c) {
  return wrapper(`<div class="transfer-scenario"><strong>${c.e(a.sceneTitle)}</strong><p>${c.e(a.description)}</p></div>${practiceSequence(a, c)}`, a, c.index, c.e, 'module-dialogue-transfer');
}
function pattern(a, c) {
  return wrapper(`<p class="module-description">${c.e(a.explanation)}</p><div class="pattern-main">${c.en(a.formula)}</div><div class="example-row">${a.examples.map((line) => `<span class="example-pill">${c.en(line)}</span>`).join('')}</div>`, a, c.index, c.e);
}
function match(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const state = c.progress.matchAnswers[key] || { selected: null, solved: [] };
  const done = state.solved.length === a.pairs.length;
  const source = a.pairs.map((pair, idx) => `<button class="match-item en ${state.selected === idx ? 'selected' : ''} ${state.solved.includes(idx) ? 'matched' : ''}" data-match="${c.e(key)}" data-match-side="source" data-pair="${idx}" ${state.solved.includes(idx) ? 'disabled' : ''}>${c.e(pair.en)}</button>`).join('');
  const target = (a.targetOrder || a.pairs.map((_, i) => i)).map((pairIdx) => `<button class="match-item ${state.solved.includes(pairIdx) ? 'matched' : ''}" data-match="${c.e(key)}" data-match-side="target" data-pair="${pairIdx}" ${state.solved.includes(pairIdx) ? 'disabled' : ''}>${c.e(a.pairs[pairIdx].fa)}</button>`).join('');
  return wrapper(`<p class="module-description">${c.e(a.description)}</p><div class="match-grid"><div class="match-side">${source}</div><div class="match-side">${target}</div></div><div class="module-result">${done ? '✓ همه عبارت‌ها را درست وصل کردی.' : `${state.solved.length} از ${a.pairs.length} جفت پیدا شد`}</div>`, a, c.index, c.e, 'module-match');
}
function sentenceBuilder(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  if (a.sentences?.length) {
    const state = normalizePuzzleState(a, c.progress.sentenceAnswers[key]);
    const bank = puzzleTokenBank(a);
    const used = new Set(a.reuseBank ? [] : state.completed.flatMap((entry) => entry.indices));
    const chosen = state.current.map((idx) => puzzleDisplayWord(bank[idx]?.word || '')).join(' ');
    const total = a.goalCount || a.sentences.length;
    const done = state.completed.length;
    const allDone = done === total;
    const solved = state.completed.map((entry) => {
      const original = a.sentences.find((sentence) => sentence.id === entry.id);
      return `<li class="builder-found-item" dir="ltr" lang="en">${c.e(entry.text || original?.words.join(' ') || '')}</li>`;
    }).join('');
    const tokens = bank.map(({ word }, idx) => {
      const disabled = used.has(idx) || state.current.includes(idx) || allDone;
      return `<button type="button" data-build-token="${c.e(key)}" data-token-index="${idx}" ${disabled ? 'disabled' : ''}>${c.e(puzzleDisplayWord(word))}</button>`;
    }).join('');
    const feedback = state.feedback === 'wrong'
      ? '<p class="builder-feedback wrong" role="status">این چینش جزو جمله‌های درست این تمرین نیست؛ جابه‌جایش کن یا آخرین واژه را بردار.</p>'
      : state.feedback === 'duplicate'
        ? '<p class="builder-feedback" role="status">این جمله قبلاً ساخته شده؛ ترکیب متفاوتی امتحان کن.</p>'
      : state.feedback === 'correct'
        ? `<p class="builder-feedback correct" role="status">${allDone ? 'همهٔ جمله‌ها را پیدا کردی.' : 'این جمله درست بود؛ حالا با همین بانک کلمات، جملهٔ متفاوتی بساز.'}</p>`
        : '';
    return wrapper(`<p class="module-description">${c.e(a.description || '')}</p>
      <div class="builder-multi-progress"><strong>${done} از ${total} جملهٔ درست</strong><span>جمله‌ها را به هر ترتیبی که پیدا می‌کنی بساز.</span></div>
      <div class="builder-output" lang="en" dir="ltr">${chosen ? c.e(chosen) : '<span class="builder-placeholder">کلمات جملهٔ جدید را لمس کن…</span>'}</div>
      <p class="builder-prefix-notice" aria-live="polite"></p>
      ${feedback}${state.warning ? `<p class="builder-feedback" role="status">${c.e(state.warning)}</p>` : ''}
      ${done ? `<details class="builder-found" ${allDone ? 'open' : ''}><summary>جمله‌های ساخته‌شده (${done})</summary><ol>${solved}</ol></details>` : ''}
      <div class="builder-tokens" dir="ltr" aria-label="بانک کلمات چند جمله">${tokens}</div>
      <div class="builder-bottom">
        <div class="builder-actions">
          <button class="outline-btn" type="button" data-build-undo="${c.e(key)}" ${!state.current.length ? 'disabled' : ''}>حذف آخرین کلمه</button>
          <button class="outline-btn" type="button" data-build-clear="${c.e(key)}" ${!state.current.length ? 'disabled' : ''}>پاک‌کردن جمله</button>
          <button class="secondary-btn" type="button" data-build-submit="${c.e(key)}" ${!state.current.length || allDone ? 'disabled' : ''}>بررسی جمله</button>
        </div>
        <button class="outline-btn" type="button" data-build-reset="${c.e(key)}">شروع دوبارهٔ جورچین</button>
      </div>`, a, c.index, c.e, 'module-builder module-builder-multi');
  }
  // Legacy single-sentence puzzles remain compatible with the existing renderer.
  const chosen = c.progress.sentenceAnswers[key] || [];
  const finished = chosen.length === a.tokens.length;
  const correct = finished && chosen.every((entry, idx) => entry === a.correctOrder[idx]);
  return wrapper(`<p class="module-description">${c.e(a.description)}</p><div class="builder-output" lang="en" dir="ltr">${chosen.length ? chosen.map((idx) => `<span>${c.e(a.tokens[idx])}</span>`).join(' ') : '<span class="builder-placeholder">واژه‌ها را انتخاب کن…</span>'}</div><div class="builder-tokens" dir="ltr">${a.tokens.map((word, idx) => `<button data-build-token="${c.e(key)}" data-token-index="${idx}" ${chosen.includes(idx) ? 'disabled' : ''}>${c.e(word)}</button>`).join('')}</div><div class="builder-bottom"><span class="module-result">${finished ? (correct ? '✓ جمله را درست ساختی.' : 'ترتیب واژه‌ها را دوباره بررسی کن.') : c.e(a.translation)}</span><button class="outline-btn" data-build-reset="${c.e(key)}">شروع دوباره</button></div>`, a, c.index, c.e, 'module-builder');
}
function quizSet(a, c) {
  return wrapper(a.questions.map((question, qIdx) => {
    const key = `${c.lessonId}:${a.id}:${qIdx}`;
    const chosen = c.progress.quizAnswers[key];
    return `<div class="quiz-question"><span class="question-number">سؤال ${qIdx + 1}</span><div class="question">${c.e(question.question)}</div><div class="choices">${question.choices.map((answer, choiceIndex) => `<button class="choice ${chosen === choiceIndex ? 'selected ' + (choiceIndex === question.answer ? 'correct' : 'wrong') : ''}" data-quiz="${c.e(key)}" data-choice="${choiceIndex}">${c.en(answer)}</button>`).join('')}</div>${chosen !== undefined ? `<div class="feedback ${chosen === question.answer ? '' : 'error'}">${chosen === question.answer ? c.e(question.feedback) : 'دوباره امتحان کن.'}</div>` : ''}</div>`;
  }).join(''), a, c.index, c.e, 'module-quizzes');
}
function dialogueLineValue(line, c, language = 'en') {
  const segments = language === 'en' ? line.segments : line.translationSegments;
  if (!segments) return String(line[language] || '');
  const source = line.sourceActivityId ? c.activitiesById?.[line.sourceActivityId] : null;
  if (!source || source.type !== 'sentence-composer') {
    return segments.map((segment) => Object.hasOwn(segment, 'fixed') ? segment.fixed : segment.text || '').join('');
  }
  const key = `${c.lessonId}:${source.id}`;
  const resolved = resolveSentenceComposer(source, c.progress.sentenceComposers?.[key]);
  return composeSegments(segments, source, resolved);
}

export function renderDialogueLines(a, c, step, enteringIndex = -1, { all = false } = {}) {
  const speakers = [...new Set(a.lines.map((line) => line.speaker))];
  const entries = all ? a.lines.map((line, index) => ({ line, lineIndex: index })) : a.lines.slice(step, step + 2).map((line, index) => ({ line, lineIndex: step + index }));
  return entries.map(({ line, lineIndex }) => {
    const side = speakers.indexOf(line.speaker) % 2 === 0 ? 'speaker-first' : 'speaker-second';
    const shown = lineIndex >= step && lineIndex < step + 2;
    const entering = !all && (enteringIndex === -1 || lineIndex === enteringIndex) ? 'dialogue-entering' : '';
    const english = dialogueLineValue(line, c, 'en');
    const persian = dialogueLineValue(line, c, 'fa');
    return `<div class="dialogue-line ${side} ${entering}" data-dialogue-line="${lineIndex}" data-dialogue-visible="${shown}" ${all && !shown ? 'aria-hidden="true" inert' : ''}><span class="speaker-avatar" aria-hidden="true">${c.e(line.speaker.slice(0, 1))}</span><div class="bubble"><strong class="speaker-name">${c.e(line.speaker)}</strong><div class="spoken-line"><button type="button" class="dialogue-sentence" data-speak="${c.e(english)}" aria-label="شنیدن جملهٔ ${c.e(line.speaker)}">${c.en(english)}</button></div>${c.progress.showDialogueTranslation ? `<p>${c.e(persian)}</p>` : ''}</div></div>`;
  }).join('');
}
function dialogue(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const maxStep = Math.max(0, a.lines.length - 2);
  const stored = Number(c.progress.dialogueSteps?.[key]);
  const step = Number.isFinite(stored) ? Math.max(0, Math.min(maxStep, Math.round(stored))) : 0;
  const scrubber = `<div class="dialogue-timeline"><div class="dialogue-timeline-top"><strong data-dialogue-count="${c.e(key)}">${step + 1}–${Math.min(step + 2, a.lines.length)} / ${a.lines.length}</strong><span>نوار را بکش؛ جملهٔ تازه پخش می‌شود</span></div><div class="dialogue-timeline-controls"><button type="button" class="dialogue-nav" data-dialogue-key="${c.e(key)}" data-dialogue-nav="-1" ${step === 0 ? 'disabled' : ''} aria-label="نوبت قبلی">‹</button><input type="range" data-dialogue-slider="${c.e(key)}" min="0" max="${maxStep}" step="0.01" value="${step}" aria-label="نوار زمان مکالمه؛ حرکت پیوسته بین ${maxStep + 1} نوبت"><button type="button" class="dialogue-nav" data-dialogue-key="${c.e(key)}" data-dialogue-nav="1" ${step === maxStep ? 'disabled' : ''} aria-label="نوبت بعدی">›</button></div><button type="button" class="dialogue-play outline-btn" data-dialogue-play="${c.e(key)}">${c.i('sound')} شنیدن دو جمله</button></div>`;
  return wrapper(`<div class="dialogue-headline"><span>${c.e(a.description || '')}</span><button class="outline-btn" data-action="toggle-translations">${c.progress.showDialogueTranslation ? 'پنهان‌کردن معنی' : 'نمایش معنی'}</button></div><div class="dialogue dialogue-window" data-dialogue-window="${c.e(key)}" data-dialogue-position="${step}" aria-live="off"><div class="dialogue-track">${renderDialogueLines(a, c, step, -1, { all: true })}</div></div>${scrubber}`, a, c.index, c.e, 'module-dialogue-timeline');
}
function roleplay(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const answers = c.progress.roleplayAnswers[key] || [];
  const index = answers.length;
  const turn = a.turns[index];
  const history = answers.map((answer, i) => `<div class="role-turn"><div class="role-speaker">${c.e(a.turns[i].speaker)}: ${c.en(a.turns[i].prompt)}</div><div class="role-user">${c.en(a.turns[i].choices[answer])}</div></div>`).join('');
  return wrapper(`<p class="module-description">${c.e(a.description)}</p><div class="roleplay-progress">${a.turns.map((_, i) => `<span class="${i < index ? 'filled' : ''}"></span>`).join('')}</div><div class="roleplay-history">${history}</div>${turn ? `<div class="role-speaker"><strong>${c.e(turn.speaker)}</strong><div>${c.en(turn.prompt)} ${soundButton(turn.prompt, c.e, c.i)}</div></div><div class="choices">${turn.choices.map((choice, i) => `<button class="choice" data-roleplay="${c.e(key)}" data-role-choice="${i}">${c.en(choice)}</button>`).join('')}</div>` : `<div class="module-result success">✓ گفت‌وگو را تا آخر پیش بردی!<p>${c.en(a.turns.at(-1).reply)}</p></div>`}`, a, c.index, c.e, 'module-roleplay');
}
function expressionStudy(a, c) {
  const labels = { fixed: 'عبارت کاربردی', collocation: 'ترکیب رایج', preposition: 'عبارت مکانی' };
  const cards = (a.items || []).map((item) => {
    const examples = item.examples?.length
      ? `<details class="expression-examples"><summary>نمونه‌ها</summary><ul>${item.examples.map((line) => `<li>${c.en(line)}</li>`).join('')}</ul></details>`
      : '';
    return `<article class="expression-card"><span class="expression-kind">${c.e(labels[item.kind] || 'عبارت')}</span><div class="expression-main">${c.en(item.en)}${soundButton(item.en, c.e, c.i)}</div><p>${c.e(item.fa)}</p>${examples}</article>`;
  }).join('');
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="expression-grid">${cards}</div>`, a, c.index, c.e, 'module-expression-study');
}
function shadowing(a, c) {
  const isReview = a.type === 'shadowing-review';
  const source = isReview ? c.activitiesById?.[a.sourceActivityId] : a;
  if (!source || source.type !== 'shadowing') throw new Error('Missing opening shadowing track: ' + a.sourceActivityId);
  const key = `${c.lessonId}:${a.id}`;
  const playback = source.audioSrc
    ? `<audio class="shadowing-audio" data-shadowing-audio="${c.e(key)}" controls preload="none" src="${c.e(source.audioSrc)}"></audio><label class="shadowing-speed-label">سرعت پخش <select data-shadowing-speed="${c.e(key)}"><option value="0.65">خیلی آهسته</option><option value="0.75" selected>آهسته</option><option value="0.85">طبیعی‌تر</option></select></label>`
    : `<div class="shadowing-playback"><button type="button" class="secondary-btn shadowing-play" data-shadowing-key="${c.e(key)}" data-shadowing-source="${c.e(source.id)}">${c.i('sound')} پخش برای سایه‌خوانی</button><label class="shadowing-speed-label">سرعت <select data-shadowing-speed="${c.e(key)}"><option value="0.62">خیلی آهسته</option><option value="0.72" selected>آهسته</option><option value="0.82">کمی سریع‌تر</option></select></label></div>`;
  const transcript = `<details class="shadowing-transcript"><summary>دیدن متن انگلیسی (اختیاری)</summary><ol>${source.lines.map((line) => `<li><span>${c.en(line)}</span>${soundButton(line, c.e, c.i)}</li>`).join('')}</ol></details>`;
  const instruction = isReview
    ? 'این همان محتوای شنیداری ابتدای درس است. دوباره گوش بده و همراه صدا تکرار کن؛ این بار باید تقلید گفتار برایت روان‌تر باشد.'
    : 'فقط گوش بده و هم‌زمان یا با فاصله‌ای کوتاه تکرار کن. لازم نیست معنی جمله‌ها را بفهمی؛ اگر جا ماندی سرعت را کمتر کن.';
  const fallbackNote = source.audioSrc ? '' : '<p class="shadowing-fallback-note">نسخهٔ فعلی از صدای انگلیسی مرورگر استفاده می‌کند؛ فایل ضبط‌شده می‌تواند بدون تغییر ساختار درس جایگزین شود.</p>';
  return wrapper(`<p class="module-description">${c.e(a.description || instruction)}</p><div class="shadowing-player">${playback}</div>${fallbackNote}<p class="shadowing-status" data-shadowing-status="${c.e(key)}" role="status">${isReview ? 'همان مسیر صوتی را دوباره تمرین کن.' : 'آمادهٔ شنیدن و تکرار.'}</p>${transcript}`, a, c.index, c.e, 'module-shadowing');
}
function pictureDescription(a, c) {
  const image = `<figure class="picture-description-scene"><img src="${c.e(a.image)}" alt="${c.e(a.imageAlt)}" loading="lazy"/><figcaption>${c.e(a.caption || '')}</figcaption></figure>`;
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p>${image}<p class="picture-description-note">اول تصویر را نگاه کن؛ بعد هر جمله را خودت بساز. جواب آماده روی تصویر نوشته نشده است.</p>${practiceSequence(a, c)}`, a, c.index, c.e, 'module-picture-description');
}
function freeWrite(a, c) {
  const stored = c.progress.written[c.lessonId] || '';
  const key = `${c.lessonId}:${a.id}`;
  const feedback = c.progress.assessments?.[key];
  const status = feedback ? `<div class="practice-feedback ${feedback.passed ? 'success' : 'error'}" role="status"><strong>${c.e(feedback.feedback)}</strong>${feedback.repair ? `<p>${c.e(feedback.repair)}</p>` : ''}${feedback.passed ? '<span>✓ نشانهٔ یادگیری این بخش ثبت شد.</span>' : '<span>متنت باقی می‌ماند؛ می‌توانی همان را اصلاح کنی.</span>'}</div>` : '';
  return wrapper(`<label class="input-label" for="free-response">${c.e(a.prompt)}</label><textarea class="free-input" id="free-response" lang="en" dir="ltr" placeholder="${c.e(a.placeholder)}" rows="3">${c.e(stored)}</textarea><p class="hint">${c.e(a.hint)}</p><button class="secondary-btn" data-action="save-production">${a.assessment ? 'بررسی گفت‌وگوی من' : 'ذخیره پاسخ'} ${c.i('check')}</button>${status}${a.assessment ? '<p class="practice-caveat">بازخورد بر اساس ساختارهای مشخص همین درس است؛ تصحیح آزادِ همهٔ جمله‌های انگلیسی نیست.</p>' : ''}`, a, c.index, c.e);
}

/* Shared visual grammar blocks; scenes and lexical contrasts are authored by lesson JSON. */
function countObjectSvg(shape, e) {
  const symbols = {
    book: '<rect x="12" y="8" width="43" height="48" rx="5" fill="#6c9b91" stroke="#335f58" stroke-width="3"/><path d="M24 8V56M32 20H49M32 28H49" stroke="#d8eee6" stroke-width="3"/>',
    apple: '<path d="M33 20C16 10 9 28 16 46C22 61 31 55 34 52C40 57 50 60 55 43C61 25 49 12 35 20Z" fill="#e37e60" stroke="#9b4c3f" stroke-width="3"/><path d="M33 20Q31 12 38 8M38 12Q50 4 54 11Q46 18 38 12Z" fill="none" stroke="#598d64" stroke-width="4"/>',
    fish: '<path d="M15 33Q34 7 54 33Q34 58 15 33Z" fill="#79adb6" stroke="#34717b" stroke-width="3"/><path d="M15 33L4 17L4 49Z" fill="#5b9ba5" stroke="#34717b" stroke-width="3"/><circle cx="43" cy="28" r="3" fill="#23464a"/>',
    pencil: '<path d="M27 6H41V48L34 62L27 48Z" fill="#e3bb5a" stroke="#99763e" stroke-width="3"/><path d="M27 12H41M27 47H41M34 62V51" stroke="#8d6548" stroke-width="2"/>',
    pen: '<rect x="28" y="7" width="13" height="43" rx="6" fill="#779bc3" stroke="#40658d" stroke-width="3"/><path d="M29 50L34 62L41 50" fill="#e8cc9b" stroke="#40658d" stroke-width="2"/><path d="M29 15H41" stroke="#d9e9f6" stroke-width="3"/>',
    bag: '<rect x="12" y="22" width="46" height="37" rx="6" fill="#8da6bd" stroke="#4c6e88" stroke-width="3"/><path d="M23 23V16A12 12 0 0 1 47 16V23" fill="none" stroke="#4c6e88" stroke-width="4"/><path d="M15 35H55" stroke="#dce8ef" stroke-width="3"/>',
    box: '<path d="M6 21L34 9L62 21L34 34Z" fill="#e8c18d" stroke="#9b704a" stroke-width="3"/><path d="M6 21L34 34V61L6 47Z" fill="#d2a26c" stroke="#9b704a" stroke-width="3"/><path d="M62 21L34 34V61L62 47Z" fill="#bf8a54" stroke="#9b704a" stroke-width="3"/>',
    child: '<circle cx="34" cy="17" r="10" fill="#e7b78c"/><path d="M18 58L23 31H45L50 58Z" fill="#7fa78e" stroke="#416f5b" stroke-width="3"/><path d="M27 58V64M41 58V64" stroke="#537c69" stroke-width="5"/>',
    person: '<circle cx="34" cy="15" r="10" fill="#e7b78c"/><path d="M16 59L22 29H46L52 59Z" fill="#7fa2bd" stroke="#426480" stroke-width="3"/><path d="M27 59V64M41 59V64" stroke="#426480" stroke-width="5"/>',
    sheep: '<ellipse cx="32" cy="38" rx="25" ry="19" fill="#f2eee4" stroke="#acb4ae" stroke-width="3"/><circle cx="52" cy="30" r="12" fill="#a4adb0"/><circle cx="55" cy="26" r="2.5" fill="#2b4147"/><path d="M17 53V63M39 53V63" stroke="#87918f" stroke-width="5"/>',
    orange: '<circle cx="34" cy="35" r="23" fill="#eda45a" stroke="#b56e31" stroke-width="3"/><path d="M34 12Q43 2 51 12Q43 17 34 12Z" fill="#659268"/>'
  };
  return '<svg viewBox="0 0 68 68" class="count-object-picture" aria-hidden="true">'+(symbols[shape]||symbols.book)+'</svg>';
}
function countVisual(a,c) {
  const scenes=(a.scenes||[]).map((scene)=>{
    const renderAmount=(qty)=>Array.from({length:Math.min(10,qty)},()=>countObjectSvg(scene.shape,c.e)).join('');
    return '<div class="count-visual-scene"><div class="count-visual-pair">'+
      '<div class="count-visual-frame"><div class="count-picture-row">'+renderAmount(scene.singularCount||1)+'</div><strong lang="en" dir="ltr">'+c.e(scene.singular)+'</strong><span>'+c.e(scene.singularFa||'')+'</span></div>'+
      '<div class="count-visual-frame"><div class="count-picture-row">'+renderAmount(scene.pluralCount||2)+'</div><strong lang="en" dir="ltr">'+c.e(scene.plural)+'</strong><span>'+c.e(scene.pluralFa||'')+'</span></div>'+
      '</div></div>';
  }).join('');
  return wrapper('<p class="module-description">'+c.e(a.description||'')+'</p><div class="count-visual-grid">'+scenes+'</div>',a,c.index,c.e,'module-count-visual');
}
function pluralPairLab(a,c) {
  const key=c.lessonId+':'+a.id;
  const selected=(Number(c.progress.pluralChoices?.[key])||0)%(a.items?.length||1);
  const item=a.items[selected];
  if(!item)return wrapper('',a,c.index,c.e);
  const pictures=(count)=>Array.from({length:count},()=>countObjectSvg(item.shape,c.e)).join('');
  const noun=(form)=>'<button type="button" class="composer-token" data-plural-lab-key="'+c.e(key)+'" aria-label="اسم را عوض کن">'+c.e(item[form])+'</button>';
  return wrapper('<p class="module-description">'+c.e(a.description||'')+'</p>'+
    '<div class="plural-contrast"><div class="plural-contrast-cell"><div class="count-picture-row">'+pictures(1)+'</div><div class="live-count-phrase" lang="en" dir="ltr">one '+noun('singular')+'</div></div>'+
    '<div class="plural-contrast-cell"><div class="count-picture-row">'+pictures(2)+'</div><div class="live-count-phrase" lang="en" dir="ltr">two '+noun('plural')+'</div></div></div>'+
    '<p class="plural-contrast-note">'+c.e(item.note||'')+'</p><p class="live-hint">روی خود اسم در یکی از جمله‌ها بزن تا هر دو تصویر و شکل جمع تغییر کند.</p>',a,c.index,c.e,'module-plural-pair-lab');
}
function countMathLab(a,c) {
  const key=c.lessonId+':'+a.id;
  const choices=a.items||[];
  const idx=(Number(c.progress.mathChoices?.[key])||0)%Math.max(1,choices.length);
  const item=choices[idx];
  if(!item)return wrapper('',a,c.index,c.e);
  const minus=Boolean(c.progress.mathOps?.[key]);
  const singular=c.e(item.singular),plural=c.e(item.plural);
  const emoji=(num)=>'<div class="count-picture-row count-math-pictures">'+Array.from({length:num},()=>countObjectSvg(item.shape,c.e)).join('')+'</div>';
  const changeNoun='<button type="button" class="composer-token" data-count-math-key="'+c.e(key)+'" data-math-action="noun" aria-label="تغییر شیء">'+(minus?plural:singular)+'</button>';
  const resultNoun='<button type="button" class="composer-token" data-count-math-key="'+c.e(key)+'" data-math-action="noun" aria-label="تغییر شیء">'+(minus?singular:plural)+'</button>';
  const op='<button type="button" class="composer-token math-operator" data-count-math-key="'+c.e(key)+'" data-math-action="operator" aria-label="تغییر جمع و تفریق">'+(minus?'−':'+')+'</button>';
  const sentence=minus?'Two '+item.plural+' minus one '+item.singular+' equals one '+item.singular+'.':'One '+item.singular+' plus one '+item.singular+' equals two '+item.plural+'.';
  return wrapper('<p class="module-description">'+c.e(a.description||'')+'</p>'+
    '<div class="count-math-equation" lang="en" dir="ltr"><div>'+emoji(minus?2:1)+'<span>'+(minus?'two ':'one ')+changeNoun+'</span></div>'+
    op+'<div>'+emoji(1)+'<span>one '+singular+'</span></div><strong>=</strong>'+
    '<div>'+emoji(minus?1:2)+'<span>'+(minus?'one ':'two ')+resultNoun+'</span></div></div>'+
    '<div class="count-math-caption" dir="ltr" lang="en">'+c.e(sentence)+soundButton(sentence,c.e,c.i)+'</div>'+
    '<p class="live-hint">با لمس اسم، شیء تغییر می‌کند؛ با لمس + یا −، جمع و تفریق جابه‌جا می‌شوند.</p>',a,c.index,c.e,'module-count-math-lab');
}

function tapAttributesLab(a,c) {
  const key=`${c.lessonId}:${a.id}`;
  const selected=c.progress.attributeChoices?.[key] || {};
  const options=a.options || {};
  const pick=(field)=>options[field]?.[Math.max(0,Number(selected[field])||0)%options[field].length] || options[field]?.[0];
  if(a.mode==='count-color') {
    const count=pick('count'),color=pick('color');
    if(!count||!color)return wrapper('',a,c.index,c.e);
    const sentence=`There are ${count.en} ${color.en} balls.`;
    const visual=Array.from({length:count.number},()=>`<span class="tap-ball" style="background:${c.e(color.hex)}"></span>`).join('');
    const words=`There are <button data-attribute-key="${c.e(key)}" data-attribute-field="count" class="tap-word">${c.e(count.en)}</button> <button data-attribute-key="${c.e(key)}" data-attribute-field="color" class="tap-word">${c.e(color.en)}</button> balls.`;
    return wrapper(`<p class="module-description">${c.e(a.description||'')}</p><div class="tap-scene"><div class="tap-count-pictures" aria-label="${c.e(count.fa+' توپ '+color.fa)}">${visual}</div><p class="tap-live-sentence" lang="en" dir="ltr">${words}${soundButton(sentence,c.e,c.i)}</p><p>${c.e(count.fa+' توپ '+color.fa)}</p></div><p class="live-hint">روی عدد یا رنگ در خود جمله بزن تا تعداد و رنگ توپ‌های تصویر هم تغییر کند.</p>`,a,c.index,c.e,'module-tap-attributes');
  }
  if(a.mode==='progressive-features') {
    const object=pick('object'),color=pick('color'),size=pick('size');
    if(!object||!color||!size)return wrapper('',a,c.index,c.e);
    const stage=a.stage||'one',full=stage==='full',two=stage==='two';
    const eligibleShapes=(options.shape||[]).filter(item=>object.shapes?.includes(item.id));
    const eligibleMaterials=(options.material||[]).filter(item=>object.materials?.includes(item.id));
    const shape=eligibleShapes.find(item=>item.id===pick('shape')?.id)||eligibleShapes[0];
    const material=eligibleMaterials.find(item=>item.id===pick('material')?.id)||eligibleMaterials[0];
    const tok=(field,label)=>`<button type="button" class="tap-word" data-attribute-key="${c.e(key)}" data-attribute-field="${field}" aria-label="تغییر ${c.e(field)}">${c.e(label)}</button>`;
    const phrase=[full||two?tok('size',size.en):'',tok('color',color.en),full?tok('shape',shape.en):'',full?tok('material',material.en):'',tok('object',object.en)].filter(Boolean).join(' ');
    // Prefix a/an is fixed by the first adjective (all curated entries begin with consonants).
    const sentence=`This is a ${[full||two?size.en:null,color.en,full?shape.en:null,full?material.en:null,object.en].filter(Boolean).join(' ')}.`;
    const fa=[full||two?size.fa:null,color.fa,full?shape?.fa:null,full?material?.fa:null].filter(Boolean).join(' ');
    const label=`${object.fa} ${fa}`.trim();
    const patternId='attribute-'+c.index+'-'+object.id;
    const scale=size.id==='big'?1.04:.78;
    const stroke=color.id==='black'?'#151c28':'#3f4a55';
    const texture=material?.id==='wooden'?`<path d="M95 60q65 20 140-7M93 82q70 15 151-7M100 115q60 13 135-7M96 149q64 18 142-6" fill="none" stroke="#7a532e" stroke-width="4" opacity=".55"/>`:'';
    const glint=material?.id==='metal'?`<path d="M104 75L138 52L171 52L133 158" fill="#fff" opacity=".32"/>`:'';
    let drawing='';
    if(object.id==='ball')drawing=`<circle cx="170" cy="103" r="75" fill="${c.e(color.hex)}" stroke="${stroke}" stroke-width="3"/><ellipse cx="148" cy="70" rx="29" ry="15" fill="white" opacity=".25" transform="rotate(-34 148 70)"/>`;
    else if(object.id==='book')drawing=`<rect x="94" y="43" width="157" height="127" rx="5" fill="${c.e(color.hex)}" stroke="${stroke}" stroke-width="3"/><rect x="102" y="44" width="17" height="126" fill="#000" opacity=".15"/><path d="M127 53V157M136 55H239M136 158H239" stroke="white" opacity=".4" stroke-width="3"/>`;
    else if(object.id==='bag')drawing=`<path d="M97 73Q97 55 115 55H225Q245 55 245 73L257 166H83Z" fill="${c.e(color.hex)}" stroke="${stroke}" stroke-width="3"/><path d="M137 71V48C137 12 203 12 203 48V71" stroke="${stroke}" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M100 98H241" stroke="white" opacity=".25" stroke-width="5"/>`;
    else if(object.id==='bottle')drawing=`<rect x="150" y="24" width="40" height="31" rx="5" fill="#576579"/><path d="M142 56Q142 68 125 79L119 156Q118 177 140 177H200Q222 177 221 156L215 79Q198 68 198 56Z" fill="${c.e(color.hex)}" stroke="${stroke}" stroke-width="3"/><rect x="130" y="95" width="79" height="52" rx="5" fill="white" opacity=".2"/>`;
    else if(shape.id==='round')drawing=`<path d="M95 82V150A75 27 0 0 0 245 150V82Z" fill="${c.e(color.hex)}" stroke="${stroke}" stroke-width="3"/><ellipse cx="170" cy="82" rx="75" ry="27" fill="${c.e(color.hex)}" stroke="${stroke}" stroke-width="3"/><ellipse cx="170" cy="82" rx="57" ry="16" fill="white" opacity=".2"/>${texture}${glint}`;
    else {
      const width=shape.id==='rectangular'?198:150,x=170-width/2,y=shape.id==='rectangular'?71:45,h=shape.id==='rectangular'?89:126;
      drawing=`<rect x="${x}" y="${y}" width="${width}" height="${h}" rx="4" fill="${c.e(color.hex)}" stroke="${stroke}" stroke-width="3"/><path d="M${x} ${y}l23 -17h${width}l-23 17M${x+width} ${y}l23 -17v${h}" stroke="${stroke}" stroke-width="3" fill="${c.e(color.hex)}"/>${texture}${glint}`;
    }
    const svg=`<svg viewBox="0 0 340 215" role="img" aria-label="${c.e(label)}" class="attribute-illustration"><title>${c.e(label)}</title><ellipse cx="170" cy="194" rx="104" ry="12" fill="#101b29" opacity=".1"/><g transform="translate(170 100) scale(${scale}) translate(-170 -100)">${drawing}</g></svg>`;
    const instruction=stage==='one'?'اول با یک صفت و اسم جمله بساز.':stage==='two'?'دو صفت: اندازه، رنگ، سپس اسم.':'اسم و جنس و شکل هم تغییر می‌کنند. برای هر شیء فقط ترکیب‌های واقعی نشان داده می‌شوند.';
    return wrapper(`<p class="module-description">${c.e(a.description||'')}</p><div class="tap-scene">${svg}<p class="tap-live-sentence" lang="en" dir="ltr">This is a ${phrase}.${soundButton(sentence,c.e,c.i)}</p><p class="tap-live-translation">${c.e('این یک '+label+' است.')}</p></div><p class="live-hint">${c.e(instruction)} روی کلمه‌های رنگی جمله لمس کن.</p>`,a,c.index,c.e,'module-tap-attributes');
  }
  const size=pick('size'),shape=pick('shape'),material=pick('material');
  if(!size||!shape||!material)return wrapper('',a,c.index,c.e);
  const sentence=`This is a ${size.en} ${shape.en} ${material.en} box.`;
  const shapeRadius=shape.id==='round'?'50%':shape.id==='rectangular'?'16%':'4%';
  const width=shape.id==='rectangular'?190:shape.id==='round'?145:155;
  const height=shape.id==='rectangular'?100:145;
  const scale=size.id==='big'?1.08:.72;
  const texture=material.id==='wooden'?'repeating-linear-gradient(105deg,#c99658 0px,#c99658 13px,#aa7845 15px,#d6aa73 25px)':material.id==='metal'?'linear-gradient(130deg,#6d859c,#ecf2f7 44%,#8798ad 76%,#53677e)':'linear-gradient(130deg,#48a8d1,#acdfee,#2489b7)';
  const words=`This is a <button data-attribute-key="${c.e(key)}" data-attribute-field="size" class="tap-word">${c.e(size.en)}</button> <button data-attribute-key="${c.e(key)}" data-attribute-field="shape" class="tap-word">${c.e(shape.en)}</button> <button data-attribute-key="${c.e(key)}" data-attribute-field="material" class="tap-word">${c.e(material.en)}</button> box.`;
  return wrapper(`<p class="module-description">${c.e(a.description||'')}</p><div class="tap-scene"><div class="tap-object-stage"><div class="tap-object" role="img" aria-label="${c.e(size.fa+' '+shape.fa+' '+material.fa+' جعبه')}" style="width:${width}px;height:${height}px;border-radius:${shapeRadius};transform:scale(${scale});background:${texture}"></div></div><p class="tap-live-sentence" lang="en" dir="ltr">${words}${soundButton(sentence,c.e,c.i)}</p><p>${c.e('این یک جعبهٔ '+size.fa+' '+shape.fa+' '+material.fa+' است.')}</p></div><p class="live-hint">برای مقایسه، کلمات اندازه، شکل و جنس را مستقیماً در جمله لمس کن؛ تصویر همان لحظه تغییر می‌کند.</p>`,a,c.index,c.e,'module-tap-attributes');
}

function tapOwnershipLab(a,c){
  const key=`${c.lessonId}:${a.id}`;
  const selected=c.progress.attributeChoices?.[key]||{};
  const get=field=>a.options[field]?.[(Number(selected[field])||0)%a.options[field].length];
  const who=get('subject'),amount=get('count'),noun=get('noun'),form=get('form');
  if(!who||!amount||!noun||!form)return wrapper('',a,c.index,c.e);
  const plural=amount.number>1,word=plural?noun.plural:noun.en;
  const number=plural?amount.en:'a';
  const possessive=plural?`These are my ${word}.`:`This is my ${word}.`;
  const verb=who.id==='she'?'has':'have',negation=who.id==='she'?"doesn't have":"don't have";
  const query=who.id==='she'?'Does she have':who.id==='you'?'Do you have':'Do I have';
  const action=form.id==='have'?`${who.en} ${verb}`:form.id==='not-have'?`${who.en} ${negation}`:query;
  const sentence=form.id==='belongs'?possessive:`${action} ${number} ${word}${form.id==='question'?'?':'.'}`;
  const tok=(field,value)=>`<button type="button" class="tap-word" data-attribute-key="${c.e(key)}" data-attribute-field="${field}">${c.e(value)}</button>`;
  const sentenceMarkup=form.id==='belongs'?`${tok('form',plural?'These are my':'This is my')} ${tok('noun',word)}.`:form.id==='question'?`${tok('form',query)} ${tok('count',number)} ${tok('noun',word)}?`:`${tok('subject',who.en)} ${tok('form',action.replace(who.en+' ',''))} ${tok('count',number)} ${tok('noun',word)}.`;
  const translation=form.id==='belongs'?`${noun.fa} ${plural?'ها':' '} مال من ${plural?'هستند':'است'}.`:`${who.fa} ${amount.fa} ${noun.fa} ${form.id==='not-have'?'ندارد':form.id==='question'?'دارد؟':'دارد'}`;
  return wrapper(`<p class="module-description">${c.e(a.description||'')}</p><div class="tap-scene"><p class="tap-live-sentence" lang="en" dir="ltr">${sentenceMarkup}${soundButton(sentence,c.e,c.i)}</p><p class="tap-live-translation">${c.e(translation)}</p></div><p class="live-hint">روی کلمات جمله بزن. مقایسه کن «This is my bag» با «I have a bag»؛ و سپس عدد و نام را به خواهر و برادر تغییر بده.</p>`,a,c.index,c.e,'module-tap-attributes');
}

const renderers = {
  intro, vocabulary, pattern, match, 'sentence-builder': sentenceBuilder,
  'quiz-set': quizSet, dialogue, roleplay, 'free-write': freeWrite,
  'phrase-composer': phraseComposer, 'pattern-lab': patternLab, 'sentence-lab': sentenceLab,
  'guided-dialogue': guidedDialogue, 'response-practice': responsePractice,
  'exchange-lab': exchangeLab, 'expression-study': expressionStudy, 'count-visual': countVisual, 'plural-pair-lab': pluralPairLab, 'count-math-lab': countMathLab,
  shadowing, 'shadowing-review': shadowing, 'picture-description': pictureDescription,
  'sentence-transform': sentenceTransform, 'dialogue-transfer': dialogueTransfer,
  'family-tree': familyTree, 'family-lab': familyLab, 'spatial-lab': spatialLab, 'meaning-cluster': meaningCluster, 'agreement-lab': agreementLab, 'sentence-composer': sentenceComposer, 'composer-view': sentenceComposer, 'tap-attributes-lab': tapAttributesLab, 'tap-ownership-lab': tapOwnershipLab
};
export function renderActivity(activity, context) {
  const renderer = renderers[activity.type];
  if (!renderer) throw new Error(`Unknown lesson activity: ${activity.type}`);
  return renderer(activity, context);
}
export const supportedActivities = Object.freeze(Object.keys(renderers));
