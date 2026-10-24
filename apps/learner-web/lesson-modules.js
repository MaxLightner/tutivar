import { coreItems, deckState, supplementaryItems, wordId } from './word-review.js';
import { practiceState } from './practice-engine.js';

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
  'family-tree': 'درخت خانواده',
  'agreement-lab': 'جمله‌ساز وابسته'
};
function wrapper(body, activity, idx, e, extra = '') {
  return `<div class="lesson-block module-block ${extra}" data-module="${e(activity.type)}"><div class="block-top"><div><span class="block-label">${String(idx + 1).padStart(2, '0')} / ${e(activity.typeLabel || MODULE_LABELS[activity.type] || 'فعالیت')}</span><h3>${e(activity.title || '')}</h3></div></div>${body}</div>`;
}
function soundButton(text, e, i) {
  return `<button class="sound-btn" data-speak="${e(text)}" aria-label="شنیدن تلفظ ${e(text)}">${i('sound')}</button>`;
}
function exampleFocus(line, entry, c) {
  const phrase = entry.en.replace(/[?!.,]/g, '').trim();
  const firstWords = phrase.split(/\s+/).slice(0, 2).join(' ');
  const start = line.toLowerCase().indexOf(phrase.toLowerCase());
  const fallback = start < 0 ? line.toLowerCase().indexOf(firstWords.toLowerCase()) : start;
  const matched = start >= 0 ? phrase : firstWords;
  if (fallback < 0) return c.en(line);
  return `<span class="en" lang="en" dir="ltr">${c.e(line.slice(0, fallback))}<mark class="example-target">${c.e(line.slice(fallback, fallback + matched.length))}</mark>${c.e(line.slice(fallback + matched.length))}</span>`;
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
  const optional = optionalItems.length ? `<details class="vocab-supplementary"><summary><span><strong>عبارت‌های تکمیلی</strong><small>${optionalItems.length} عبارت برای آشنایی بیشتر · اختیاری</small></span><span class="supplementary-toggle">نمایش / بستن</span></summary><ul class="supplementary-list" aria-label="فهرست عبارت‌های تکمیلی">${optionalItems.map((item) => `<li class="supplementary-item"><span class="supplementary-en" lang="en" dir="ltr">${c.en(item.en)}</span><span class="supplementary-fa" dir="rtl">${c.e(item.fa)}</span></li>`).join('')}</ul></details>` : '';
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
  const examples = exampleGallery(entry, c);
  if (state.phase === 'retry') {
    return render(`<div class="word-test-alert">این یکی هنوز نیاز به مرور دارد. پاسخ درست: ${c.en(entry.en)}</div><div class="vocab-focus-card"><div class="word-focus-title">${c.en(entry.en)}${soundButton(entry.en, c.e, c.i)}</div><div class="word-focus-meaning">${c.e(entry.fa)}</div>${examples}</div><div class="vocab-deck-actions"><button class="outline-btn" data-word-key="${c.e(key)}" data-word-action="skip-failed">فعلاً در لایتنر اصلی بماند</button><button class="secondary-btn" data-word-key="${c.e(key)}" data-word-action="resume">دوباره امتحانم کن</button></div>`);
  }
  const decisions = items.slice(0, index + 1).filter((item) => state.decisions[wordId(item)]).length;
  const slider = `<div class="vocab-navigation"><div class="vocab-range-label"><strong>مرور آزاد کلمات</strong><span>${index + 1} / ${total} · دسته ${batch} از ${batches}</span></div><div class="vocab-scrubber"><button type="button" class="word-nav-btn" data-word-key="${c.e(key)}" data-word-action="prev" ${index === 0 ? 'disabled' : ''} aria-label="کلمه قبلی">‹</button><input type="range" data-word-slider="${c.e(key)}" min="1" max="${total}" step="1" value="${index + 1}" aria-label="جابه‌جایی بین ${total} کلمه"><button type="button" class="word-nav-btn" data-word-key="${c.e(key)}" data-word-action="next" aria-label="کلمه بعدی یا پایان مرور">›</button></div><p>دستگیره را بکش یا کارت را ورق بزن؛ لازم نیست همهٔ کلمات را جداگانه تأیید کنی.</p></div>`;
  return render(`<div class="vocab-deck-top"><span>کارت ${index + 1} از ${total}</span><strong>${learned} بلدم · ${tested} امتحانم کن</strong></div><div class="vocab-deck-bar"><span style="width:${total ? (decisions / total) * 100 : 0}%"></span></div><div class="vocab-focus-card" data-word-swipe="${c.e(key)}" tabindex="0" aria-label="کارت واژه؛ برای جابه‌جایی از کلیدهای جهت‌نما استفاده کن"><div class="word-focus-title">${c.en(entry.en)}${soundButton(entry.en, c.e, c.i)}</div><div class="word-focus-meaning">${c.e(entry.fa)}</div>${entry.hint ? `<p class="word-hint">${c.e(entry.hint)}</p>` : ''}${examples}</div><div class="vocab-deck-actions"><button class="outline-btn" data-word-key="${c.e(key)}" data-word-action="test">امتحانم کن</button><button class="secondary-btn" data-word-key="${c.e(key)}" data-word-action="known">اینو بلدم ${c.i('check')}</button></div>${slider}`);
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
export function renderDialogueLines(a, c, step, enteringIndex = -1, { all = false } = {}) {
  const speakers = [...new Set(a.lines.map((line) => line.speaker))];
  const entries = all ? a.lines.map((line, index) => ({ line, lineIndex: index })) : a.lines.slice(step, step + 2).map((line, index) => ({ line, lineIndex: step + index }));
  return entries.map(({ line, lineIndex }) => {
    const side = speakers.indexOf(line.speaker) % 2 === 0 ? 'speaker-first' : 'speaker-second';
    const shown = lineIndex >= step && lineIndex < step + 2;
    const entering = !all && (enteringIndex === -1 || lineIndex === enteringIndex) ? 'dialogue-entering' : '';
    return `<div class="dialogue-line ${side} ${entering}" data-dialogue-line="${lineIndex}" data-dialogue-visible="${shown}" ${all && !shown ? 'aria-hidden="true" inert' : ''}><span class="speaker-avatar" aria-hidden="true">${c.e(line.speaker.slice(0, 1))}</span><div class="bubble"><strong class="speaker-name">${c.e(line.speaker)}</strong><div class="spoken-line"><button type="button" class="dialogue-sentence" data-speak="${c.e(line.en)}" aria-label="شنیدن جملهٔ ${c.e(line.speaker)}">${c.en(line.en)}</button></div>${c.progress.showDialogueTranslation ? `<p>${c.e(line.fa)}</p>` : ''}</div></div>`;
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
function freeWrite(a, c) {
  const stored = c.progress.written[c.lessonId] || '';
  const key = `${c.lessonId}:${a.id}`;
  const feedback = c.progress.assessments?.[key];
  const status = feedback ? `<div class="practice-feedback ${feedback.passed ? 'success' : 'error'}" role="status"><strong>${c.e(feedback.feedback)}</strong>${feedback.repair ? `<p>${c.e(feedback.repair)}</p>` : ''}${feedback.passed ? '<span>✓ نشانهٔ یادگیری این بخش ثبت شد.</span>' : '<span>متنت باقی می‌ماند؛ می‌توانی همان را اصلاح کنی.</span>'}</div>` : '';
  return wrapper(`<label class="input-label" for="free-response">${c.e(a.prompt)}</label><textarea class="free-input" id="free-response" lang="en" dir="ltr" placeholder="${c.e(a.placeholder)}" rows="3">${c.e(stored)}</textarea><p class="hint">${c.e(a.hint)}</p><button class="secondary-btn" data-action="save-production">${a.assessment ? 'بررسی گفت‌وگوی من' : 'ذخیره پاسخ'} ${c.i('check')}</button>${status}${a.assessment ? '<p class="practice-caveat">بازخورد بر اساس ساختارهای مشخص همین درس است؛ تصحیح آزادِ همهٔ جمله‌های انگلیسی نیست.</p>' : ''}`, a, c.index, c.e);
}
const renderers = {
  intro, vocabulary, pattern, match, 'sentence-builder': sentenceBuilder,
  'quiz-set': quizSet, dialogue, roleplay, 'free-write': freeWrite,
  'phrase-composer': phraseComposer, 'pattern-lab': patternLab, 'sentence-lab': sentenceLab,
  'guided-dialogue': guidedDialogue, 'response-practice': responsePractice,
  'exchange-lab': exchangeLab,
  'sentence-transform': sentenceTransform, 'dialogue-transfer': dialogueTransfer,
  'family-tree': familyTree, 'agreement-lab': agreementLab
};
export function renderActivity(activity, context) {
  const renderer = renderers[activity.type];
  if (!renderer) throw new Error(`Unknown lesson activity: ${activity.type}`);
  return renderer(activity, context);
}
export const supportedActivities = Object.freeze(Object.keys(renderers));
