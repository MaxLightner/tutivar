# ADR-0003 — Local learner progress, recovery and portability

Status: implemented in phase 3 (2026-10-27); cross-device cloud sync deferred.

## Invariants

- Existing `tutivar:fa-en:preview:v1` remains the canonical browser key. No lesson, curriculum or archive content is modified.
- Existing `migrateLegacyProgress()` performs curricular renumbering. The storage adapter preserves its source data in a previous-good slot prior to writing a migrated state.
- A malformed primary value cannot be silently overwritten. If a valid previous-good snapshot exists, load it into memory and require explicit user confirmation to replace the corrupt primary.
- Stale writes from another browser tab are rejected rather than overwriting newer learner activity. The learner can export the local in-memory progress and reload the newer saved state.
- Browser storage failures are surfaced in the UI rather than pretending the progress was saved. The page remains usable but its changes may be volatile until repaired.
- Section resume tracks the exact unfinished section per lesson using `lastLessonId` and `lastSectionByLesson`, while preserving prior completion/assessment semantics.
- A downloadable `tutivar-learner-progress` v1 JSON backup includes a format, pair ID and non-cryptographic corruption-detection checksum. Import requires a confirmation because it replaces progress, and rejects invalid, oversized, mismatched or corrupt files.
- No user account, cloud backend, automatic sync, Leitner scheduling, or remote database is provided by this phase. Each browser profile has an independent local record. Manual export/import transfers progress but does not merge histories.

## Known boundaries

Browser data can disappear when users clear site data, use private mode, or uninstall the PWA; advise backups. localStorage has implementation-specific quotas; excessive writes may fail. Backup files contain learning activity history and should be handled as private personal information. The FNV checksum detects accidental corruption but does not authenticate files. UI manual testing is required on installed PWA and mobile browsers.
