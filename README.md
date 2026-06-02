# VIVAR REALTY SERVER

## Tech Stack

| Layer            | Technology                            |
| ---------------- | ------------------------------------- |
| Runtime          | Node.js 20 + TypeScript               |
| Framework        | Express.js                            |
| Database         | PostgreSQL 15 + PostGIS (geo queries) |
| Cache / Queues   | Redis 7                               |
| Auth             | JWT (access + refresh tokens)         |
| Validation       | Joi                                   |
| Logging          | Winston                               |
| Job Queue        | Bull                                  |
| Image Processing | Sharp                                 |

---

## Project Structure

```
real-estate-api/
├── src/
│   ├── server.ts              # Entry point — connects DB/Redis, starts server
│   ├── app.ts                 # Express app factory — middleware + routes
│   │
│   ├── config/
│   │   ├── env.ts             # Env var validation & export
│   │   ├── database.ts        # PostgreSQL pool + transaction helper
│   │   ├── redis.ts           # Redis client + cache helpers
│   │   └── logger.ts          # Winston structured logger
│   │
│   ├── types/
│   │   └── index.ts           # Shared interfaces, enums, API response types
│   │
│   ├── middleware/
│   │   ├── authenticate.ts    # JWT verification + role-based auth
│   │   ├── errorHandler.ts    # Global error → JSON response
│   │   ├── rateLimiter.ts     # express-rate-limit (global + auth)
│   │   ├── notFound.ts        # 404 handler
│   │   └── requestLogger.ts   # Structured per-request logging
│   │
│   ├── routes/
│   │   ├── auth.routes.ts     # /auth — register, login, refresh, logout
│   │   ├── property.routes.ts # /properties — CRUD
│   │   ├── search.routes.ts   # /search — filtered + geo search
│   │   ├── user.routes.ts     # /users — profile management
│   │   ├── agent.routes.ts    # /agents — agent profiles
│   │   ├── booking.routes.ts  # /bookings — property tours
│   │   ├── review.routes.ts   # /reviews — agent reviews
│   │   ├── upload.routes.ts   # /uploads — image upload
│   │   └── admin.routes.ts    # /admin — admin-only operations
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── property.controller.ts
│   │                          # Thin HTTP layer: parse → call service → respond
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   └── auth.service.ts        # Register, login, JWT issuance
│   │   ├── property/
│   │   │   └── property.service.ts    # CRUD + cache-aside pattern
│   │   ├── search/
│   │   │   └── search.service.ts      # Full-text + geo search + pagination
│   │   ├── user/                      # Profile management (TODO)
│   │   ├── notification/              # Email notifications (TODO)
│   │   └── upload/                    # Image upload + Sharp processing (TODO)
│   │
│   ├── validators/
│   │   └── property.validator.ts      # Joi schemas + validateBody middleware factory
│   │
│   ├── jobs/
│   │   └── queues.ts                  # Bull queues: emailQueue, imageQueue
│   │
│   └── utils/
│       └── AppError.ts                # Operational error class
│
├── migrations/
│   └── 001_initial_schema.sql         # Full DB schema with indexes + triggers
│
├── tests/                             # Jest unit + integration tests
├── docs/                              # API documentation (Swagger / Postman)
├── docker-compose.yml                 # PostgreSQL + Redis for local dev
├── .env.example                       # All required environment variables
├── tsconfig.json
└── package.json
```
