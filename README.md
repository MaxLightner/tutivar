# Tutivar

An extensible, language-pair-independent learning platform. Content and app rendering are separate, so new language pairs do not require rebuilding the UI.

## Status

- Architecture baseline: `0.1.0` (draft)
- **Active pilot: Persian (`fa`) → English (`en`)**. Earlier `fa-de` stays as an unpopulated future pair.
- Mobile-first PWA learner preview: `apps/learner-web` (draft UI)
- Three runnable **illustrative, unapproved** A1 lessons, based on the A1-1, A1-2, A1-3 mechanisms in the 126-lesson review sheet. They do not supersede the approved Blueprint.
- No production course, placement exam, backend, social account, AI coach, or real Leitner scheduling yet.
- Files in `examples/` are illustrative fixtures, **not published educational content**.

## Structure

| Location | Responsibility |
| --- | --- |
| `architecture/` | Editable system boundaries and decisions |
| `registry/` | Module capabilities, dependencies, and planned features |
| `schemas/` | JSON content and module contracts |
| `content/` | Pair registrations, draft course manifests and sample teaching data |
| `examples/` | Non-published JSON examples for implementers |
| `tools/` | Validation and future content-publishing utilities |
| `apps/learner-web/` | Mobile-first PWA with Home, Lessons, Lesson Player, Leitner and Dashboard |
| `packages/` | Future shared learning and UI engines |
| `services/` | Future modular backend |

### Try the first UI + content slice

```sh
npm test
npm run build
# Serve the generated `dist/` folder with any static HTTP server.
# Example if you have Python installed:
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`. The app must be served over HTTP; it will not work directly from `file://` because lessons load as external JSON.

### GitHub Pages

`.github/workflows/deploy-pages.yml` validates the content, builds `dist/`, and deploys that folder on pushes to `main`. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Once GitHub Pages is enabled and the workflow completes successfully, the learner preview is at `https://maxlightner.github.io/tutivar/`. The app uses relative paths to support this subdirectory. The site is publicly reachable even if GitHub permits the repository to remain private; do not put secrets into `content/`.

The demo works without a backend. Completed lessons, review clicks, and written practice are saved only in this browser's `localStorage`. Review keys 1–7 **do not implement Leitner scheduling**. Chat, account sync, market and leaderboards are marked as upcoming.

### Editorial workflow

- `content/language-pairs/fa-en/preview-manifest.json` controls learner-facing path, CEFR levels, home messages and review-card samples.
- `content/language-pairs/fa-en/lessons/*.json` controls the lesson words, examples, dialogue, interaction data, and production prompts. Each lesson has two sections: word→sentence and dialogue→independent production.
- `apps/learner-web/app.js` holds reusable UI renderers (`conversation`, `family`, `ownership`), not specific lesson text. Edit the JSON to review content independently from layout.
- `content/language-pairs/fa-en/course.a1.demo.json` is a **draft** course contract; the real editorial course, workshops and final assessment must still be imported and approved.
- `npm run build` copies authored data into `dist/data/`. Do not edit `dist/` directly.
- To add future language pairs, create a new pair directory, data manifests and a pair selector. The rendering code should remain stable as new exercise types are registered.

This demo's wording and teaching progression require pedagogical review; passing automated tests is not educational approval.

## Non-negotiable learning boundaries

1. The **Universal Blueprint** establishes communicative order, across languages.
2. A language-pair **Grammar Map** supplies language differences; it cannot silently rewrite the Blueprint.
3. A pair-specific **course manifest** determines the finalized list and order of lessons, workshops per chapter, and a level-end assessment. Lesson counts are allowed to differ between language pairs.
4. **Lessons and exercise instances are versioned JSON data**. Exercise renderers are separately versioned software.
5. Published course releases are immutable manifests. A revision must consider migration of existing learner progress.
6. AI content generation is an offline editorial process, separate from a learner-facing AI coach.

The original approved Blueprint and course-production documents must be imported from their authoritative originals. This scaffold does **not** invent or replace them.

See [Architecture rules](architecture/README.md) and [Content rules](content/README.md).
