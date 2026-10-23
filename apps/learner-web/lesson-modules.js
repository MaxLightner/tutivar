/*
 * Tutivar's teaching components. Lesson text, exercise items, answers and their
 * sequence are supplied by language-pair JSON files, never embedded here.
 */
function wrapper(body, activity, idx, e, extra = '') {
  return `<div class="lesson-block module-block ${extra}" data-module="${e(activity.type)}"><div class="block-top"><div><span class="block-label">${String(idx + 1).padStart(2, '0')} / ${e(activity.typeLabel || 'تمرین')}</span><h3>${e(activity.title || '')}</h3></div></div>${body}</div>`;
}
function soundButton(text, e, i) {
  return `<button class="sound-btn" data-speak="${e(text)}" aria-label="شنیدن تلفظ ${e(text)}">${i('sound')}</button>`;
}
function intro(a, c) {
  return wrapper(`<p class="module-intro-text">${c.e(a.text)}</p><div class="module-intro-focus">${c.en(a.focus)}${soundButton(a.focus, c.e, c.i)}</div>`, a, c.index, c.e, 'module-intro');
}
function vocabulary(a, c) {
  const cards = a.items.map((entry) => `<div class="word-card"><div><div class="word-primary">${c.en(entry.en)}</div><p>${c.e(entry.fa)}</p>${entry.hint ? `<span class="word-hint">${c.e(entry.hint)}</span>` : ''}${entry.example ? `<div class="word-example">${c.en(entry.example)}</div>` : ''}</div>${soundButton(entry.en, c.e, c.i)}</div>`).join('');
  return wrapper(`<div class="vocab-grid">${cards}</div>`, a, c.index, c.e);
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
  'quiz-set': quizSet, dialogue, roleplay, 'free-write': freeWrite
};
export function renderActivity(activity, context) {
  const renderer = renderers[activity.type];
  if (!renderer) throw new Error(`Unknown lesson activity: ${activity.type}`);
  return renderer(activity, context);
}
export const supportedActivities = Object.freeze(Object.keys(renderers));
