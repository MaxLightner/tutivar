import { validateMultiSentencePuzzle } from './sentence-puzzle.js';
/**
 * Tutivar two-section lesson contract.
 * JSON controls the content and the order; this file validates the shared rhythm.
 */
export const LESSON_TEMPLATE_ID = 'discovery-production-v1';
export const LESSON_PHASES = Object.freeze({
  foundation: ['words', 'phrases', 'sentence', 'variants', 'puzzle', 'construction'],
  production: ['correspondence', 'context', 'guided', 'independent']
});
export const LESSON_PHASE_LABELS = Object.freeze({
  words: 'واژه‌ها',
  phrases: 'عبارت‌های ترکیبی',
  sentence: 'جملهٔ زنده',
  variants: 'شکل‌های جمله',
  puzzle: 'جورچین',
  construction: 'ساخت جمله',
  correspondence: 'جملات متناظر و سؤال‌وجواب',
  context: 'مکالمه و متن',
  guided: 'ساختن با کمک',
  independent: 'ساختن مستقل'
});
const TYPE_FOR_PHASE = {
  words: ['vocabulary'],
  phrases: ['composer-view', 'family-tree'],
  sentence: ['sentence-composer'],
  variants: ['composer-view', 'sentence-transform'],
  puzzle: ['sentence-builder'],
  construction: ['response-practice'],
  correspondence: ['exchange-lab', 'response-practice'],
  context: ['dialogue', 'response-practice'],
  guided: ['guided-dialogue', 'dialogue-transfer'],
  independent: ['free-write']
};

export function validateLessonFlow(lesson) {
  if (lesson.lessonTemplate !== LESSON_TEMPLATE_ID) return ['unsupported lesson template: ' + lesson.lessonTemplate];
  const errors = [];
  const all = Object.fromEntries((lesson.sections || []).flatMap((section) => section.activities || []).map((activity) => [activity.id, activity]));
  for (const [sectionId, stages] of Object.entries(LESSON_PHASES)) {
    const section = lesson.sections?.find((entry) => entry.id === sectionId);
    if (!section) { errors.push(sectionId + ': missing section'); continue; }
    const activities = section.activities || [];
    let previous = -1;
    const seen = new Set();
    for (const activity of activities) {
      const position = stages.indexOf(activity.phase);
      if (position < 0) { errors.push(activity.id + ': unknown phase ' + activity.phase); continue; }
      if (position < previous) errors.push(activity.id + ': phase order is not monotonic');
      previous = position;
      seen.add(activity.phase);
      if (!TYPE_FOR_PHASE[activity.phase].includes(activity.type))
        errors.push(activity.id + ': activity type ' + activity.type + ' does not belong to ' + activity.phase);
      if (activity.type === 'composer-view') {
        const source = all[activity.sourceActivityId];
        if (!source || source.type !== 'sentence-composer')
          errors.push(activity.id + ': unknown sentence composer source');
        else {
          const options = activity.patternIds || [activity.patternId];
          for (const patternId of options)
            if (!source.patterns.some((pattern) => pattern.id === patternId))
              errors.push(activity.id + ': unknown pattern ' + patternId);
        }
      }
      if (activity.type === 'sentence-builder') {
        if (activity.sourceActivityId) {
          const source = all[activity.sourceActivityId];
          if (!source || source.type !== 'sentence-composer') errors.push(activity.id + ': unknown sentence composer source for puzzle');
          else for (const id of activity.patternIds || []) if (!source.patterns.some((pattern) => pattern.id === id))
            errors.push(activity.id + ': puzzle references unknown pattern ' + id);
        }
        if (activity.goalCount !== undefined && (!Number.isInteger(activity.goalCount) || activity.goalCount < 2))
          errors.push(activity.id + ': goalCount must be an integer of at least two');
        if (activity.sentences) {
          errors.push(...validateMultiSentencePuzzle(activity).map((error) => activity.id + ': ' + error));
        } else if (activity.tokens?.length !== activity.correctOrder?.length ||
          activity.correctOrder?.some((n) => !Number.isInteger(n) || n < 0 || n >= activity.tokens.length) ||
          new Set(activity.correctOrder || []).size !== activity.tokens?.length) {
          errors.push(activity.id + ': invalid puzzle permutation');
        }
      }
    }
    for (const stage of stages) if (!seen.has(stage)) errors.push(sectionId + ': missing ' + stage);
  }
  return errors;
}
