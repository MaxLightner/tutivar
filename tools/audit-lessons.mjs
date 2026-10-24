import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const lessonDirectory = join(root, 'content/language-pairs/fa-en/lessons');

// Report *where* a phrase can be encountered or recalled. A count of repeated
// substrings is not proof that the learner has actually produced the phrase.
const normalize = (value) => String(value || '')
  .normalize('NFKC').toLowerCase().replace(/[’‘`]/g, "'")
  .replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();

function containsPhrase(text, aliases) {
  const haystack = ` ${normalize(text)} `;
  return aliases.some((alias) => alias && haystack.includes(` ${alias} `));
}

function visibleInputs(activity) {
  const inputs = [];
  for (const form of activity.forms || []) if (form.en) inputs.push(form.en);
  for (const line of activity.lines || []) if (line.en) inputs.push(line.en);
  for (const pair of activity.pairs || []) {
    if (pair.question) inputs.push(pair.question);
    for (const variant of pair.variants || []) if (variant.en) inputs.push(variant.en);
  }
  for (const outcome of activity.outcomes || []) if (outcome.en) inputs.push(outcome.en);
  for (const example of activity.examples || []) if (typeof example === 'string') inputs.push(example);
  for (const turn of [...(activity.tasks || []), ...(activity.turns || [])]) {
    if (turn.incoming) inputs.push(turn.incoming);
    if (turn.source) inputs.push(turn.source);
  }
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
  for (const phrase of focus) {
    if (!core.some((item) => item.en === phrase)) errors.push(`${phrase}: focus expression missing from core vocabulary`);
  }
  for (const phrase of specificIndependent) {
    if (!focus.has(phrase)) errors.push(`${phrase}: specific independent expression is not a focus expression`);
  }
  const rows = core.map((item) => {
    const aliases = [item.en, ...(item.auditAliases || [])].map(normalize).filter(Boolean);
    const visible = [];
    const guided = [];
    const independent = [];
    const independentRequired = [];
    for (const activity of activities.filter((entry) => entry.id !== vocabulary.id)) {
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
