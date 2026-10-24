/**
 * Data-driven sentence composer.
 *
 * The engine knows how to resolve slots, word forms and declared dependencies;
 * lesson JSON owns the vocabulary, fixed segments and grammar patterns.
 */
export function normalizeSentenceComposerState(activity, saved = {}) {
  const slots = {};
  for (const slot of activity.slots || []) {
    const entries = activity.wordSets?.[slot.wordSet] || [];
    const requested = saved.slots?.[slot.id];
    slots[slot.id] = entries.some((entry) => entry.id === requested)
      ? requested
      : entries.some((entry) => entry.id === slot.default)
        ? slot.default
        : entries[0]?.id ?? '';
  }
  const pattern = (activity.patterns || []).some((entry) => entry.id === saved.pattern)
    ? saved.pattern
    : activity.defaultPattern;
  const activeSlot = (activity.slots || []).some((slot) => slot.id === saved.activeSlot)
    ? saved.activeSlot
    : null;
  return { slots, pattern, activeSlot };
}

function selectedItem(activity, state, slotId) {
  const slot = activity.slots?.find((entry) => entry.id === slotId);
  if (!slot) return null;
  const items = activity.wordSets?.[slot.wordSet] || [];
  return items.find((entry) => entry.id === state.slots?.[slotId]) || items[0] || null;
}

function matchesCondition(condition, activity, state) {
  if (!condition) return true;
  if (condition.all && !condition.all.every((entry) => matchesCondition(entry, activity, state))) return false;
  if (condition.any && !condition.any.some((entry) => matchesCondition(entry, activity, state))) return false;
  if (condition.pattern && state.pattern !== condition.pattern) return false;
  if (condition.slot) {
    const item = selectedItem(activity, state, condition.slot);
    const actual = condition.feature ? item?.features?.[condition.feature] : state.slots[condition.slot];
    if (actual !== condition.equals) return false;
  }
  return true;
}

export function resolveSentenceComposer(activity, saved = {}) {
  const state = normalizeSentenceComposerState(activity, saved);
  const derived = { ...(activity.derivedDefaults || {}) };
  for (const rule of activity.dependencies || []) {
    if (matchesCondition(rule.when, activity, state)) Object.assign(derived, rule.set || {});
  }
  const pattern = activity.patterns?.find((entry) => entry.id === state.pattern)
    || activity.patterns?.find((entry) => entry.id === activity.defaultPattern)
    || activity.patterns?.[0]
    || null;
  return { state, derived, pattern };
}

export function composerSegmentValue(segment, activity, resolved) {
  if (Object.hasOwn(segment, 'fixed')) return String(segment.fixed);
  if (segment.derived) return String(resolved.derived[segment.derived] ?? '');
  if (segment.slot) {
    const item = selectedItem(activity, resolved.state, segment.slot);
    if (!item) return '';
    return String(item.forms?.[segment.form] ?? item[segment.form] ?? item.label ?? item.id ?? '');
  }
  return '';
}

export function composeSegments(segments, activity, resolved) {
  return (segments || []).map((segment) => composerSegmentValue(segment, activity, resolved)).join('');
}

export function composerSlotForm(activity, pattern, slotId) {
  return (pattern?.segments || []).find((segment) => segment.slot === slotId)?.form || 'label';
}

export function validateSentenceComposer(activity) {
  const errors = [];
  if (!activity || activity.type !== 'sentence-composer') return ['type must be sentence-composer'];
  if (!activity.id) errors.push('missing activity id');
  const sets = activity.wordSets || {};
  const slots = activity.slots || [];
  const patterns = activity.patterns || [];
  const slotIds = new Set();
  const patternIds = new Set();

  for (const [setId, entries] of Object.entries(sets)) {
    if (!Array.isArray(entries) || !entries.length) {
      errors.push('wordSet ' + setId + ' must contain at least one word');
      continue;
    }
    const itemIds = new Set();
    for (const item of entries) {
      if (!item.id || itemIds.has(item.id)) errors.push('wordSet ' + setId + ': missing or duplicate word id ' + item.id);
      itemIds.add(item.id);
      if (!item.label) errors.push('wordSet ' + setId + '/' + item.id + ': missing label');
      if (!item.translation) errors.push('wordSet ' + setId + '/' + item.id + ': missing translation');
    }
  }

  for (const slot of slots) {
    if (!slot.id || slotIds.has(slot.id)) errors.push('missing or duplicate slot id ' + slot.id);
    slotIds.add(slot.id);
    const entries = sets[slot.wordSet];
    if (!entries) {
      errors.push('slot ' + slot.id + ': unknown wordSet ' + slot.wordSet);
      continue;
    }
    if (!entries.some((item) => item.id === slot.default)) errors.push('slot ' + slot.id + ': default word does not exist');
    if (slot.includeRoles && slot.includeRoles.some((role) => !['core', 'supplementary'].includes(role))) {
      errors.push('slot ' + slot.id + ': unknown includeRoles value');
    }
  }

  for (const pattern of patterns) {
    if (!pattern.id || patternIds.has(pattern.id)) errors.push('missing or duplicate pattern id ' + pattern.id);
    patternIds.add(pattern.id);
    for (const segment of [...(pattern.segments || []), ...(pattern.translationSegments || [])]) {
      if (Object.hasOwn(segment, 'fixed')) {
        if (typeof segment.fixed !== 'string') errors.push('pattern ' + pattern.id + ': fixed segment must be text');
      } else if (segment.slot) {
        const slot = slots.find((entry) => entry.id === segment.slot);
        if (!slot) {
          errors.push('pattern ' + pattern.id + ': unknown slot ' + segment.slot);
          continue;
        }
        for (const item of sets[slot.wordSet] || []) {
          if (segment.form && item.forms?.[segment.form] === undefined && item[segment.form] === undefined) {
            errors.push('pattern ' + pattern.id + ': word ' + item.id + ' has no form ' + segment.form);
          }
        }
      } else if (segment.derived) {
        const dependencyKeys = (activity.dependencies || []).flatMap((rule) => Object.keys(rule.set || {}));
        if (!Object.hasOwn(activity.derivedDefaults || {}, segment.derived) && !dependencyKeys.includes(segment.derived)) {
          errors.push('pattern ' + pattern.id + ': unknown derived value ' + segment.derived);
        }
      } else {
        errors.push('pattern ' + pattern.id + ': segment must define fixed, slot or derived');
      }
    }
  }

  if (!patternIds.has(activity.defaultPattern)) errors.push('defaultPattern does not exist');
  for (const rule of activity.dependencies || []) {
    const conditionSlots = [];
    const collect = (condition) => {
      if (!condition) return;
      if (condition.slot) conditionSlots.push(condition.slot);
      for (const child of [...(condition.all || []), ...(condition.any || [])]) collect(child);
    };
    collect(rule.when);
    for (const slotId of conditionSlots) if (!slotIds.has(slotId)) errors.push('dependency ' + rule.id + ': unknown slot ' + slotId);
    for (const key of Object.keys(rule.set || {})) {
      if (!Object.hasOwn(activity.derivedDefaults || {}, key)) errors.push('dependency ' + rule.id + ': unknown derived value ' + key);
    }
  }
  return errors;
}
