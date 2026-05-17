# Changelog

## 1.0.0 (2026-05-17)


### Features

* add GitHub Actions CI workflow with quality checks ([feec0f4](https://github.com/rferic/027app/commit/feec0f4aaf598c08987bf295aad0cc1add55aa61))
* add release-please workflow and update README ([53ca25e](https://github.com/rferic/027app/commit/53ca25e2015f36da2b83c76b4d5f738800400144))
* add security headers to next.config.ts ([1873ad5](https://github.com/rferic/027app/commit/1873ad54fd1a8e9dadd90499227f42b2b35c1b14))
* implement sprints 1-3 (apps system, shell, permissions, app infrastructure) ([4768b80](https://github.com/rferic/027app/commit/4768b800ec39037694e57de62e6148730eef4f48))
* Sprint 4 - deploy infra + fixes ([5a253e1](https://github.com/rferic/027app/commit/5a253e1741f17bf962b5f8958cf2fedba541c9e7))


### Bug Fixes

* add error handling to prevent install form from hanging ([51c68fe](https://github.com/rferic/027app/commit/51c68fe43888a187d4aad51f64c9156d627f6386))
* force dynamic rendering for install page ([4e02fd3](https://github.com/rferic/027app/commit/4e02fd3ae2b20c213d72397dc8b0ebcc8b92adce))
* increase scanInstalledAppSlugs timeout to 2s ([bb3b749](https://github.com/rferic/027app/commit/bb3b749f7136280378b6f797569682df08a547ee))
* make migrations idempotent for Supabase prod ([595a431](https://github.com/rferic/027app/commit/595a431731a070fdca5c8e86ec729c017b68a4f1))
* prevent document access during SSR in install form ([2e3a931](https://github.com/rferic/027app/commit/2e3a9314f8214805f90c02c83c0f0669a1127532))

## [Unreleased]

## [0.1.0] - 2026-05-10
### Added
- Sistema de apps (Sprint 1): tipos, DB, installer, admin panel, todo app
- Shell pública mobile-first (Sprint 2): header, bottom nav, dashboard
- Permisos por app: visibility public/private, app_permissions
- Sitio de documentación /doc con MDX

[Unreleased]: https://github.com/ericrf/027apps/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ericrf/027apps/releases/tag/v0.1.0
