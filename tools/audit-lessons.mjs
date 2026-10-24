import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const lessonDirectory = join(root, 'content/language-pairs/fa-en/lessons');

// Report *where* a phrase can be encountered or recalled. A count of repeated
// substrings is not proof that the learner has actually produced the phrase.
const normalize = (value) => String(value || '')
  .normalize('NFKC').toLowerCase().replace(/[’‘`]/g, "'")
  .replace(/\b(i'm|im)\b/g, 'i am')
  .replace(/\b(you're|youre)\b/g, 'you are')
  .replace(/\b(he's|hes)\b/g, 'he is')
  .replace(/\b(she's|shes)\b/g, 'she is')
  .replace(/\b(it's|its)\b/g, 'it is')
  .replace(/\b(they're|theyre)\b/g, 'they are')
  .replace(/\b(we're|were)\b/g, 'we are')
  .replace(/\b(what's|whats)\b/g, 'what is')
  .replace(/\b(who's|whos)\b/g, 'who is')
  .replace(/\b(where's|wheres)\b/g, 'where is')
  .replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();

function containsPhrase(text, aliases) {
  const haystack = ` ${normalize(text)} `;
  return aliases.some((alias) => alias && haystack.includes(` ${alias} `));
}

function visibleInputs(activity) {
  const inputs = [];
  const excluded = new Set(['id','type','phase','status','title','typeLabel','description','image','imageAlt','caption','sourceActivityId','patternId','targetLanguage','kind','role','speaker','revision','deckRevision']);
  function collect(value, key = '') {
    if (typeof value === 'string') {
      if (!excluded.has(key) && /[A-Za-z]/.test(value)) inputs.push(value);
      return;
    }
    if (Array.isArray(value)) { value.forEach((item) => collect(item, key)); return; }
    if (value && typeof value === 'object') for (const [childKey, child] of Object.entries(value)) collect(child, childKey);
  }
  collect(activity);
  return inputs;
}

function assessmentGroups(activity) {
  const targets = activity.type === 'free-write' ? [activity] : [...(activity.tasks || []), ...(activity.turns || [])];
  return targets.flatMap((item) => item.assessment?.required || []);
}

function requirementOffersPhrase(requirement, aliases) {
  // Pattern-based requirements intentionally are not interpreted as exact
  // phrases: they can describe an open-ended skill such as self-introduction.
  return (requirement.any || []).some((option) => containsPhrase(option, aliases));
}

function requirementNeedsPhrase(requirement, aliases) {
  return (requirement.any || []).length > 0
    && !(requirement.patterns || []).length
    && requirement.any.every((option) => containsPhrase(option, aliases));
}

export function auditLesson(lesson) {
  const activities = (lesson.sections || []).flatMap((section) => section.activities || []);
  const vocabulary = activities.find((activity) => activity.type === 'vocabulary');
  if (!vocabulary || !lesson.learningAudit) return { id: lesson.id, skipped: true, errors: [], rows: [] };

  const core = (vocabulary.items || []).filter((item) => item.role !== 'supplementary');
  const supplementary = (vocabulary.items || []).filter((item) => item.role === 'supplementary');
  const focus = new Set(lesson.learningAudit.focusExpressions || []);
  const specificIndependent = new Set(lesson.learningAudit.specificIndependentExpressions || []);
  const errors = [];
  const contentActivities = activities.filter((activity) => activity.id !== vocabulary.id);
  const availableContent = contentActivities.flatMap(visibleInputs);
  for (const phrase of focus) {
    const inWords = core.some((item) => item.en === phrase);
    const inContent = availableContent.some((input) => containsPhrase(input, [normalize(phrase)]));
    if (!inWords && !inContent) errors.push(`${phrase}: focus target missing from vocabulary and lesson activities`);
  }
  for (const phrase of specificIndependent) {
    if (!focus.has(phrase)) errors.push(`${phrase}: specific independent expression is not a focus expression`);
  }

  const expressionItems = contentActivities
    .filter((activity) => activity.type === 'expression-study')
    .flatMap((activity) => activity.items || []);
  const targets = new Map(core.map((item) => [item.en, item]));
  for (const phrase of focus) {
    if (targets.has(phrase)) continue;
    const authoredExpression = expressionItems.find((item) => normalize(item.en) === normalize(phrase));
    targets.set(phrase, authoredExpression || { en: phrase, fa: '' });
  }
  const rows = [...targets.values()].map((item) => {
    const aliases = [item.en, ...(item.auditAliases || [])].map(normalize).filter(Boolean);
    const visible = [];
    const guided = [];
    const independent = [];
    const independentRequired = [];
    for (const activity of contentActivities) {
      if (visibleInputs(activity).some((input) => containsPhrase(input, aliases))) visible.push(activity.id);
      const hasRequirement = assessmentGroups(activity).some((required) => requirementOffersPhrase(required, aliases));
      if (hasRequirement) {
        if (activity.type === 'free-write') independent.push(activity.id);
        else guided.push(activity.id);
      }
      if (activity.type === 'free-write' && assessmentGroups(activity).some((required) => requirementNeedsPhrase(required, aliases))) {
        independentRequired.push(activity.id);
      }
    }
    const downstream = [...new Set([...visible, ...guided, ...independent])];
    const row = { phrase: item.en, focus: focus.has(item.en), visible, guided, independent, independentRequired, downstream };
    if (row.focus) {
      if (downstream.length < (lesson.learningAudit.minDownstreamActivities || 0)) {
        errors.push(`${item.en}: only ${downstream.length} downstream activities`);
      }
      if (guided.length < (lesson.learningAudit.minGuidedActivities || 0)) {
        errors.push(`${item.en}: no sufficient guided retrieval opportunities`);
      }
      if (lesson.learningAudit.requireIndependentProduction && independent.length === 0) {
        errors.push(`${item.en}: not targeted in independent production`);
      }
      if (specificIndependent.has(item.en) && independentRequired.length === 0) {
        errors.push(`${item.en}: may be skipped through alternatives in independent production`);
      }
    }
    return row;
  });
  return { id: lesson.id, skipped: false, errors, rows, coreCount: core.length, supplementaryCount: supplementary.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2).length ? process.argv.slice(2) : ['a1-1.json'];
  let hasErrors = false;
  for (const file of files) {
    const lesson = JSON.parse(readFileSync(join(lessonDirectory, file), 'utf8'));
    const result = auditLesson(lesson);
    if (result.skipped) { console.log(`${lesson.id}: no learning-audit contract yet`); continue; }
    console.log(`\n${result.id}: ${result.coreCount} core / ${result.supplementaryCount} supplementary`);
    console.log('Expression                  Shown  Guided  Independent  Required  Contexts');
    for (const row of result.rows) {
      console.log(`${row.phrase.padEnd(27)} ${String(row.visible.length).padStart(3)}     ${String(row.guided.length).padStart(3)}       ${String(row.independent.length).padStart(3)}          ${String(row.independentRequired.length).padStart(3)}      ${String(row.downstream.length).padStart(3)}${row.focus ? '  *' : ''}`);
    }
    for (const error of result.errors) console.error(`FAIL: ${error}`);
    if (result.errors.length) hasErrors = true;
    else console.log('PASS: all focused phrases have downstream, guided and independent evidence opportunities');
  }
  if (hasErrors) process.exitCode = 1;
}
