import { validateMultiSentencePuzzle } from './sentence-puzzle.js';
import { validateVisualActivity } from './visual-learning.js';
/**
 * Tutivar two-section lesson contract.
 * JSON controls the content and the order; this file validates the shared rhythm.
 */
export const LESSON_TEMPLATE_ID = 'discovery-production-v1';
export const LESSON_PHASES = Object.freeze({
  foundation: ['shadowing', 'words', 'phrases', 'sentence', 'variants', 'puzzle', 'construction'],
  production: ['correspondence', 'context', 'picture', 'guided', 'independent']
});
export const LESSON_PHASE_LABELS = Object.freeze({
  shadowing: 'سایه‌خوانی آغاز درس',
  words: 'واژه‌ها',
  phrases: 'عبارت‌ها و ترکیب‌های کاربردی',
  sentence: 'جملهٔ زنده',
  variants: 'شکل‌های جمله',
  puzzle: 'جورچین',
  construction: 'ساخت جمله',
  correspondence: 'جملات متناظر و سؤال‌وجواب',
  context: 'مکالمه و متن',
  picture: 'توصیف تصویر',
  guided: 'ساختن با کمک',
  independent: 'ساختن مستقل'
});
const TYPE_FOR_PHASE = {
  shadowing: ['shadowing'],
  words: ['vocabulary'],
  phrases: ['expression-study', 'composer-view', 'sentence-composer', 'response-practice', 'family-tree', 'family-lab', 'spatial-lab', 'count-visual'],
  sentence: ['sentence-composer'],
  variants: ['composer-view', 'sentence-transform', 'meaning-cluster', 'plural-pair-lab'],
  puzzle: ['sentence-builder'],
  construction: ['response-practice'],
  correspondence: ['exchange-lab', 'response-practice'],
  context: ['dialogue', 'response-practice'],
  picture: ['picture-description'],
  guided: ['guided-dialogue', 'dialogue-transfer'],
  independent: ['free-write', 'shadowing-review']
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
      if (activity.type === 'vocabulary') {
        for (const item of activity.items || []) {
          if (/\s/.test(String(item.en || '').trim()))
            errors.push(activity.id + ': vocabulary entry "' + item.en + '" is a phrase; move it to an expression activity');
        }
      }
      if (activity.type === 'expression-study') {
        if (!Array.isArray(activity.items) || !activity.items.length) errors.push(activity.id + ': expression-study needs items');
        for (const item of activity.items || []) {
          if (!item.en || !item.fa || !['fixed', 'collocation', 'preposition'].includes(item.kind))
            errors.push(activity.id + ': expression item needs en, fa and a valid kind');
        }
      }
      if (activity.type === 'shadowing') {
        if (!Array.isArray(activity.lines) || activity.lines.length < 3) errors.push(activity.id + ': shadowing needs at least three short lines');
        for (const line of activity.lines || []) if (String(line).trim().split(/\s+/).length > 10)
          errors.push(activity.id + ': shadowing line is too long for A1 imitation');
      }
      if (activity.type === 'shadowing-review') {
        const source = all[activity.sourceActivityId];
        if (!source || source.type !== 'shadowing') errors.push(activity.id + ': review must reference the opening shadowing track');
      }
      if (['meaning-cluster','family-lab','spatial-lab'].includes(activity.type)) errors.push(...validateVisualActivity(activity).map((error) => activity.id + ': ' + error));
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
  const activities = (lesson.sections || []).flatMap((section) => section.activities || []);
  const openingTracks = activities.filter((activity) => activity.type === 'shadowing');
  const closingTracks = activities.filter((activity) => activity.type === 'shadowing-review');
  if (openingTracks.length !== 1) errors.push('lesson must have exactly one opening shadowing track');
  if (closingTracks.length !== 1) errors.push('lesson must replay the opening shadowing track at the end');
  if (openingTracks.length === 1 && closingTracks.length === 1 &&
      closingTracks[0].sourceActivityId !== openingTracks[0].id)
    errors.push('closing shadowing track must reference the same opening track');
  return errors;
}
