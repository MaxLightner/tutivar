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

// This is deliberately a *bounded* check for A1 independent work, not an
// unrestricted English grammar judge. It prevents word-bank fragments from
// being reported as successful independent sentences.
function plausibleA1Clause(value) {
  const clause = normalizeResponse(value).replace(/^(?:you|friend|teacher|student|visitor|a|b)\s*:\s*/, '');
  if (!clause || clause.split(' ').length < 2) return false;
  // A1.2 directions are useful complete imperatives, even without an explicit subject.
  const direction = /^(?:go|turn|cross|stop|take|walk)\s+(?:straight|left|right|the|at|one|to|for|here|there)\b/.test(clause);
  if (direction) return true;
  if (clause.split(' ').length < 3) return false;
  if (/\b(?:have|has|want|wants|read|reads|write|writes)\s+(?:there|is|are|do|does)\b/.test(clause)) return false;
  const auxiliaryQuestion = /^(?:do|does|am|is|are|can|what|who|where|how|when|which|why|what's|who's|where's)\b/.test(clause);
  const subject = /^(?:i|you|he|she|it|we|they|there|this|that|these|those|my|your|his|her|our|the|a|an|[a-z]+'s)\b/.test(clause);
  const finiteVerb = /\b(?:am|is|are|have|has|do|does|don't|doesn't|isn't|aren't|read|reads|write|writes|study|studies|go|goes|walk|walks|sit|sits|open|opens|close|closes|eat|eats|drink|drinks|cook|cooks|want|wants|feel|feels|need|needs|like|likes|live|lives|speak|speaks|look|looks|see|sees|wear|wears|pass|buy|buys|pay|pays|take|takes|turn|turns|cross|crosses|ride|rides|travel|travels|drive|drives|work|works|help|helps|hurt|hurts|cost|costs|fit|fits)\b/.test(clause);
  return (auxiliaryQuestion || subject) && finiteVerb;
}

function checkIndependentProof(assessment, response) {
  const proof = assessment?.productionProof;
  if (!proof) return null;
  const wordCount = (normalizeResponse(response).match(/\b[a-z][a-z']*\b/g) || []).length;
  const parts = String(response).split(/[.!?;\n]+/).map(s => s.trim()).filter(Boolean);
  const complete = parts.filter(plausibleA1Clause);
  if (wordCount < (proof.minWords || 8) || complete.length < (proof.minClauses || 2)) {
    return {
      ok: false,
      feedback: 'چند واژهٔ کنار هم یا یک الگوی ناقص کافی نیست؛ دست‌کم دو جملهٔ معنی‌دار با فاعل و فعل بنویس.',
      repair: 'برای هر موقعیت یک جملهٔ کامل بساز و جمله‌ها را با نقطه، علامت سؤال یا سطر جدید جدا کن.'
    };
  }
  for (const rule of proof.required || []) {
    if (!(rule.patterns || []).some(pattern => parts.some(part => hasPattern(normalizeResponse(part), pattern)))) {
      return { ok: false, feedback: rule.feedback || 'یک قسمت از موقعیت را در جملهٔ کامل بیان کن.', repair: rule.repair || '' };
    }
  }
  return null;
}

export function evaluateResponse(assessment, response) {
  const text = normalizeResponse(response);
  if (!text) return { ok: false, feedback: 'یک پاسخ کوتاه به انگلیسی بنویس.' };
  if (!assessment) return { ok: true, feedback: 'پاسخت ثبت شد.' };

  const productionError = checkIndependentProof(assessment, response);
  if (productionError) return productionError;

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
