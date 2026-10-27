// Tutivar learner-domain v1. Pure adapters; no storage, schedule, or backend coupling.
export const LEARNER_CONTRACT_VERSION = '1.0.0';
const safeArray = (value) => Array.isArray(value) ? value : [];
const text = (value) => typeof value === 'string' ? value.trim() : '';
const lessonIsAvailable = (lesson) => lesson && lesson.status === 'sample';

export function createUser({ id, displayName = '', interfaceLanguage = 'fa', learningPairId = 'fa-en' } = {}) {
  if (!text(id)) throw new TypeError('User.id must be a stable non-empty string');
  return { schemaVersion: LEARNER_CONTRACT_VERSION, id: text(id), displayName: text(displayName), interfaceLanguage, learningPairId };
}
export function toLessonDescriptor(lesson, { courseRevision = 'draft' } = {}) {
  if (!text(lesson?.id)) throw new TypeError('Lesson.id is required');
  return { schemaVersion: LEARNER_CONTRACT_VERSION, id: lesson.id, title: text(lesson.title), status: lesson.status || 'planned', courseRevision };
}
export function createLessonProgress({ userId, lessonId, courseRevision, completedSectionIds = [], lastSectionId = null, completedAt = null } = {}) {
  if (![userId, lessonId, courseRevision].every(text)) throw new TypeError('Lesson progress needs userId, lessonId, courseRevision');
  return { schemaVersion: LEARNER_CONTRACT_VERSION, userId, lessonId, courseRevision, completedSectionIds: [...new Set(safeArray(completedSectionIds).map(text).filter(Boolean))], lastSectionId, completedAt };
}
export function createReviewCard({ id, userId, pairId = 'fa-en', front, back, source = null, createdAt } = {}) {
  if (![id, userId, front, back].every(text)) throw new TypeError('ReviewCard needs id, userId, front and back');
  return { schemaVersion: LEARNER_CONTRACT_VERSION, id, userId, pairId, front: text(front), back: text(back), source, createdAt: createdAt || new Date().toISOString(), schedule: null };
}
export function createReviewHistory({ id, userId, cardId, reviewedAt, answer, nextDueAt = null } = {}) {
  if (![id, userId, cardId, reviewedAt, answer].every(text)) throw new TypeError('ReviewHistory needs an identity, time and answer');
  return { schemaVersion: LEARNER_CONTRACT_VERSION, id, userId, cardId, reviewedAt, answer, nextDueAt };
}
// The legacy preview progress object remains the storage source until phase 3.
// In particular, 'reviewCount' is practice taps, not spaced-repetition success.
export function summarizeLearningProgress(lessons = [], progress = {}) {
  const available = safeArray(lessons).filter(lessonIsAvailable);
  const completed = new Set(safeArray(progress.completed));
  const completedCount = available.filter((lesson) => completed.has(lesson.id)).length;
  const startedCount = available.filter((lesson) => !completed.has(lesson.id) && safeArray(progress.sectionCompleted?.[lesson.id]).length > 0).length;
  const percent = available.length ? Math.round(100 * completedCount / available.length) : 0;
  return { availableCount: available.length, completedCount, startedCount, percent, remainingCount: available.length - completedCount };
}
export function selectResumeLesson(lessons = [], progress = {}) {
  const available = safeArray(lessons).filter(lessonIsAvailable);
  const completed = new Set(safeArray(progress.completed));
  const last = available.find((lesson) => lesson.id === progress.lastLessonId && !completed.has(lesson.id));
  return last || available.find((lesson) => !completed.has(lesson.id) && safeArray(progress.sectionCompleted?.[lesson.id]).length > 0) ||
    available.find((lesson) => !completed.has(lesson.id)) || available.at(-1) || null;
}
export function describeLessonState(lesson, progress = {}) {
  if (!lessonIsAvailable(lesson)) return 'planned';
  if (safeArray(progress.completed).includes(lesson.id)) return 'completed';
  if (safeArray(progress.sectionCompleted?.[lesson.id]).length) return 'in-progress';
  return 'available';
}
