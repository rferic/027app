# Contributing to 027Apps

## Branch Strategy
- `main` — production branch, protected
- `feature/{modulo}-{description}` — new features (e.g. `feature/lista-compra-add-categories`)
- `fix/{modulo}-{description}` — bug fixes (e.g. `fix/recetas-fix-search`)
- `refactor/{modulo}-{description}` — code refactoring
- `docs/{modulo}-{description}` — documentation

## Commit Convention
We follow `[MODULO] Description` format:
- `[LISTA-COMPRA] Add category grouping to shopping items`
- `[RECETAS] Fix search filter not returning results`
- `[CALENDARIO] Add month view navigation`

The module tag should be uppercase and match the affected app module.

## Pull Request Process
1. Create a feature/fix branch from `main`
2. Make your changes following the commit convention
3. Open a PR targeting `main`
4. Ensure CI passes (lint, typecheck, tests, build)
5. Request review from at least one maintainer
6. Merge only after approval and green CI

## Getting Started
See [README.md](../README.md) for local setup instructions.
