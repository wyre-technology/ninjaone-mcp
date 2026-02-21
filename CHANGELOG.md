## [1.1.3](https://github.com/wyre-technology/ninjaone-mcp/compare/v1.1.2...v1.1.3) (2026-02-18)


### Bug Fixes

* strip npm scope from MCPB bundle filename ([64479dc](https://github.com/wyre-technology/ninjaone-mcp/commit/64479dc93cfd7b3a441e9fc5256fbc8080dfdbca))

## [1.1.2](https://github.com/wyre-technology/ninjaone-mcp/compare/v1.1.1...v1.1.2) (2026-02-18)


### Bug Fixes

* convert pack-mcpb.js to ESM imports ([8fad901](https://github.com/wyre-technology/ninjaone-mcp/commit/8fad9016da2018a4710f0d4e930446230eaeb3b7))

## [1.1.1](https://github.com/wyre-technology/ninjaone-mcp/compare/v1.1.0...v1.1.1) (2026-02-18)


### Bug Fixes

* **ci:** fix release workflow failures ([5d315f5](https://github.com/wyre-technology/ninjaone-mcp/commit/5d315f58e2fca5859274391266eead4163b57111))

# [1.1.0](https://github.com/wyre-technology/ninjaone-mcp/compare/v1.0.2...v1.1.0) (2026-02-17)


### Features

* add MCPB bundle to release workflow ([d04a667](https://github.com/wyre-technology/ninjaone-mcp/commit/d04a667c8bf1cb0b4a651f2d33294ba6ac1ae9c2))
* add MCPB manifest for desktop installation ([15d1152](https://github.com/wyre-technology/ninjaone-mcp/commit/15d115252c3b2d2a60a50227b1b1ac72504b829e))
* add MCPB pack script ([6a4573f](https://github.com/wyre-technology/ninjaone-mcp/commit/6a4573fa7a9e212d3dc2b93b1b831f3fff486d37))

## [1.0.2](https://github.com/wyre-technology/ninjaone-mcp/compare/v1.0.1...v1.0.2) (2026-02-17)


### Bug Fixes

* **docker:** drop arm64 platform to fix QEMU build failures ([e64acd8](https://github.com/wyre-technology/ninjaone-mcp/commit/e64acd8e977c164d440d931d51923b821e37fe04))

## [1.0.1](https://github.com/wyre-technology/ninjaone-mcp/compare/v1.0.0...v1.0.1) (2026-02-17)


### Bug Fixes

* update all references from [@asachs01](https://github.com/asachs01) to [@wyre-technology](https://github.com/wyre-technology) scope ([a89a28f](https://github.com/wyre-technology/ninjaone-mcp/commit/a89a28f23c2d6cf1ab2955dfaa6da1d51e379022))

# 1.0.0 (2026-02-17)


### Bug Fixes

* **ci:** add GITHUB_TOKEN build-arg for npm auth during Docker build ([1ddf2fb](https://github.com/wyre-technology/ninjaone-mcp/commit/1ddf2fbbc0b9eec7601a28ea7c3e24fa5abe4515))
* **ci:** add npm auth for GitHub Packages, use Node 20/22, fix duplicate step IDs ([1d6252d](https://github.com/wyre-technology/ninjaone-mcp/commit/1d6252d9bd72425e4641d4b9c42e469818eb8a4e))
* **ci:** update .npmrc package scope to [@wyre-technology](https://github.com/wyre-technology) ([95dfc79](https://github.com/wyre-technology/ninjaone-mcp/commit/95dfc79c0c390fe279698b22317c2f65d45e4b35))
* **ci:** update peerDependencies scope from [@asachs01](https://github.com/asachs01) to [@wyre-technology](https://github.com/wyre-technology) ([c1b96b7](https://github.com/wyre-technology/ninjaone-mcp/commit/c1b96b71e312c514d0ccd5185ec45c4308cc542c))
* **deps:** add semantic-release plugins as devDependencies ([61ad598](https://github.com/wyre-technology/ninjaone-mcp/commit/61ad5980c629d3208a361603eb7881660a27623e))
* **docker:** simplify Dockerfile — no private deps needed ([0293033](https://github.com/wyre-technology/ninjaone-mcp/commit/0293033ccf0fea6faf002604e00d252ee7a04681))
* escape newlines in .releaserc.json message template ([46f26d0](https://github.com/wyre-technology/ninjaone-mcp/commit/46f26d060326779b05a11c69be719e3f9464c623))
* regenerate package-lock.json with semantic-release deps ([782d199](https://github.com/wyre-technology/ninjaone-mcp/commit/782d199b52633eb518668eadfdbf97f01d083a29))
* remove .npmrc — no private dependencies ([da1c5b9](https://github.com/wyre-technology/ninjaone-mcp/commit/da1c5b9b670c95e0c5abf1fbe1b1ab83d03514d7))
* remove unnecessary GitHub Packages auth from CI (no private deps) ([718ef9b](https://github.com/wyre-technology/ninjaone-mcp/commit/718ef9bd4cced5422452c523e45f8246dd95d5d0))
* remove unnecessary GITHUB_TOKEN auth from Dockerfile (no private deps) ([8ce6d63](https://github.com/wyre-technology/ninjaone-mcp/commit/8ce6d63e0621c6295e8901da57addd3179db4023))
* remove unused peerDependency on node-ninjaone (client code is inline) ([d8ef67a](https://github.com/wyre-technology/ninjaone-mcp/commit/d8ef67a076e8d18405b4267d01760268d6a0c21d))


### Features

* Add HTTP transport, Docker containers, and deployment configs ([14c28d3](https://github.com/wyre-technology/ninjaone-mcp/commit/14c28d35a5b3488d79b05bd0b4eb87a3f8ef1ffc))
* add mcpb packaging support ([22e68d5](https://github.com/wyre-technology/ninjaone-mcp/commit/22e68d5abed1a0c8431c779d747369f50df0fc51))
* add mcpb packaging support ([71c1d86](https://github.com/wyre-technology/ninjaone-mcp/commit/71c1d8682a4dac1dcfe40207e0ff17d39c90e067))
* add mcpb packaging support ([1c2b798](https://github.com/wyre-technology/ninjaone-mcp/commit/1c2b798d6bcc1b09f4459ead2f568bf7184ef440))
* add mcpb packaging support ([9d60a8d](https://github.com/wyre-technology/ninjaone-mcp/commit/9d60a8dcc9e9aac11cf8fbcffde4fa901de96387))
* add mcpb packaging support ([5036bef](https://github.com/wyre-technology/ninjaone-mcp/commit/5036bef22f75fc32a0a2110e4bdaed9062648d6f))
* add one-click deploy badges to README ([d1d6979](https://github.com/wyre-technology/ninjaone-mcp/commit/d1d6979adb702393c60990dc713dd55f3ff0908b))
* Initial release of NinjaOne MCP server ([2b1b9d4](https://github.com/wyre-technology/ninjaone-mcp/commit/2b1b9d4d2aff362b6ffca5f37e59cbee29868223))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Structured logger utility (`src/utils/logger.ts`) with `LOG_LEVEL` env var support (`debug` | `info` | `warn` | `error`)
- API call/response logging in all domain handlers (organizations, devices, alerts, tickets)
- Response shape validation with warnings when API returns unexpected structure
- Tool call logging in `index.ts` (incoming requests, completion, errors with stack traces)
- Credential diagnostic logging in `client.ts` (warns on missing creds or invalid region)
- Enhanced `/health` endpoint with credential status, log level, and version info (returns 503 when credentials are missing)
- Startup logging with transport type, log level, and Node.js version
- Initial release of NinjaOne MCP server
- Decision tree architecture with lazy loading
- Devices domain (list, get, reboot, services, alerts, activities)
- Organizations domain (list, get, create, locations, devices)
- Alerts domain (list, reset, reset_all, summary)
- Tickets domain (list, get, create, update, add_comment, comments)
- Multi-region support (US, EU, Oceania)
- OAuth 2.0 authentication via client credentials
- Comprehensive test suite with Vitest
- HTTP Streamable transport with gateway authentication support
- Dockerfile with multi-stage build, non-root user, and OCI labels
- docker-compose.yml with production and development services
- Cloudflare Workers entry point (`src/worker.ts`) and `wrangler.json`
- DigitalOcean App Platform deployment config (`.do/app.yaml`)
- HTTP transport test suite (15 tests for health, 404, env mode, gateway auth)

### Fixed
- Empty `{}` responses from list endpoints when API returns unexpected response shape (now falls back to empty arrays via nullish coalescing)
