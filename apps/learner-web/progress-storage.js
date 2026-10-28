// Tutivar phase 3: backwards-compatible, browser-local learner progress storage.
// Versioned backup files are portable; no backend or cross-device sync is implied.
export const PROGRESS_BACKUP_FORMAT = 'tutivar-learner-progress';
export const PROGRESS_BACKUP_VERSION = 1;
export const DEFAULT_PROGRESS_KEY = 'tutivar:fa-en:preview:v1';
export const DEFAULT_PAIR_ID = 'fa-en';
export const MAX_IMPORT_CHARS = 5_000_000;

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isStringArray = value => Array.isArray(value) && value.every(v => typeof v === 'string');
const isRecordOrMissing = value => value === undefined || isRecord(value);
const KNOWN_MAPS = [
  'sectionCompleted', 'quizAnswers', 'chatAnswers', 'written', 'wordProgress',
  'matchAnswers', 'sentenceAnswers', 'roleplayAnswers', 'phraseChoices',
  'practiceStates', 'assessments', 'lastSectionByLesson'
];

// Historical preview data includes many activity-specific maps. Preserve unknown
// fields and older revisions; validate key structures only, rather than pruning.
export function isValidProgress(value, { allowEmpty = false } = {}) {
  if (!isRecord(value)) return false;
  if (!allowEmpty && ![
    'completed', 'sectionCompleted', 'wordProgress', 'historyDates', 'leitnerAdded',
    'curriculumRevision', 'lastLessonId'
  ].some(key => Object.hasOwn(value, key))) return false;
  if (value.completed !== undefined && !isStringArray(value.completed)) return false;
  if (value.historyDates !== undefined && !isStringArray(value.historyDates)) return false;
  if (value.leitnerAdded !== undefined && !Array.isArray(value.leitnerAdded)) return false;
  if (value.lastLessonId !== undefined && value.lastLessonId !== null && typeof value.lastLessonId !== 'string') return false;
  for (const key of KNOWN_MAPS) if (!isRecordOrMissing(value[key])) return false;
  if (!isRecordOrMissing(value.settings)) return false;
  return true;
}

// Non-cryptographic checksum prevents accidental partial-file import; not a signature.
export function progressChecksum(json) {
  let hash = 2166136261;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function createProgressBackup(progress, { pairId = DEFAULT_PAIR_ID, now = new Date() } = {}) {
  if (!isValidProgress(progress, { allowEmpty: true })) throw new TypeError('Invalid progress');
  const data = JSON.parse(JSON.stringify(progress));
  return {
    format: PROGRESS_BACKUP_FORMAT,
    version: PROGRESS_BACKUP_VERSION,
    pairId,
    exportedAt: now.toISOString(),
    checksum: progressChecksum(JSON.stringify(data)),
    progress: data
  };
}

export function parseProgressBackup(raw, { pairId = DEFAULT_PAIR_ID } = {}) {
  if (typeof raw !== 'string' || raw.length > MAX_IMPORT_CHARS) throw new Error('Invalid backup file size');
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error('Backup file is not valid JSON'); }
  if (!isRecord(value)) throw new Error('Backup must be an object');
  if (value.format === PROGRESS_BACKUP_FORMAT) {
    if (value.version !== PROGRESS_BACKUP_VERSION) throw new Error('Unsupported backup version');
    if (value.pairId !== pairId) throw new Error('Wrong learning pair');
    if (!isValidProgress(value.progress, { allowEmpty: false })) throw new Error('Invalid progress content');
    if (value.checksum !== progressChecksum(JSON.stringify(value.progress))) throw new Error('Backup checksum mismatch');
    return JSON.parse(JSON.stringify(value.progress));
  }
  // Accept a plain legacy preview file only when it really looks like progress.
  if (isValidProgress(value)) return JSON.parse(JSON.stringify(value));
  throw new Error('Unrecognized backup format');
}

const readJSON = raw => {
  if (raw === null) return null;
  try { const data = JSON.parse(raw); return isValidProgress(data, { allowEmpty: true }) ? data : null; }
  catch { return null; }
};

/**
 * Atomically protects a prior good snapshot before overwriting the legacy key.
 * Works with native localStorage or an injected equivalent for tests.
 * Storage unavailable: keeps app usable in memory but reports the failure.
 * Any primary JSON is never silently overwritten if it is corrupt and there is
 * no valid backup; this protects potentially recoverable user records.
 */
export function createProgressStore(storage, { key = DEFAULT_PROGRESS_KEY } = {}) {
  const backupKey = `${key}:previous-good`;
  let lastError = null;
  let protectedCorruptPrimary = false;
  let lastSeenRaw;
  const safeRead = name => {
    try { return { raw: storage.getItem(name), error: null }; }
    catch (error) { return { raw: null, error }; }
  };
  function load() {
    const primary = safeRead(key);
    const backup = safeRead(backupKey);
    if (!primary.error) lastSeenRaw = primary.raw;
    if (primary.error) {
      lastError = 'unavailable';
      return { data: null, source: 'unavailable', warning: 'unavailable' };
    }
    const data = readJSON(primary.raw);
    if (data !== null) {
      lastError = null;
      return { data, source: 'primary', warning: null };
    }
    const recovered = readJSON(backup.raw);
    if (recovered !== null) {
      protectedCorruptPrimary = primary.raw !== null;
      lastError = primary.raw !== null ? 'recovered' : null;
      return { data: recovered, source: 'backup', warning: lastError };
    }
    if (primary.raw !== null || backup.raw !== null) {
      protectedCorruptPrimary = primary.raw !== null;
      lastError = 'corrupt';
      return { data: null, source: 'corrupt', warning: 'corrupt' };
    }
    lastError = null;
    return { data: null, source: 'empty', warning: null };
  }
  function save(progress, { allowCorruptReplace = false } = {}) {
    if (!isValidProgress(progress, { allowEmpty: true })) return { ok: false, error: 'invalid' };
    const current = safeRead(key);
    if (current.error) { lastError = 'unavailable'; return { ok: false, error: 'unavailable' }; }
    if (lastSeenRaw !== undefined && current.raw !== lastSeenRaw && !allowCorruptReplace) {
      lastError = 'conflict';
      return { ok: false, error: 'conflict' };
    }
    if ((protectedCorruptPrimary || (current.raw !== null && readJSON(current.raw) === null)) && !allowCorruptReplace) {
      lastError = 'corrupt';
      return { ok: false, error: 'corrupt' };
    }
    let payload;
    try { payload = JSON.stringify(progress); } catch { return { ok: false, error: 'invalid' }; }
    let warning = null;
    // When restoring from a corrupt current state, never copy corruption over
    // the last good backup. This branch is only for explicitly confirmed restore.
    if (current.raw !== null && readJSON(current.raw) !== null) {
      try { storage.setItem(backupKey, current.raw); } catch { warning = 'backup-unavailable'; }
    }
    try {
      storage.setItem(key, payload);
      protectedCorruptPrimary = false;
      lastSeenRaw = payload;
      lastError = warning;
      return { ok: true, warning };
    } catch {
      lastError = 'unavailable';
      return { ok: false, error: 'unavailable' };
    }
  }
  return { key, backupKey, load, save, get lastError() { return lastError; } };
}

export function resolveResumeSection(lessonId, lesson, progress, getCompletedSections) {
  const sections = lesson?.sections || [];
  const completed = new Set(getCompletedSections(lessonId));
  const preferred = progress.lastSectionByLesson?.[lessonId];
  if (sections.some(section => section.id === preferred && !completed.has(section.id))) return preferred;
  return sections.find(section => !completed.has(section.id))?.id || sections[0]?.id || 'foundation';
}
