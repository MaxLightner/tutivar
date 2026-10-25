# Tutivar curriculum contract — mandatory for every lesson author

The canonical authoring authority is **`content/curriculum/universal-path.v1.json`**, generated from the owner's complete 126-lesson plan. **Do not choose lesson order, topic, communicative objective, prerequisites, or archetype from the current website headings, memory, recent chat summaries, or the old lesson JSON files.** Those are historical implementations and can differ from the approved roadmap.

## Required procedure, before producing or editing any lesson

1. Run `npm run curriculum:plan -- A1-N` (or the relevant A2/B1/B2 ID). Its output is the approved ID, title, communicative outcome, prerequisites/bridge, scope boundary and archetypes. No rereading the uploaded document is necessary.
2. Check prerequisite readiness and identify new vs. recycled vocabulary. Do not introduce a dependent skill before its actual prerequisite is taught or explicitly bridged.
3. Build the lesson for **that outcome**, using the existing two-section architecture. Make the word → phrase → interactive sentence → context → independent-production loop coherent. Prefer tapping the meaningful word in the sentence; don't introduce a novel button mechanic for each activity. Visual state must track the sentence state. Reuse useful phrases downstream.
4. Record `roadmapRef` in a *new* lesson JSON, with `id`, `revision`, and **the complete, unchanged `communicativeOutcome`** printed by `curriculum:plan`. The lesson-specific goal may be a faithful, teachable narrower realization, not a different curriculum topic.
5. Add the lesson to the corresponding *canonical numerical position* in the pair curriculum, not wherever the editor finds a convenient blank card. The CI gate rejects reordering, skips, unapproved new topics and changed prerequisites.
6. Run `npm test` and `npm run build`. Both must pass before merging. Review manual pedagogy and visual consistency; passing a test is not itself evidence of learning.

## Owner-only changes to the sequence

A user who is the product owner **may explicitly change the roadmap**; that more recent instruction takes precedence. Never infer an amendment from a proposed lesson, a screenshot or a coding convenience. Record the exact owner's decision, affected IDs, rationale and a traceable conversation/issue reference; edit source + manifest + lock together and append a `roadmap.lock.json → approvedChanges` item. Rerun `npm run curriculum:check` and update prerequisites, downstream content, and stable progress migration. Never silently renumber lesson IDs or overwrite stored progress. See `docs/curriculum/WORKFLOW.md`.

## Live-site migration warning

The old published A1-6, A1-7, A1-8 and A1-9 are **not** aligned to the now-approved objective at those IDs. Their blob versions are frozen in `content/curriculum/legacy-alignment.json`. Do not edit these historical lessons or extend the wrong sequence; first carry out a safe versioned migration to the approved topics:

- A1-6: *features of objects*, not numbers/age.
- A1-7: *appearance of people*, not this/that identification.
- A1-8: *personal information*, using numerical age from old A1-6 after a number bridge.
- A1-9: *everyday states and feelings*, not room furnishing.
- A1-10: *home and amenities*, reusing appropriate parts of old A1-8 and A1-9.

The guard intentionally **blocks publishing A1-10 and beyond** while old IDs 6–9 are unresolved. Original user-facing lessons and local progress are preserved until migration is explicitly implemented; this is not an authorization to ignore the gaps.

The former `docs/curriculum/01-universal-learning-path.md` is retained only as an auditable source, not a document the author needs to consult each time.
