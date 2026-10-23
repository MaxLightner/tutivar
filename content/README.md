# Content registry

Real content is stored as JSON conforming to the contracts in `schemas/`. A language pair such as `fa-de` has its own folder and **does not define the universal teaching order**.

Proposed publication layout:

```text
content/
  blueprints/                # approved universal Blueprint, imported verbatim
  language-pairs/fa-de/      # pair metadata and approved Grammar Map
  courses/fa-de/A1/         # ordered course manifest and immutable releases
  lessons/fa-de/A1/         # individually revisioned lesson JSON
  exercises/fa-de/          # individual exercise JSON instances
  placement/fa-de/          # revisioned placement assessments
  media/                    # prompts, transcripts, IDs, asset metadata
```

Do not introduce fabricated lessons or grammar coverage to fill placeholders. Approved documents must be imported before course generation. The production sequence is Blueprint → Grammar Map → finalized pair-specific lesson list → Lesson Body → selected Exercise Library formats → validation. Every chapter requires a workshop, and every level a final assessment. Grammar first exposure does not mandate immediate full explanation. Coverage is tracked across exposure, practice, explanation, independent production, and review.

`examples/` contains deliberately non-published samples and is not a course.

## Pilot lesson quality gate (`fa-en`)

The first A1 lesson has an opt-in `learningAudit` contract in its JSON.
Run `npm run audit:lessons` (also included in `npm test`) before publishing lesson edits.
It distinguishes the number of downstream activities that visibly introduce a
phrase, prompt guided retrieval, and require independent production. A small
`specificIndependentExpressions` subset must not be satisfied by unrelated
alternative greetings or responses. Supplementary vocabulary is reported but
does not block completion. Future lessons can opt into the same contract after
their own communicative goals have been defined.

This is a **structural check**, not a claim of learner mastery: seeing an
example, opening a hint, and actually producing a phrase are different events.
Authors must still review naturalness, dialogue order, beginner-level language,
feedback and lesson length. Changes to assessed tasks must bump
`practiceRevision`, and changes to final assessment must bump
`assessment.revision` so older locally stored passes are not mistaken for new
evidence. The two lesson sections remain independently navigable.
