# Locked universal learning path and editorial workflow

**Source of truth:** `content/curriculum/universal-path.v1.json` contains the approved **128** full communicative outcomes after the owner's 2026-10-27 stage-two amendment:
A1 (36), A2 (30), B1 (29), B2 (33). A1 is divided into three 12-lesson stages: 1–12, 13–24, 25–36. Every entry includes title, dominant axis, full can-do outcome, prerequisite/bridge text, prerequisite IDs, global concept, scope boundary and proposed activity archetypes.

**A1.2 implemented sequence:** A1-13 خوراکی و آشپزخانه؛ 14 وعده‌ها؛ 15 مقایسهٔ ساده؛ 16 پوشاک؛ 17 اعضای بدن؛ 18 بیماری و کمک‌خواستن (بدون مراجعهٔ درمانی مفصل)؛ 19 مشاغل ساده؛ 20 خرید؛ 21 صورت‌حساب و رسید؛ 22 مکان‌های شهر؛ 23 آدرس و مسیر کوتاه؛ 24 حمل‌ونقل. Each has two authored sections and independent real-world production. Existing A1-1..14 content files and learner progress remain intact.

**Deferred, not silently moved:** the earlier A1-23 daily-routine and A1-24 habit/frequency objectives were displaced by the owner's new stage-two sequence. Their exact former rows are archived in `legacy-alignment.json`. The owner instructed that stage three remain untouched. Consequently A1-25/26 and related future rows may still refer to the former A1-23 time-sequencing prerequisite; resolve that bridge only after explicit authorization to edit stage three. Passing CI does not mean this pedagogical bridge is resolved.

The owner's original 2 October 2026 rewrite and later explicit amendments are recorded in `01-universal-learning-path.md`. The Git blob checksums of that file and the machine-readable derived table are pinned in `content/curriculum/roadmap.lock.json`. This is a **default educational contract** across language pairs; an explicit new owner amendment overrides it.

## New lesson
Run:

```sh
npm run curriculum:plan -- A1-10
npm run curriculum:status
npm test
npm run build
```

Use the first command's canonical output to plan the exact communicative mission, new/reused vocabulary, prerequisite bridge and independent check. In each new lesson add:

```json
{
  "roadmapRef": {
    "id": "A1-10",
    "revision": "2026-10-02-rewrite-1",
    "communicativeOutcome": "Copy the exact communicativeOutcome from curriculum:plan"
  }
}
```

This is a machine-checked reference, not a license to replace the objectives with a different theme. Local language-specific grammar expands the teaching *inside* the lesson boundary; it does not silently reorder or replace objectives. For new language pairs, use the same IDs and global order.

## Controlled amendment requested by the owner

1. Obtain a **clear, explicit instruction** from the product owner (not an assistant suggestion) naming the approved change.
2. Append an entry to `roadmap.lock.json → approvedChanges` with at least `revision`, `authorizedBy: "product-owner"`, `decisionReference` and `rationale`; increment `approvedRevision`.
3. Apply the change to the archived source table and regenerate `universal-path.v1.json` fields including target, prerequisites and scope. Update source/manifest Git blob SHAs in the lock.
4. Adjust both pair-specific curriculum displays, language-specific rules, content and tests as appropriate.
5. Record old ID/version → new ID/version mapping and migration of learner progress before enabling new content. Preserve old data and review traces.
6. Require clean CI and a visible PR review. No tool can cryptographically prove a chat instruction came from the owner; owner approval and branch protection remain organizational controls.

## Transition from October 2026 preview

The first nine A1 lesson files are real authored pilot content, not nine approved goals. A1-1/2 match the new path; A1-3 needs **have / don't have**; A1-4 is about location (the title has been aligned); A1-5 needs **11/12 and colors** alongside number/plural practice. Old A1-6..9 teach four different topics from the approved slots.

`content/curriculum/legacy-alignment.json` pins old A1-6..9 content Git blobs. CI rejects accidental edits to these historically misassigned lessons and new A1 publication until the transition is complete. They remain available for current learners. Their historical progress MUST NOT automatically transfer to the same lesson number after goal replacement; migration requires distinct content versions or a deliberately reviewed state map. After successful migration, retire only the corresponding frozen exception and activate normal strict checking.

Do not hide missing instruction by a green build or mark a gap as complete solely because a phrase appears somewhere in the lesson. Track introduction, multiple meaningful practice contexts, independent production and review separately.
