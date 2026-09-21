# SkillNest

<div align="center">

### 🌟 Enterprise-Grade Full-Stack Community Platform
**Discover, Host, and Grow Real-World Hobby & Skill-Sharing Cohorts**

[![CI](https://github.com/darksoul-atik/SkillNest/actions/workflows/ci.yml/badge.svg)](https://github.com/darksoul-atik/SkillNest/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-ea2845?logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)](https://nextjs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-12.5-orange?logo=pnpm)](https://pnpm.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

</div>

---

## 📋 Table of Contents
1. [Architecture & Highlights](#-architecture--highlights)
2. [Monorepo Structure](#-monorepo-structure)
3. [Technology Stack](#-technology-stack)
4. [Getting Started](#-getting-started)
5. [Environment Variables](#-environment-variables)
6. [API Specification](#-api-specification)
7. [Database & Storage](#-database--storage)
8. [Testing & Quality Assurance](#-testing--quality-assurance)
9. [Production Deployment with Docker](#-production-deployment-with-docker)

---

## 🚀 Architecture & Highlights

**SkillNest** is an enterprise rewrite of a hobby community app built as a **pnpm + Turborepo monorepo**. It replaces all third-party identity dependencies with a hardened, in-house security layer and high-performance binary storage:

- **Zero Firebase Dependency**: Custom authentication using Argon2id password hashing, 15-minute in-memory JWTs, 7-day `httpOnly` refresh cookies with token rotation, session tracking, and reuse detection revoking compromised session families.
- **MongoDB GridFS Media Pipeline**: Native image uploads without external SaaS costs. Includes magic-byte sniffing (`file-type`), EXIF stripping, WebP compression via `sharp`, 320x320 thumbnail generation, SHA-256 deduplication, HTTP 304 caching with ETags, and Range request streaming.
- **Race-Safe Atomic Memberships**: Group capacity enforced through atomic MongoDB conditional updates (`$inc: { memberCount: 1 }` with `$lt: ['$memberCount', '$maxMembers']`), completely eliminating race conditions and overbooking.
- **Shared Validation Contracts (`@skillnest/shared`)**: Single source of truth with Zod schemas inferred across backend controllers, database documents, and frontend React Query hooks.
- **Next.js 15 App Router Frontend**: Optimized client interface with TanStack Query v5, Axios 401 automatic refresh queues, optimistic updates, and Rubik / Raleway typography.

---

## 📁 Monorepo Structure

```
SkillNest/
├── packages/
│   └── shared/                  # Shared Zod schemas, TypeScript types, and enums
│       ├── src/
│       │   ├── enums/           # UserRole, GroupCategory, GroupStatus, MediaPurpose
│       │   ├── schemas/         # Auth, Group, Membership, Comment, Reply, Pagination
│       │   └── index.ts
│       ├── tsup.config.ts       # ESM & CJS dual build output
│       └── package.json
│
├── apps/
│   ├── api/                     # NestJS 11 Backend API
│   │   ├── src/
│   │   │   ├── common/          # Filters, Pipes, Interceptors, Guards, Pagination helper
│   │   │   ├── config/          # Zod environment validation schema
│   │   │   ├── database/        # Mongoose connection & repositories
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # Local & OAuth authentication, token rotation, sessions
│   │   │   │   ├── users/       # User entity & profile management
│   │   │   │   ├── admin/       # Role & status management, system metrics
│   │   │   │   ├── media/       # GridFS bucket streaming, sharp pipeline, cron cleanup
│   │   │   │   ├── groups/      # Groups, atomic conditional joins, policies
│   │   │   │   ├── comments/    # Discussion board, host-only replies, cascade counts
│   │   │   │   └── health/      # Liveness and database connectivity probes
│   │   │   ├── scripts/         # Admin seeder & demo data seeder
│   │   │   └── main.ts
│   │   ├── test/                # Unit tests and E2E test suite
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                     # Next.js 15 App Router Frontend
│       ├── src/
│       │   ├── app/             # App Router pages (Home, Groups, Dashboard)
│       │   ├── components/      # UI primitives, Navbar, Modals, Discussion cards
│       │   ├── hooks/           # TanStack Query domain hooks (useAuth, useGroups, etc.)
│       │   ├── lib/             # Axios instance with 401 refresh queue, QueryClient
│       │   ├── providers/       # QueryProvider, AuthInitializer
│       │   └── stores/          # Zustand client auth store
│       ├── Dockerfile
│       └── package.json
│
├── .github/workflows/ci.yml     # Automated CI pipeline
├── docker-compose.yml           # Full-stack containerized orchestrator
├── pnpm-workspace.yaml          # pnpm workspace declaration
├── turbo.json                   # Turborepo task pipeline
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Monorepo** | pnpm 12 + Turborepo | Fast, symlinked workspace dependency caching |
| **Shared** | Zod + tsup | Universal data contracts and dual ESM/CJS compilation |
| **Backend** | NestJS 11 + Express | Modular architecture, DI container, REST controllers |
| **Database** | MongoDB 7 + Mongoose | Document datastore with GridFS binary streaming |
| **Security** | Argon2id + Passport + JWT | State-of-the-art password hashing & token rotation |
| **Media** | Sharp + File-Type | EXIF stripping, WebP compression, magic-byte checking |
| **Frontend** | Next.js 15 App Router + React 19 | Server/Client rendering, routing, and metadata |
| **Data Layer** | TanStack Query v5 + Axios | Cache invalidation, 401 token refresh queue, optimistic UI |
| **Styling** | Tailwind CSS + Lucide Icons | Responsive layout, dark mode, accessible components |
| **DevOps** | Docker + Docker Compose + GH Actions | Multi-stage production containers and automated CI |

---

## 🏁 Getting Started

### Prerequisites
- **Node.js**: `v22.x` or `v24.x`
- **pnpm**: `v12.x` (`corepack enable && corepack prepare pnpm@latest --activate`)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/skillnest`) or Docker

### Installation
```bash
# Clone the repository
git clone https://github.com/darksoul-atik/SkillNest.git
cd SkillNest

# Install all workspace dependencies
pnpm install

# Build shared package
pnpm --filter @skillnest/shared build
```

### Environment Configuration
```bash
# Setup backend environment
cp apps/api/.env.example apps/api/.env

# Setup frontend environment
cp apps/web/.env.example apps/web/.env.local
```

### Seed Demo Data
```bash
# Seed initial administrator account (admin@skillnest.dev / AdminSecurePassword123!)
pnpm --filter @skillnest/api build
pnpm --filter @skillnest/api seed:admin

# Seed demo groups, WebP covers, members, and threaded comments
pnpm --filter @skillnest/api seed:data
```

### Development Mode
```bash
# Start all services concurrently (API on :3000, Web on :5173)
pnpm dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Interactive Swagger Docs**: [http://localhost:3000/docs](http://localhost:3000/docs)

---

## 🔑 Environment Variables

### Backend (`apps/api/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | API listen port | `3000` |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `WEB_ORIGIN` | Allowed CORS frontend origin | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string (**Keep Secret!**) | `mongodb://localhost:27017/skillnest` |
| `JWT_ACCESS_SECRET` | Secret key for access tokens (min 16 chars) | `required` |
| `JWT_ACCESS_TTL` | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET`| Secret key for refresh tokens (min 16 chars) | `required` |
| `JWT_REFRESH_TTL` | Refresh token cookie lifetime | `7d` |
| `ADMIN_EMAIL` | Email for initial administrator | `admin@skillnest.dev` |
| `ADMIN_PASSWORD` | Password for initial administrator | `AdminSecurePassword123!` |

### Frontend (`apps/web/.env.local`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Public base URL for the backend API | `http://localhost:3000/api/v1` |

---

## 📡 API Specification

Interactive Swagger UI documentation is available at `http://localhost:3000/docs`.

### Key Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue tokens |
| `POST` | `/api/v1/auth/refresh` | Public (Cookie) | Rotate refresh token and issue new access token |
| `POST` | `/api/v1/auth/logout` | Protected | Revoke active session & clear cookie |
| `GET` | `/api/v1/groups` | Public | Keyset/cursor paginated group list |
| `GET` | `/api/v1/groups/:idOrSlug`| Public | Retrieve group details by ID or slug |
| `POST` | `/api/v1/groups` | Protected | Create new group (host auto-joined) |
| `PATCH`| `/api/v1/groups/:id` | Host / Admin | Update group details |
| `DELETE`| `/api/v1/groups/:id`| Host / Admin | Soft-delete group session |
| `POST` | `/api/v1/groups/:id/members`| Protected | Race-safe atomic join |
| `DELETE`| `/api/v1/groups/:id/members/me` | Protected | Leave group (host restricted) |
| `GET` | `/api/v1/groups/:id/comments` | Public | Get threaded discussions |
| `POST` | `/api/v1/groups/:id/comments` | Protected | Post community inquiry/comment |
| `POST` | `/api/v1/comments/:id/replies`| Host / Admin | Official host-only reply |
| `POST` | `/api/v1/media/upload` | Protected | Upload image to GridFS (Sharp processed) |
| `GET` | `/api/v1/media/:id` | Public | Stream optimized WebP image with ETag |
| `GET` | `/api/v1/media/:id/thumb` | Public | Stream 320x320 WebP thumbnail |

---

## 🧪 Testing & Quality Assurance

```bash
# Run backend unit tests (Cursor pagination, Media Sharp pipeline, Auth service)
pnpm --filter @skillnest/api test

# Run backend end-to-end integration tests (Auth flow, 20-request parallel join race test)
pnpm --filter @skillnest/api test:e2e

# Run typecheck across entire monorepo
pnpm -r typecheck

# Build all applications for production
pnpm -r build
```

---

## 🐳 Production Deployment with Docker

The entire platform can be deployed anywhere using Docker and Docker Compose:

```bash
# Build and run all services (MongoDB, NestJS API, Next.js Web)
docker compose up -d --build

# Inspect container status
docker compose ps

# View logs
docker compose logs -f
```

---

## 📄 License
This project is released under the **MIT License**.
