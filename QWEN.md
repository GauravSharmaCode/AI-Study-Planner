# QWEN.md

This file provides guidance to QWEN when working with code in this repository.

For the complete project guide, refer to **CLAUDE.md** in the root directory.

## Quick Reference

### Build & Test

```bash
npm install          # Install dependencies
npm run build        # Build all services (Prisma + TypeScript)
npm run dev          # Run both services concurrently
npm test             # Run all tests
npm run lint         # Lint all workspaces
npm run format       # Format with Prettier
```

### Docker

```bash
docker-compose up -d --build    # Start all services
docker-compose logs -f          # View logs
docker-compose down              # Stop services
```

### Key Files

| File | Purpose |
|------|---------|
| `services/user-service` | Authentication, JWT, user profiles |
| `services/ai-schedule-service` | AI study plan generation, BullMQ workers |
| `apps/nginx-gateway` | Reverse proxy, routes `/api/v1/*` |
| `docker-compose.yml` | Service orchestration |

### Important Conventions

- TypeScript: `strict: true`, never import from `dist/`
- Services communicate via HTTP through NGINX (port 8080)
- Use Zod for validation, infer types from schemas
- Logging: `winston` in AI Schedule Service, `@gauravsharmacode/neat-logger` in User Service
- Never use `console.*` in production code
- Default branch: `dev`, PRs to `dev`

For detailed documentation, see [CLAUDE.md](./CLAUDE.md).