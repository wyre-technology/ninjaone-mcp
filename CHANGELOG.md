# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
