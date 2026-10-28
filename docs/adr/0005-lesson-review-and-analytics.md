# ADR-0005 — Lesson-origin reviews and actual-progress dashboard

Status: proposed implementation (not deployed until all repository gates succeed).

## Data model

- `progress.pinnedReviewIds: string[]` contains canonical IDs, not copies of lesson vocabulary. Selecting a lesson word prioritizes that unintroduced card **after due and unfinished zero-box reviews** and subject to the user's daily admission limit.
- Custom phrases from the lesson store one `leitnerAdded` entry, including `lessonId`, optional `sectionId`, example and stable `en:custom:<normalized text>` identifier. Existing content words and inflected forms are matched to the same bank entry before insertion; duplicate custom text does not create duplicate cards.
- `progress.leitnerV2` remains the only scheduler state. Adding a pinned word **does not prematurely advance** its box or invent a due date.
- The optional `source` for each card is a real lesson deep link, not a guessed dictionary reference. Semantic word relations remain curated-only.
- The Dashboard uses `reviewSummary` and recorded `history` for review counts, genuine due counts and mastered (box 64) counts. It uses the active curriculum for completion percentages. The old unsupported badges and placeholder statistics are removed from the main dashboard.

## Limitations and acceptance

The static GitHub Pages app continues to store data in local browser storage; no login or automatic multi-device sync exists. Verify 24 active lessons as read from the pinned curriculum, TTS, mobile keyboard and scrolling, import/export backups, offline service-worker cache versioning, and no data loss under migration. The original `npm test` and `npm run build` must pass on the real Git repository before a merge.
