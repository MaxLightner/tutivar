/*
 * Small, deterministic language-practice engine. The lesson JSON specifies
 * communicative goals, accepted alternatives and targeted repair prompts.
 * This deliberately checks teachable structures, not unrestricted meaning.
 */
export function normalizeResponse(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasPattern(text, expression) {
  try { return new RegExp(expression, 'i').test(text); }
  catch { return false; }
}
function matches(text, group = {}) {
  const normalized = normalizeResponse(text);
  const phrases = (group.any || []).map(normalizeResponse);
  const literals = phrases.some((phrase) => phrase && (` ${normalized} `).includes(` ${phrase} `));
  return literals || (group.patterns || []).some((pattern) => hasPattern(normalized, pattern));
}

export function evaluateResponse(assessment, response) {
  const text = normalizeResponse(response);
  if (!text) return { ok: false, feedback: 'یک پاسخ کوتاه به انگلیسی بنویس.' };
  if (!assessment) return { ok: true, feedback: 'پاسخت ثبت شد.' };

  for (const mistake of assessment.pitfalls || []) {
    if (matches(text, mistake) && !(mistake.unless && matches(text, mistake.unless))) {
      return { ok: false, feedback: mistake.feedback, repair: mistake.repair || '' };
    }
  }
  for (const requirement of assessment.required || []) {
    if (!matches(text, requirement)) {
      return { ok: false, feedback: requirement.feedback, repair: requirement.repair || '' };
    }
  }
  return { ok: true, feedback: assessment.success || 'درست ساختی! حالا در موقعیت بعدی از آن استفاده کن.' };
}

export function practiceState(saved, activity) {
  const revision = activity.practiceRevision || 1;
  const tasks = activity.tasks || activity.turns || [];
  if (!saved || saved.revision !== revision || !Array.isArray(saved.answers)) {
    return { revision, answers: [], draft: '', attempts: 0, feedback: null };
  }
  return { revision, answers: saved.answers.slice(0, tasks.length), draft: saved.draft || '', attempts: saved.attempts || 0, feedback: saved.feedback || null };
}

export function submitPractice(saved, activity, input) {
  const state = practiceState(saved, activity);
  const tasks = activity.tasks || activity.turns || [];
  const task = tasks[state.answers.length];
  if (!task) return { state, result: { ok: true, feedback: 'این تمرین کامل شده است.' } };
  const result = evaluateResponse(task.assessment, input);
  if (result.ok) {
    return { result, state: { ...state, answers: [...state.answers, input.trim()], draft: '', attempts: 0, feedback: null } };
  }
  return { result, state: { ...state, draft: input, attempts: state.attempts + 1, feedback: result } };
}
