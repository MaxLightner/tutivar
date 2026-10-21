# Editable architecture (v0.1)

The **architecture lives in Git**, with Git history and reviewable change requests. `system.json` is the first machine-readable source for components; module contracts live in `registry/modules.json`.

## Principles

- One modular monorepo, with individually owned modules and independently deployable clients.
- Start with one modular backend deployment, not mandatory microservices.
- A module communicates through declared capabilities, events, and versioned APIs, not other modules' private files or database tables.
- Dependencies must form an acyclic graph. A new capability is added to the registry before it is consumed.
- JSON schemas describe lessons, exercises, courses, language pairs, and placement tests. IDs never depend on lesson display position.
- Content and renderers evolve separately. Breaking changes require a new contract version or an explicit migration.
- A new app or feature does not require copying user identity, learner progress, or course truth into another backend.
- A published lesson, placement test, or course cannot be modified in place; publish a revision and maintain progress compatibility.
- Each meaningful architectural change gets an ADR in `docs/adr/` and tests for affected contracts.

## Extension procedure

1. Register a new module's unique `id`, `provides`, and `requires` in `registry/modules.json`.
2. Define/update its JSON/API/event schemas, with explicit versioning.
3. Implement the module within its own directory and write its local tests.
4. Run contract validation and reverse-dependency tests before merging.
5. Publish using a feature flag or compatible release; document any data migration.

## Planned domains

Clients: `apps/web`, `apps/mobile`, `apps/admin`. Shared libraries: `packages/course-engine`, `packages/exercise-engine`, `packages/ui`, `packages/contracts`. Runtime services: `services/api` with domain modules for identity, progress, assessment, review, gamification, discussion, blog, and AI coaching.

These are planned boundaries, **not implemented services**. Physical package paths may change through reviewed ADRs; capability IDs and public contracts are the durable references.
