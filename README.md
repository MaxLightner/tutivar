# Tutivar

An extensible, language-pair-independent learning platform. This repository starts with **architecture and machine-readable content contracts**, not a finished application.

## Status

- Architecture baseline: `0.1.0` (draft)
- First language pair registered: Persian (`fa`) → German (`de`)
- No real course lessons, placement examinations, backend, website, or mobile app have been implemented yet.
- Files in `examples/` are illustrative fixtures, **not published educational content**.

## Structure

| Location | Responsibility |
| --- | --- |
| `architecture/` | Editable system boundaries and decisions |
| `registry/` | Module capabilities, dependencies, and planned features |
| `schemas/` | JSON content and module contracts |
| `content/` | Real, versioned language-pair and educational content |
| `examples/` | Non-published JSON examples for implementers |
| `tools/` | Validation and future content-publishing utilities |
| `apps/` | Future web, mobile, and admin clients |
| `packages/` | Future shared learning and UI engines |
| `services/` | Future modular backend |

Run `npm test` to validate the current JSON and check dependency rules (Node.js 20+). No dependency installation is needed at this stage.

## Non-negotiable learning boundaries

1. The **Universal Blueprint** establishes communicative order, across languages.
2. A language-pair **Grammar Map** supplies language differences; it cannot silently rewrite the Blueprint.
3. A pair-specific **course manifest** determines the finalized list and order of lessons, workshops per chapter, and a level-end assessment. Lesson counts are allowed to differ between language pairs.
4. **Lessons and exercise instances are versioned JSON data**. Exercise renderers are separately versioned software.
5. Published course releases are immutable manifests. A revision must consider migration of existing learner progress.
6. AI content generation is an offline editorial process, separate from a learner-facing AI coach.

The original approved Blueprint and course-production documents must be imported from their authoritative originals. This scaffold does **not** invent or replace them.

See [Architecture rules](architecture/README.md) and [Content rules](content/README.md).
