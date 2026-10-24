/** JSON-driven conceptual paraphrases and interactive spatial/family activities. */
export function resolveMeaningForm(activity, concept, progress = {}) {
  if (!activity || !concept?.forms?.length) return null;
  const selected = Number(progress?.[concept.id]) || 0;
  return concept.forms[((selected % concept.forms.length) + concept.forms.length) % concept.forms.length];
}
export function advanceMeaningForm(activity, concept, progress = {}) {
  if (!activity?.concepts?.some((item) => item.id === concept.id) || !concept.forms?.length) return progress;
  const forms = concept.forms.length;
  const current = Number(progress?.[concept.id]) || 0;
  return { ...progress, [concept.id]: (current + 1) % forms };
}
export function selectedSpatialPosition(activity, saved) {
  const items = activity?.positions || [];
  return items.find((item) => item.id === saved) || items[0] || null;
}
export function validateVisualActivity(activity) {
  const errors = [];
  if (activity.type === 'meaning-cluster') {
    if (!Array.isArray(activity.concepts) || !activity.concepts.length) errors.push('missing concepts');
    const seen = new Set();
    for (const concept of activity.concepts || []) {
      if (!concept.id || seen.has(concept.id)) errors.push('duplicate concept id');
      seen.add(concept.id);
      if (!concept.fa || !Array.isArray(concept.forms) || concept.forms.length < 2) errors.push('concept needs a meaning and at least two forms');
      for (const form of concept.forms || [])
        if (!form.en || !form.fa || !['equivalent','related'].includes(form.relation)) errors.push('form requires text, translation, semantic relationship');
    }
  }
  if (activity.type === 'spatial-lab') {
    if (!Array.isArray(activity.positions) || activity.positions.length < 3) errors.push('missing spatial positions');
    const seen = new Set();
    for (const position of activity.positions || []) {
      if (!position.id || seen.has(position.id)) errors.push('duplicate position id');
      seen.add(position.id);
      if (!position.label || !position.fa || !position.en || !position.ball) errors.push('missing spatial position details');
      if (!Number.isFinite(position.ball?.x) || !Number.isFinite(position.ball?.y)) errors.push('invalid spatial coordinates');
      if (!['front','rear'].includes(position.ball?.layer)) errors.push('unknown spatial depth');
      if (![undefined,0,28].includes(position.boxLift)) errors.push('invalid box lift');
    }
  }
  if (activity.type === 'family-lab') {
    if (!Array.isArray(activity.people) || activity.people.length < 2) errors.push('family needs at least two people');
    const names = new Set();
    for (const person of activity.people || []) {
      if (!person.name || names.has(person.name)) errors.push('duplicate family person');
      names.add(person.name);
      if (!person.sentence || !person.fa || !person.followup) errors.push('missing family descriptions');
      if (!Number.isFinite(person.scene?.x) || !Number.isFinite(person.scene?.y)) errors.push('missing family scene coordinates');
      else if (person.scene.x < 0 || person.scene.x > 500 || person.scene.y < 30 || person.scene.y > 310) errors.push('family figure outside scene');
    }
  }
  return errors;
}
