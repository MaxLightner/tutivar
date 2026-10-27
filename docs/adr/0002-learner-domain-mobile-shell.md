# ADR-0002 — Learner contracts and mobile-first core (2026-10-27)

Status: Accepted for the phase 1/2 implementation; backend and Leitner algorithm deferred.

## Context

The working learner is a static GitHub Pages PWA with canonical JSON lessons, two lesson parts, an existing localStorage preview and curriculum revision migration. The approved A1 roadmap contains 36 lesson IDs and the live manifest currently exposes A1-1 through A1-24 as `sample`; other material is planned. The interface had prototype community and AI features competing with the actual lesson/review path.

## Decision

- Preserve curriculum, lesson files, existing URLs, migration logic, lesson activity renderers and progress key.
- Add versioned `User`, `Lesson`, `LessonProgress`, `ReviewCard` and `ReviewHistory` JSON contracts in `schemas/learner-domain.v1.schema.json`. IDs are stable and not array positions.
- Make `apps/learner-web/learning-contracts.js` the pure boundary adapter used by the static learner for catalog status, resume selection and honest lesson counts. Domain constructors explicitly reserve fields for review history and future scheduling.
- Keep the legacy localStorage preview object as-is until phase 3's persistence migration; **do not** silently wipe records, claim cross-device synchronization, or count rehearsal taps as Leitner mastery.
- Focus visible navigation on Home, Lessons, Review (preview) and Progress; community, coach, market and gamification remain out of the core interface. Use semantic buttons, `aria-current`, mobile safe areas and 44px touch targets.
- Build the pages from actual manifest lesson IDs and statuses. Planned lessons cannot be opened. Never hard-code sample counts.

## Deferred work

Phase 3: a durable persistence adapter, per-section resume and anonymous/session identity choice, migration/backups and optional cross-device synchronization.
Phase 4: review scheduler, due dates, event history, deck algorithms, offline behavior.
Phase 5: card authoring from arbitrary vocabulary/phrase/sentence contexts, source deep links and duplicate handling.
Phase 6: dashboard metrics from persisted events, not hypothetical targets.
Phase 7: device/browser testing, accessibility audit and production release.

## Verification

Test model constructors, sample filtering, section-start resume behavior and empty sets; retain all existing curriculum and lesson test gates. The branch is reviewable before main deployment.
