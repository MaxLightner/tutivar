# ADR-0001: Modular monorepo, editable contracts, JSON-first education

Status: **proposed**, 2026-10-21.

## Context

Tutivar needs multiple language pairs, variable lesson counts while preserving a fixed universal Blueprint, independently upgradeable exercises, placement testing, Leitner review, web and mobile, a backend, an AI coach, and optional future talking avatars.

## Decision

- One GitHub repository: **tutivar**.
- One modular backend initially; clients use the same authoritative user and progress data.
- Features register capabilities and dependencies; avoid private cross-module imports.
- Source-controlled architecture files and schemas can evolve through pull requests.
- Learning content is revisioned JSON; example fixtures are separate from publishable content.
- AI content-production tools can generate drafts but do not silently publish or edit the approved Blueprint.
- Historical learner progress remains tied to stable IDs and published course revisions.

## Consequences

We can add new modules or language pairs through declared contracts and incremental implementation. A contract-breaking edit still requires tests, impact analysis and migration; modularity cannot guarantee arbitrary edits are risk-free.
