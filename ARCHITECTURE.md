# Architecture

## High-Level

1. Client UI (Next.js pages/components)
2. Route Handlers (`app/api/*`) for auth, CRUD, scan orchestration
3. Prisma ORM for persistence
4. Scanner/crawler services in `lib/`

## Request Flow

### Authenticated page access

- `middleware.ts` checks `a11ylens_session` cookie
- Public pages: `/login`, `/about-us`
- Non-public paths redirect to `/login` when no session cookie exists

### Login/Register

- `POST /api/auth/register` creates user + hashed password
- `POST /api/auth/login` verifies credentials, creates session record
- Session token is stored as hash in DB and plaintext in HTTP-only cookie

### Project listing

- `GET /api/projects` returns projects where user is owner or collaborator

### Scan execution

- `POST /api/sites/[id]/scans`
- API creates scan row (`status=running`)
- Background process crawls URLs and scans each page with axe-core
- Scan row updated to `completed` + issue counts + issue rows

## Access Control

- `lib/access.ts` centralizes project access checks:
  - `userCanAccessProject`
  - `userCanManageProject`
- Owner-only actions (e.g., delete project, invite collaborator) enforce manage permission.

## Database Notes

Schema file: `prisma/schema.prisma`

Key relations:

- `Project.ownerId -> User.id`
- `ProjectCollaborator (projectId, userId)` unique
- `CollaborationInvite (projectId, inviteeId)` unique
- `Site -> Project`
- `Scan -> Site`
- `Issue -> Scan`
- `Session -> User`

## Scanner/Crawler

- `lib/crawler.ts` discovers internal pages from a start URL
- `lib/scanner.ts` uses `@axe-core/puppeteer`
- Scan limits come from API request or env fallback:
  - `SCAN_CRAWL_MAX_PAGES`
  - `SCAN_CRAWL_MAX_DEPTH`

## Caching

- `GET /api/auth/me` is explicitly non-cacheable (`dynamic='force-dynamic'`, `revalidate=0`, no-store headers)
- Client auth menu refreshes on route changes to prevent stale login/logout UI
