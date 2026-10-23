import { coreItems, deckState, supplementaryItems, wordId } from './word-review.js';

/*
 * Tutivar's teaching components. Lesson text, exercise items, answers and their
 * sequence are supplied by language-pair JSON files, never embedded here.
 */
const MODULE_LABELS = {
  intro: 'موقعیت', vocabulary: 'واژه‌ها', pattern: 'ساختار', match: 'تطبیق',
  'sentence-builder': 'جمله‌سازی', 'quiz-set': 'آزمون', dialogue: 'گفت‌وگو',
  roleplay: 'مکالمه', 'free-write': 'تولید مستقل',
  'phrase-composer': 'ترکیب واژه‌ها', 'sentence-lab': 'جمله‌ساز پویا',
  'guided-dialogue': 'تمرین مکالمه'
};
function wrapper(body, activity, idx, e, extra = '') {
  return `<div class="lesson-block module-block ${extra}" data-module="${e(activity.type)}"><div class="block-top"><div><span class="block-label">${String(idx + 1).padStart(2, '0')} / ${e(activity.typeLabel || MODULE_LABELS[activity.type] || 'فعالیت')}</span><h3>${e(activity.title || '')}</h3></div></div>${body}</div>`;
}
function soundButton(text, e, i) {
  return `<button class="sound-btn" data-speak="${e(text)}" aria-label="شنیدن تلفظ ${e(text)}">${i('sound')}</button>`;
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
  const optional = optionalItems.length ? `<details class="vocab-supplementary"><summary><span><strong>عبارت‌های تکمیلی</strong><small>${optionalItems.length} عبارت برای یادگیری بیشتر · اختیاری</small></span><span class="supplementary-toggle">نمایش / بستن</span></summary><div class="supplementary-list">${optionalItems.map((item) => `<div class="supplementary-card"><div class="supplementary-main"><div><strong>${c.en(item.en)}</strong><p>${c.e(item.fa)}</p>${item.hint ? `<span class="word-hint">${c.e(item.hint)}</span>` : ''}</div>${soundButton(item.en, c.e, c.i)}</div>${item.examples?.length ? `<details class="supplementary-examples"><summary>سه مثال کاربردی</summary><div class="word-examples">${item.examples.map((line, index) => `<div class="word-example-line"><span class="example-number">${index + 1}</span>${c.en(line)}${soundButton(line, c.e, c.i)}</div>`).join('')}</div></details>` : ''}</div>`).join('')}</div></details>` : '';
  const render = (body) => wrapper(`${body}${optional}`, a, c.index, c.e, 'module-vocabulary');
  const learned = Object.values(state.decisions).filter((value) => value === 'known').length;
  const tested = Object.values(state.decisions).filter((value) => value === 'test').length;
  if (!total || state.phase === 'done') {
    const difficult = Object.keys(state.failed).length;
    return render(`<div class="vocab-finished">${c.i('check')} مرور واژه‌های اصلی تمام شد. ${difficult ? `${difficult} مورد دشوار به لایتنر اصلی اضافه شد.` : ''}<button class="outline-btn" data-word-key="${c.e(key)}" data-word-action="restart">مرور دوباره</button></div>`);
  }
  if (state.phase === 'test') {
    const entry = items.find((item) => wordId(item) === state.queue[0]);
    return render(`<div class="vocab-deck-top"><span>مینی‌لایتنر · ${state.queue.length} کارت در صف آزمون</span><strong>${tested} انتخاب‌شده برای آزمون</strong></div><div class="word-test-card"><span class="word-test-label">معادل انگلیسی را بنویس</span><div class="word-test-question">${c.e(entry.testPrompt || entry.fa)}</div>${entry.testHint ? `<p class="word-hint">${c.e(entry.testHint)}</p>` : ''}<form class="word-test-form" data-word-form="${c.e(key)}"><input data-word-answer="${c.e(key)}" type="text" lang="en" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="معادل انگلیسی ${c.e(entry.fa)}" placeholder="به انگلیسی بنویس…" required><button class="secondary-btn" type="submit">بررسی پاسخ</button></form><p class="word-test-help">پاسخ درست این کارت را از صف حذف می‌کند؛ پاسخ اشتباه آن را برای مرور برمی‌گرداند.</p></div>`);
  }
  const entry = state.phase === 'retry' ? items.find((item) => wordId(item) === state.lastWrong?.id) : items[state.index];
  const index = state.index;
  const batchSize = Math.max(1, a.batchSize || 5);
  const batch = Math.floor(index / batchSize) + 1;
  const batches = Math.ceil(total / batchSize);
  const examples = (entry.examples?.length ? entry.examples : entry.example ? [entry.example] : []).map((line, i) => `<div class="word-example-line"><span class="example-number">${i + 1}</span>${c.en(line)}${soundButton(line, c.e, c.i)}</div>`).join('');
  if (state.phase === 'retry') {
    return render(`<div class="word-test-alert">این یکی هنوز نیاز به مرور دارد. پاسخ درست: ${c.en(entry.en)}</div><div class="vocab-focus-card"><div class="word-focus-title">${c.en(entry.en)}${soundButton(entry.en, c.e, c.i)}</div><div class="word-focus-meaning">${c.e(entry.fa)}</div><div class="word-examples">${examples}</div></div><div class="vocab-deck-actions"><button class="outline-btn" data-word-key="${c.e(key)}" data-word-action="skip-failed">فعلاً در لایتنر اصلی بماند</button><button class="secondary-btn" data-word-key="${c.e(key)}" data-word-action="resume">دوباره امتحانم کن</button></div>`);
  }
  const decisions = items.slice(0, index + 1).filter((item) => state.decisions[wordId(item)]).length;
  const slider = `<div class="vocab-navigation"><div class="vocab-range-label"><strong>مرور آزاد کلمات</strong><span>${index + 1} / ${total} · دسته ${batch} از ${batches}</span></div><div class="vocab-scrubber"><button type="button" class="word-nav-btn" data-word-key="${c.e(key)}" data-word-action="prev" ${index === 0 ? 'disabled' : ''} aria-label="کلمه قبلی">‹</button><input type="range" data-word-slider="${c.e(key)}" min="1" max="${total}" step="1" value="${index + 1}" aria-label="جابه‌جایی بین ${total} کلمه"><button type="button" class="word-nav-btn" data-word-key="${c.e(key)}" data-word-action="next" aria-label="کلمه بعدی یا پایان مرور">›</button></div><p>دستگیره را بکش یا کارت را ورق بزن؛ لازم نیست همهٔ کلمات را جداگانه تأیید کنی.</p></div>`;
  return render(`<div class="vocab-deck-top"><span>کارت ${index + 1} از ${total}</span><strong>${learned} بلدم · ${tested} امتحانم کن</strong></div><div class="vocab-deck-bar"><span style="width:${total ? (decisions / total) * 100 : 0}%"></span></div><div class="vocab-focus-card" data-word-swipe="${c.e(key)}" tabindex="0" aria-label="کارت واژه؛ برای جابه‌جایی از کلیدهای جهت‌نما استفاده کن"><div class="word-focus-title">${c.en(entry.en)}${soundButton(entry.en, c.e, c.i)}</div><div class="word-focus-meaning">${c.e(entry.fa)}</div>${entry.hint ? `<p class="word-hint">${c.e(entry.hint)}</p>` : ''}<div class="word-examples">${examples}</div></div><div class="vocab-deck-actions"><button class="outline-btn" data-word-key="${c.e(key)}" data-word-action="test">امتحانم کن</button><button class="secondary-btn" data-word-key="${c.e(key)}" data-word-action="known">اینو بلدم ${c.i('check')}</button></div>${slider}`);
}
function phraseComposer(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const selected = c.progress.phraseChoices?.[key] || a.slots.map(() => 0);
  const slots = a.slots.map((slot, slotIndex) => `<div class="phrase-slot"><span>${c.e(slot.label)}</span><div class="phrase-options">${slot.options.map((option, optionIndex) => `<button class="phrase-option ${selected[slotIndex] === optionIndex ? 'active' : ''}" data-phrase-key="${c.e(key)}" data-phrase-slot="${slotIndex}" data-phrase-option="${optionIndex}">${c.en(option)}</button>`).join('')}</div></div>`).join('');
  const outcome = a.outcomes.find((entry) => entry.selection.every((choice, index) => choice === (selected[index] || 0)));
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="phrase-composer">${slots}</div>${outcome ? `<div class="phrase-outcome">${c.en(outcome.en)}${soundButton(outcome.en, c.e, c.i)}<span dir="rtl">${c.e(outcome.fa)}</span></div>` : ''}`, a, c.index, c.e, 'module-phrase');
}
function sentenceLab(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const state = c.progress.sentenceLabs?.[key] || { structure: 0, variable: 0 };
  const structure = a.structures[state.structure] || a.structures[0];
  const variable = a.variables[state.variable] || a.variables[0];
  const result = `${structure.before || ''}${variable}${structure.after || ''}`;
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p><div class="lab-switches"><div class="lab-selector"><strong>${c.e(a.structureLabel || 'چطور بگویی؟')}</strong><div>${a.structures.map((item, index) => `<button class="lab-option ${index === state.structure ? 'active' : ''}" data-lab-key="${c.e(key)}" data-lab-kind="structure" data-lab-index="${index}">${c.en(item.label)}</button>`).join('')}</div></div><div class="lab-selector"><strong>${c.e(a.variableLabel || 'چه کسی؟')}</strong><div>${a.variables.map((item, index) => `<button class="lab-option ${index === state.variable ? 'active' : ''}" data-lab-key="${c.e(key)}" data-lab-kind="variable" data-lab-index="${index}">${c.en(item)}</button>`).join('')}</div></div></div><div class="lab-sentence">${c.en(result)}${soundButton(result, c.e, c.i)}</div>${structure.note ? `<p class="lab-note">${c.e(structure.note)}</p>` : ''}`, a, c.index, c.e, 'module-sentence-lab');
}
function guidedDialogue(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const answers = c.progress.guidedAnswers?.[key] || [];
  const turn = a.turns[answers.length];
  const history = answers.map((answer, index) => `<div class="guided-history"><span>${c.e(a.turns[index].speaker)}: ${c.en(a.turns[index].incoming)}</span><strong>پاسخ تو: ${c.en(answer)}</strong><span>یک پاسخ ممکن: ${c.en(a.turns[index].example)}</span></div>`).join('');
  return wrapper(`<p class="module-description">${c.e(a.description || '')}</p>${history}${turn ? `<div class="guided-prompt"><strong>${c.e(turn.speaker)}</strong><div>${c.en(turn.incoming)}${soundButton(turn.incoming, c.e, c.i)}</div></div><label class="input-label" for="guided-response">${c.e(turn.task)}</label><input id="guided-response" class="guided-response" lang="en" dir="ltr" autocomplete="off" placeholder="پاسخ خودت را بنویس…"><details class="guided-hint"><summary>راهنمایی می‌خواهم</summary>${c.en(turn.hint)}</details><button class="secondary-btn" data-guided-send="${c.e(key)}">ارسال پاسخ</button>` : `<div class="module-result success">دو نوبت گفت‌وگو را با پاسخ خودت ساختی.</div>`}`, a, c.index, c.e, 'module-guided-dialogue');
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
function dialogue(a, c) {
  return wrapper(`<div class="module-tools"><button class="outline-btn" data-action="toggle-translations">${c.progress.showDialogueTranslation ? 'پنهان‌کردن ترجمه' : 'نمایش ترجمه'}</button></div><div class="dialogue">${a.lines.map((line) => `<div class="dialogue-line"><span class="speaker-avatar">${c.e(line.speaker.slice(0, 1))}</span><div class="bubble"><strong class="speaker-name">${c.e(line.speaker)}</strong><div class="spoken-line">${c.en(line.en)}${soundButton(line.en, c.e, c.i)}</div>${c.progress.showDialogueTranslation ? `<p>${c.e(line.fa)}</p>` : ''}</div></div>`).join('')}</div>`, a, c.index, c.e);
}
function roleplay(a, c) {
  const key = `${c.lessonId}:${a.id}`;
  const answers = c.progress.roleplayAnswers[key] || [];
  const index = answers.length;
  const turn = a.turns[index];
  const history = answers.map((answer, i) => `<div class="role-turn"><div class="role-speaker">${c.e(a.turns[i].speaker)}: ${c.en(a.turns[i].prompt)}</div><div class="role-user">${c.en(a.turns[i].choices[answer])}</div></div>`).join('');
  return wrapper(`<p class="module-description">${c.e(a.description)}</p><div class="roleplay-progress">${a.turns.map((_, i) => `<span class="${i < index ? 'filled' : ''}"></span>`).join('')}</div><div class="roleplay-history">${history}</div>${turn ? `<div class="role-speaker"><strong>${c.e(turn.speaker)}</strong><div>${c.en(turn.prompt)} ${soundButton(turn.prompt, c.e, c.i)}</div></div><div class="choices">${turn.choices.map((choice, i) => `<button class="choice" data-roleplay="${c.e(key)}" data-role-choice="${i}">${c.en(choice)}</button>`).join('')}</div>` : `<div class="module-result success">✓ گفت‌وگو را تا آخر پیش بردی!<p>${c.en(a.turns.at(-1).reply)}</p></div>`}`, a, c.index, c.e, 'module-roleplay');
}
function freeWrite(a, c) {
  const stored = c.progress.written[c.lessonId] || '';
  return wrapper(`<label class="input-label" for="free-response">${c.e(a.prompt)}</label><textarea class="free-input" id="free-response" placeholder="${c.e(a.placeholder)}" rows="3">${c.e(stored)}</textarea><p class="hint">${c.e(a.hint)}</p><button class="secondary-btn" data-action="save-production">ذخیره پاسخ ${c.i('check')}</button>`, a, c.index, c.e);
}
const renderers = {
  intro, vocabulary, pattern, match, 'sentence-builder': sentenceBuilder,
  'quiz-set': quizSet, dialogue, roleplay, 'free-write': freeWrite,
  'phrase-composer': phraseComposer, 'sentence-lab': sentenceLab,
  'guided-dialogue': guidedDialogue
};
export function renderActivity(activity, context) {
  const renderer = renderers[activity.type];
  if (!renderer) throw new Error(`Unknown lesson activity: ${activity.type}`);
  return renderer(activity, context);
}
export const supportedActivities = Object.freeze(Object.keys(renderers));
