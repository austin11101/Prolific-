# Assumption 001: Sprint 0 Scope Source

## Context

`AGENTS.md` identifies `docs/14-roadmap/mvp-roadmap.md` as the MVP roadmap, but that file does not exist at the time Sprint 0 scaffolding begins.

## Assumption

For this task only, the user's explicit Sprint 0 request is the authoritative scope. Sprint 0 is limited to:

- establishing the monorepo directory structure;
- scaffolding the Flutter mobile application;
- scaffolding the NestJS core API;
- creating placeholder administration and content-engine directories with READMEs;
- configuring local PostgreSQL through Docker Compose;
- adding root environment examples and development commands;
- adding formatting and linting configuration; and
- adding continuous integration for static analysis and tests.

No product features, authentication implementation, database entities, lesson APIs, or reading-player behaviour are authorized by this assumption.

## Consequence

The missing roadmap remains a documentation gap. This assumption should be superseded when `docs/14-roadmap/mvp-roadmap.md` is created and approved.
