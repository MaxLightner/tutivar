/* Reusable vocabulary deck state machine. Every item comes from lesson JSON. */
export const wordId = (entry) => String(entry.id || entry.en).trim();
export const coreItems = (activity) => activity.items.filter((entry) => entry.role !== 'supplementary');
export const supplementaryItems = (activity) => activity.items.filter((entry) => entry.role === 'supplementary');
export const normalizeAnswer = (answer) => String(answer || '')
  .normalize('NFKC').toLowerCase().replace(/[’‘`]/g, "'")
  .replace(/\bi\s+am\b/g, "i'm")
  .replace(/[^\p{L}\p{N}' ]/gu, ' ').replace(/\s+/g, ' ').trim();

export function checkWordAnswer(entry, answer) {
  const expected = [entry.en, ...(entry.testAnswers || [])];
  return expected.some((candidate) => normalizeAnswer(candidate) === normalizeAnswer(answer));
}

export function deckState(saved, activity) {
  const items = coreItems(activity);
  const ids = new Set(items.map(wordId));
  const revision = activity.deckRevision || 1;
  if (!saved || saved.revision !== revision) return { revision, phase: 'browse', index: 0, decisions: {}, queue: [], failed: {} };
  const decisions = Object.fromEntries(Object.entries(saved.decisions || {}).filter(([id]) => ids.has(id)));
  const queue = [...new Set((saved.queue || []).filter((id) => ids.has(id) && decisions[id] === 'test'))];
  const phase = ['browse', 'test', 'retry', 'done'].includes(saved.phase) ? saved.phase : 'browse';
  const index = Math.min(Math.max(0, Number(saved.index) || 0), Math.max(0, items.length - 1));
  return { revision, phase: (phase === 'test' || phase === 'retry') && !queue.length ? 'done' : phase, index, decisions, queue, failed: saved.failed || {}, lastWrong: saved.lastWrong || null };
}

export function advanceDeck(saved, activity, decision = null) {
  const state = deckState(saved, activity);
  const items = coreItems(activity);
  if (state.phase !== 'browse' || !items.length) return state;
  const id = wordId(items[state.index]);
  if (decision === 'known' || decision === 'test') {
    state.decisions[id] = decision;
    state.queue = state.queue.filter((item) => item !== id);
    if (decision === 'test') state.queue.push(id);
  }
  if (state.index + 1 < items.length) state.index++;
  else if (state.queue.length) state.phase = 'test';
  else if (decision === 'known' || decision === 'test') state.phase = 'done';
  // Browsing is not a test: reaching the last card must not imply mastery.
  else state.index = Math.max(0, items.length - 1);
  return state;
}

export function jumpDeck(saved, activity, index) {
  const state = deckState(saved, activity);
  if (state.phase !== 'browse') return state;
  state.index = Math.min(Math.max(0, Math.round(Number(index) || 0)), Math.max(0, coreItems(activity).length - 1));
  return state;
}

export function startDeckTest(saved, activity) {
  const state = deckState(saved, activity);
  const items = coreItems(activity);
  if (!items.length) return { ...state, phase: 'done', queue: [] };
  state.decisions = Object.fromEntries(items.map((item) => [wordId(item), 'test']));
  state.queue = items.map(wordId);
  state.failed = {};
  state.lastWrong = null;
  state.phase = 'test';
  return state;
}

export function answerDeck(saved, activity, answer) {
  const state = deckState(saved, activity);
  if (state.phase !== 'test' || !state.queue.length) return { state, correct: null, entry: null };
  const id = state.queue[0];
  const entry = coreItems(activity).find((item) => wordId(item) === id);
  const correct = checkWordAnswer(entry, answer);
  if (correct) {
    state.queue.shift();
    state.phase = state.queue.length ? 'test' : 'done';
  } else {
    state.failed[id] = (state.failed[id] || 0) + 1;
    state.lastWrong = { id, answer: String(answer).trim() };
    state.queue.push(state.queue.shift());
    state.phase = 'retry';
  }
  return { state, correct, entry };
}

export function resumeDeck(saved, activity, skipFailed = false) {
  const state = deckState(saved, activity);
  if (state.phase !== 'retry') return state;
  if (skipFailed && state.lastWrong) state.queue = state.queue.filter((id) => id !== state.lastWrong.id);
  state.phase = state.queue.length ? 'test' : 'done';
  state.lastWrong = null;
  return state;
}
