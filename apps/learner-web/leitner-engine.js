/** Tutivar Leitner v1 — pure, deterministic spaced repetition domain. */
export const REVIEW_STEPS = Object.freeze([0, 1, 2, 4, 8, 16, 32, 64]);
export const GRADUATED_BOX = 64;
export const DEFAULT_REVIEW_SETTINGS = Object.freeze({
  dailyLimit: 20, direction: 'target-first', tts: true,
  autoSpeak: false, forms: { plural: true, comparative: true, superlative: true, verbForms: true }
});
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const date = value => { const d = value instanceof Date ? new Date(value) : new Date(value); if (!Number.isFinite(d.valueOf())) throw new TypeError('Invalid date'); return d; };
const iso = value => date(value).toISOString();
const addDays = (value, days) => { const d = date(value); d.setDate(d.getDate() + days); return d.toISOString(); };
const localDateKey = value => { const d = date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const normalizeDailyLimit = value => Number.isFinite(Number(value)) ? Math.max(1, Math.min(200, Math.round(Number(value)))) : 20;
export function normalizeReviewSettings(settings) {
  const s = isObj(settings) ? settings : {};
  return {
    dailyLimit: normalizeDailyLimit(s.dailyLimit),
    direction: s.direction === 'meaning-first' ? 'meaning-first' : 'target-first',
    tts: s.tts !== false, autoSpeak: s.autoSpeak === true,
    forms: { ...DEFAULT_REVIEW_SETTINGS.forms, ...(isObj(s.forms) ? Object.fromEntries(Object.entries(s.forms).filter(([k,v]) => Object.hasOwn(DEFAULT_REVIEW_SETTINGS.forms,k) && typeof v === 'boolean')) : {}) }
  };
}
export function createLeitnerState(raw) {
  const s = isObj(raw) ? raw : {};
  const cards = isObj(s.cards) ? Object.fromEntries(Object.entries(s.cards).map(([id,card])=>[id, { ...card }])) : {};
  const history = Array.isArray(s.history) ? s.history.map(entry=>({ ...entry })) : [];
  const day = isObj(s.day) ? s.day : {};
  return { version: 1, settings: normalizeReviewSettings(s.settings), cards, history,
    day: { key: typeof day.key === 'string' ? day.key : '', admitted: Array.isArray(day.admitted) ? [...day.admitted] : [], queue: Array.isArray(day.queue) ? [...day.queue] : [] } };
}
const boxIndex = box => REVIEW_STEPS.indexOf(box);
export function isReviewDue(card, now = new Date()) {
  return card && card.box !== 0 && card.box !== GRADUATED_BOX && boxIndex(card.box) >= 0 &&
    typeof card.dueAt === 'string' && Number.isFinite(Date.parse(card.dueAt)) && Date.parse(card.dueAt) <= date(now).valueOf();
}
export function isEligibleForFastTrack(card) {
  return card.box === 1 && card.fastTrack === true && card.failures === 0 && card.correct === 1;
}
const getVocabulary = bank => Array.isArray(bank) ? bank : Array.isArray(bank?.entries) ? bank.entries : [];
const uniqueCatalog = bank => [...new Map(getVocabulary(bank).filter(item => item && typeof item.id === 'string' && item.id && typeof item.target === 'string' && item.target && typeof item.meaning === 'string' && item.meaning).map(item => [item.id, item])).values()];
/**
 * Build or continue a single daily session. Due cards are admitted before new
 * words. The limit counts UNIQUE admissions, not retries in house zero.
 * A finished session does not reopen already reviewed cards when the page reloads.
 */
export function ensureDailySession(input, bank, now = new Date(), { priorityIds = [] } = {}) {
  const s = createLeitnerState(input);
  const at = iso(now); const key = localDateKey(now);
  const catalog = uniqueCatalog(bank);
  const eligible = new Set(catalog.map(c => c.id));
  if (s.day.key !== key) s.day = { key, admitted: [], queue: [] };
  s.day.admitted = [...new Set(s.day.admitted.filter(id => eligible.has(id)))];
  s.day.queue = s.day.queue.filter(id => s.day.admitted.includes(id) && eligible.has(id) && s.cards[id]?.box !== GRADUATED_BOX);
  // A card in today's queue could have been answered on another browser tab;
  // avoid presenting it unless it remains explicitly awaiting a zero retry.
  const quotaLeft = Math.max(0, s.settings.dailyLimit - s.day.admitted.length);
  if (quotaLeft) {
    const due = catalog.filter(item => !s.day.admitted.includes(item.id) && isReviewDue(s.cards[item.id], at))
      .sort((a,b) => (s.cards[a.id].dueAt.localeCompare(s.cards[b.id].dueAt) || a.id.localeCompare(b.id)));
    const selectedDue = due.slice(0,quotaLeft);
    for(const entry of selectedDue) { s.day.admitted.push(entry.id); s.day.queue.push(entry.id); }
    let remaining = Math.max(0, s.settings.dailyLimit - s.day.admitted.length);
    if (remaining) {
      // Interrupted house-zero learning survives midnight and takes priority
      // over introducing more words. Higher-house due reviews still go first.
      const carryover = catalog.filter(item => !s.day.admitted.includes(item.id) && s.cards[item.id]?.box === 0).slice(0,remaining);
      for(const entry of carryover) { s.day.admitted.push(entry.id); s.day.queue.push(entry.id); }
      remaining = Math.max(0, s.settings.dailyLimit - s.day.admitted.length);
      const pins=new Set(Array.isArray(priorityIds)?priorityIds:[]);
      const fresh = catalog.filter(item => !Object.hasOwn(s.cards,item.id)).sort((a,b)=>Number(pins.has(b.id))-Number(pins.has(a.id))).slice(0,remaining);
      for(const entry of fresh) {
        s.cards[entry.id] = { id:entry.id, box:0, dueAt:null, createdAt:at, lastReviewedAt:null, correct:0, failures:0, fastTrack:false, attempts:0 };
        s.day.admitted.push(entry.id); s.day.queue.push(entry.id);
      }
    }
  }
  return s;
}
/** The pre-answer choice is saved for audit; final confirmation grades the card. */
export function answerCard(input, cardId, { guess, correct }, now = new Date()) {
  if (!['known','unknown'].includes(guess)) throw new TypeError('First choice must be known or unknown');
  if (typeof correct !== 'boolean') throw new TypeError('Final choice must be correct or incorrect');
  const s = createLeitnerState(input);
  const card = s.cards[cardId];
  if (!card || !s.day.queue.includes(cardId) || s.day.queue[0] !== cardId) throw new Error('Card is not next in the active daily queue');
  if (!correct && card.box === GRADUATED_BOX) throw new Error('Graduated cards cannot be reviewed');
  const fromBox = card.box;
  const at = iso(now);
  card.attempts = (card.attempts || 0) + 1;
  if (correct) {
    const step = boxIndex(card.box);
    if (step < 0 || card.box === GRADUATED_BOX) throw new Error('Invalid card state');
    if (fromBox === 0) {
      card.fastTrack = card.attempts === 1 && guess === 'known' && card.failures === 0;
      card.box = 1;
    } else if (isEligibleForFastTrack(card)) {
      card.box = 4;  // Only the second correct answer skips the 2-day house.
      card.fastTrack = false;
    } else {
      card.box = REVIEW_STEPS[step+1];
      card.fastTrack = false;
    }
    card.correct = (card.correct || 0) + 1;
    card.dueAt = card.box === GRADUATED_BOX ? null : addDays(at, card.box);
  } else {
    card.failures = (card.failures || 0) + 1;
    card.fastTrack = false;
    if (fromBox === 0) {
      card.box = 0;
      card.dueAt = null;
    } else {
      const step = boxIndex(card.box);
      if (step < 1) throw new Error('Invalid card state');
      card.box = REVIEW_STEPS[step-1];
      // Back to zero means relearn in this session, otherwise schedule at the
      // reduced house interval from *today*.
      card.dueAt = card.box === 0 ? null : addDays(at, card.box);
    }
  }
  card.lastReviewedAt = at;
  s.day.queue.shift();
  if (!correct && card.box === 0) s.day.queue.push(cardId);
  s.history.push({ cardId, reviewedAt:at, fromBox, toBox:card.box, guess, result: correct ? 'correct' : 'wrong' });
  return s;
}
export function reviewSummary(input, bank, now = new Date()) {
  const s = createLeitnerState(input);
  const catalog = uniqueCatalog(bank);
  const counts = Object.fromEntries(REVIEW_STEPS.map(box => [box,{ total:0,due:0 }]));
  let unseen = 0;
  for (const word of catalog) {
    const card = s.cards[word.id];
    if (!card) { unseen++; continue; }
    if (!Object.hasOwn(counts,card.box)) continue;
    counts[card.box].total++;
    if (isReviewDue(card,now)) counts[card.box].due++;
  }
  const day = s.day.key === localDateKey(now) ? s.day : {admitted:[],queue:[]};
  return {
    totalWords:catalog.length, unseen, learned: counts[64].total,
    due: REVIEW_STEPS.slice(1,-1).reduce((sum,box)=>sum+counts[box].due,0),
    boxes:counts, admitted:day.admitted.length, remainingToday:day.queue.length, limit:s.settings.dailyLimit,
    reviewCount:s.history.length
  };
}
