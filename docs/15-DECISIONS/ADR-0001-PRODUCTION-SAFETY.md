# ADR-0001 — Production Safety Gate

## Context
TransMind production must remain stable while UI, SEO, AI, and growth work continues.

## Decision
Use branch-based development and pull requests. Treat `main`, CNAME, DNS, hosting configuration, and production integrations as protected. Production changes require explicit user approval.

## Consequences
Development can proceed independently without changing live production. Every release has a traceable PR, commit, QA evidence, and deployment result.