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
