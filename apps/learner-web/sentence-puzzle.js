/**
 * Reusable multi-sentence word puzzle.
 * The mixed bank is derived from all JSON-authored valid sentences. Learners
 * discover each sentence in any order; accepted words leave the bank.
 */
function stableSeed(input) {
  let hash = 2166136261;
  for (const character of String(input)) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  return hash || 1;
}

export function puzzleTokenBank(activity) {
  const words = (activity.sentences || []).flatMap((sentence) => sentence.words || []);
  const bank = [...words, ...(activity.extraWords || [])].map((word, index) => ({ word, index }));
  let seed = stableSeed(activity.id + ':' + (activity.revision || 1));
  for (let i = bank.length - 1; i > 0; i--) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const j = (seed >>> 0) % (i + 1);
    [bank[i], bank[j]] = [bank[j], bank[i]];
  }
  return bank;
}

export function normalizePuzzleState(activity, previous) {
  const bank = puzzleTokenBank(activity);
  const targets = new Set((activity.sentences || []).map((sentence) => sentence.id));
  const prev = previous && !Array.isArray(previous) && previous.revision === (activity.revision || 1) ? previous : {};
  const completed = [];
  const used = new Set();
  for (const done of prev.completed || []) {
    if (!targets.has(done.id) || completed.some((entry) => entry.id === done.id)) continue;
    const target = activity.sentences.find((entry) => entry.id === done.id);
    if (!Array.isArray(done.indices) || done.indices.length !== target.words.length) continue;
    if (done.indices.some((index, offset) => !Number.isInteger(index) || index < 0 ||
      index >= bank.length || used.has(index) || bank[index].word !== target.words[offset])) continue;
    completed.push({ id: done.id, indices: [...done.indices] });
    for (const index of done.indices) used.add(index);
  }
  const current = [];
  for (const index of prev.current || []) {
    if (!Number.isInteger(index) || index < 0 || index >= bank.length || used.has(index) || current.includes(index)) continue;
    current.push(index);
  }
  return {
    revision: activity.revision || 1,
    current,
    completed,
    feedback: prev.feedback === 'correct' || prev.feedback === 'wrong' ? prev.feedback : null
  };
}

export function addPuzzleWord(activity, previous, tokenIndex) {
  const state = normalizePuzzleState(activity, previous);
  const bank = puzzleTokenBank(activity);
  const used = new Set(state.completed.flatMap((entry) => entry.indices));
  if (!Number.isInteger(tokenIndex) || tokenIndex < 0 || tokenIndex >= bank.length ||
    used.has(tokenIndex) || state.current.includes(tokenIndex) ||
    state.completed.length === activity.sentences.length) return state;
  return { ...state, current: [...state.current, tokenIndex], feedback: null };
}

export function undoPuzzleWord(activity, previous) {
  const state = normalizePuzzleState(activity, previous);
  return { ...state, current: state.current.slice(0, -1), feedback: null };
}

export function clearPuzzleSentence(activity, previous) {
  const state = normalizePuzzleState(activity, previous);
  return { ...state, current: [], feedback: null };
}

export function submitPuzzleSentence(activity, previous) {
  const state = normalizePuzzleState(activity, previous);
  const bank = puzzleTokenBank(activity);
  if (!state.current.length) return { ...state, feedback: 'wrong' };
  const words = state.current.map((index) => bank[index].word);
  const solved = new Set(state.completed.map((entry) => entry.id));
  const target = activity.sentences.find((entry) =>
    !solved.has(entry.id) && entry.words.length === words.length &&
    entry.words.every((word, index) => word === words[index]));
  if (!target) return { ...state, feedback: 'wrong' };
  return {
    ...state,
    current: [],
    completed: [...state.completed, { id: target.id, indices: [...state.current] }],
    feedback: 'correct'
  };
}

export function validateMultiSentencePuzzle(activity) {
  if (!Array.isArray(activity.sentences) || activity.sentences.length < 2) {
    return ['at least two correct sentences are needed for a mixed-word puzzle'];
  }
  const errors = [];
  const ids = new Set();
  const texts = new Set();
  for (const sentence of activity.sentences) {
    if (!sentence.id || ids.has(sentence.id)) errors.push('missing or duplicate sentence id');
    ids.add(sentence.id);
    if (!Array.isArray(sentence.words) || sentence.words.length < 2 ||
      sentence.words.some((word) => typeof word !== 'string' || !word.trim())) {
      errors.push('sentence ' + sentence.id + ': provide at least two nonempty word tokens');
    } else {
      const text = sentence.words.join(' ');
      if (texts.has(text)) errors.push('duplicate target sentence: ' + text);
      texts.add(text);
    }
  }
  if (activity.extraWords?.some((word) => typeof word !== 'string' || !word.trim())) {
    errors.push('extraWords must be nonempty strings');
  }
  return errors;
}
