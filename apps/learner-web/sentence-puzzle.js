import { composeSegments, resolveSentenceComposer } from './sentence-composer.js';
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

/** Match words by meaning and position, not typography. Case and terminal punctuation are not grading criteria. */
export function normalizePuzzleSentence(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase()
    .replace(/[’‘\x60]/g, "'")
    .replace(/[.,!?؟،؛:]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
export function puzzleDisplayWord(value) {
  return String(value || '').replace(/[.,!?؟،؛:]+$/g, '');
}
function matchComposerSentence(activity, source, input) {
  if (!source || source.type !== 'sentence-composer') return null;
  const patterns = (activity.patternIds?.length ? source.patterns.filter((p) => activity.patternIds.includes(p.id)) : source.patterns)
    .filter((pattern) => (pattern.segments || []).length);
  const slots = source.slots || [];
  const options = slots.map((slot) => (source.wordSets[slot.wordSet] || []).filter((word) =>
    !slot.includeRoles?.length || slot.includeRoles.includes(word.role || 'core')));
  if (options.some((entries) => !entries.length)) return null;
  const selected = {};
  let checked = 0;
  const search = (position) => {
    if (position >= slots.length) {
      for (const pattern of patterns) {
        // Protect against combinatorial mistakes in author-supplied JSON.
        if (++checked > 15000) return null;
        const resolved = resolveSentenceComposer(source, { slots: selected, pattern: pattern.id });
        const value = composeSegments(pattern.segments, source, resolved);
        if (normalizePuzzleSentence(value) === input) return value;
      }
      return null;
    }
    for (const word of options[position]) {
      selected[slots[position].id] = word.id;
      const match = search(position + 1);
      if (match) return match;
    }
    return null;
  };
  return search(0);
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
  const completedTexts = new Set();
  for (const done of prev.completed || []) {
    const isTarget = targets.has(done.id);
    const isFlexible = activity.reuseBank && String(done.id).startsWith('generated:') && !!done.text;
    if (!isTarget && !isFlexible) continue;
    const target = isTarget && activity.sentences.find((entry) => entry.id === done.id);
    if (!Array.isArray(done.indices) || (target && done.indices.length !== target.words.length)) continue;
    if (done.indices.some((index) => !Number.isInteger(index) || index < 0 ||
      index >= bank.length || (!activity.reuseBank && used.has(index)))) continue;
    const words = done.indices.map((index) => bank[index].word);
    const joined = normalizePuzzleSentence(words.join(' '));
    if (!joined || (target && joined !== normalizePuzzleSentence(target.words.join(' '))) && !done.text) continue;
    const normalized = normalizePuzzleSentence(done.text || words.join(' '));
    if (completedTexts.has(normalized)) continue;
    completed.push({ id: done.id, indices: [...done.indices], text: done.text || target?.words.join(' ') || words.join(' ') });
    completedTexts.add(normalized);
    if (!activity.reuseBank) for (const index of done.indices) used.add(index);
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
    feedback: prev.feedback === 'correct' || prev.feedback === 'wrong' || prev.feedback === 'duplicate' ? prev.feedback : null,
    warning: typeof prev.warning === 'string' ? prev.warning : ''
  };
}

/**
 * A token is allowed only if the complete prefix can still lead to at least
 * one authored target or a valid sentence from the JSON sentence composer.
 * No universal word-order rules (e.g. "is cannot begin a sentence") are used.
 */
export function canAppendPuzzleWord(activity, previous, tokenIndex, sourceComposer = null) {
  const state = normalizePuzzleState(activity, previous);
  const bank = puzzleTokenBank(activity);
  const used = new Set(activity.reuseBank ? [] : state.completed.flatMap((entry) => entry.indices));
  if (!Number.isInteger(tokenIndex) || tokenIndex < 0 || tokenIndex >= bank.length ||
      used.has(tokenIndex) || state.current.includes(tokenIndex) ||
      state.completed.length >= (activity.goalCount || activity.sentences.length)) return false;
  const candidate = [...state.current, tokenIndex]
    .map(index => puzzleDisplayWord(bank[index].word))
    .join(' ');
  const normalized = normalizePuzzleSentence(candidate);
  if (!normalized) return false;
  const isPrefix = (sentence) => {
    const target = normalizePuzzleSentence(sentence);
    return target === normalized || target.startsWith(normalized + ' ');
  };
  if ((activity.sentences || []).some(sentence => isPrefix(sentence.words.join(' ')))) return true;
  if (!sourceComposer || sourceComposer.type !== 'sentence-composer') return false;
  const patterns = (activity.patternIds?.length
    ? sourceComposer.patterns.filter(p => activity.patternIds.includes(p.id))
    : sourceComposer.patterns).filter(p => p.segments?.length);
  const slots = sourceComposer.slots || [];
  const options = slots.map(slot => (sourceComposer.wordSets[slot.wordSet] || [])
    .filter(word => !slot.includeRoles?.length || slot.includeRoles.includes(word.role || 'core')));
  if (options.some(entries => !entries.length)) return false;
  let examined = 0;
  const selected = {};
  const search = (position) => {
    if (position >= slots.length) {
      for (const pattern of patterns) {
        if (++examined > 15000) return false;
        const resolved = resolveSentenceComposer(sourceComposer, { slots: selected, pattern: pattern.id });
        if (isPrefix(composeSegments(pattern.segments, sourceComposer, resolved))) return true;
      }
      return false;
    }
    for (const word of options[position]) {
      selected[slots[position].id] = word.id;
      if (search(position + 1)) return true;
      if (examined > 15000) break;
    }
    return false;
  };
  return search(0);
}

export function addPuzzleWord(activity, previous, tokenIndex) {
  const state = normalizePuzzleState(activity, previous);
  const bank = puzzleTokenBank(activity);
  const used = new Set(activity.reuseBank ? [] : state.completed.flatMap((entry) => entry.indices));
  if (!Number.isInteger(tokenIndex) || tokenIndex < 0 || tokenIndex >= bank.length ||
    used.has(tokenIndex) || state.current.includes(tokenIndex) ||
    state.completed.length === (activity.goalCount || activity.sentences.length)) return state;
  return { ...state, current: [...state.current, tokenIndex], feedback: null, warning: '' };
}

export function undoPuzzleWord(activity, previous) {
  const state = normalizePuzzleState(activity, previous);
  return { ...state, current: state.current.slice(0, -1), feedback: null };
}

export function clearPuzzleSentence(activity, previous) {
  const state = normalizePuzzleState(activity, previous);
  return { ...state, current: [], feedback: null };
}

export function submitPuzzleSentence(activity, previous, sourceComposer = null) {
  const state = normalizePuzzleState(activity, previous);
  const bank = puzzleTokenBank(activity);
  if (!state.current.length) return { ...state, feedback: 'wrong', warning: '' };
  const words = state.current.map((index) => bank[index].word);
  const normalized = normalizePuzzleSentence(words.join(' '));
  const target = activity.sentences.find((entry) =>
    normalizePuzzleSentence(entry.words.join(' ')) === normalized);
  const generated = matchComposerSentence(activity, sourceComposer, normalized);
  if (!target && !generated) return { ...state, feedback: 'wrong', warning: '' };
  const canonical = generated || target.words.join(' ');
  if (state.completed.some((entry) => normalizePuzzleSentence(entry.text || '') === normalized))
    return { ...state, feedback: 'duplicate', warning: '' };
  if (!activity.reuseBank && target && state.completed.some((entry) => entry.id === target.id))
    return { ...state, feedback: 'duplicate', warning: '' };
  const canonicalWords = canonical.split(/\s+/);
  const unexpectedCapitals = words.some((word, index) =>
    index > 0 && /^[A-Z]/.test(puzzleDisplayWord(word)) &&
    /^[a-z]/.test(canonicalWords[index] || ''));
  const warning = unexpectedCapitals ? 'درست بود. فقط در نوشتار، واژه‌های معمولی وسط جمله با حرف کوچک شروع می‌شوند.' : '';
  return {
    ...state, current: [],
    completed: [...state.completed, {
      id: target?.id || 'generated:' + normalized,
      indices: [...state.current],
      text: canonical
    }],
    feedback: 'correct', warning
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
      const text = normalizePuzzleSentence(sentence.words.join(' '));
      if (texts.has(text)) errors.push('duplicate target sentence: ' + text);
      texts.add(text);
    }
  }
  if (activity.extraWords?.some((word) => typeof word !== 'string' || !word.trim())) {
    errors.push('extraWords must be nonempty strings');
  }
  return errors;
}
