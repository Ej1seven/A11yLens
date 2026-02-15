# A11yLens

A11yLens is a full-stack accessibility scanning dashboard built with Next.js, TypeScript, Prisma, and axe-core.

## Features

- Account auth (register, login, logout) with HTTP-only session cookies
- Project-based workflow for organizing sites
- Team collaboration via invite requests
- Website crawling to discover internal pages
- Accessibility scanning with axe-core + Puppeteer
- Severity breakdown (critical, warning, info)
- Scan filtering by severity and issue type
- CSV export for scan results

## Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Prisma ORM + SQLite (default)
- axe-core (`@axe-core/puppeteer`) + Puppeteer
- Recharts

## Requirements

- Node.js 18+
- npm

## Local Setup

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
DATABASE_URL="file:./dev.db"

# Optional scan defaults
SCAN_CRAWL_MAX_PAGES=50
SCAN_CRAWL_MAX_DEPTH=5
```

## App Routes

- `/login` - public login/register
- `/about-us` - public marketing/about page
- `/` - authenticated project dashboard
- `/projects/[id]` - project detail, scan controls, collaborators
- `/scans/[scanId]` - scan details/charts/issues
- `/account` - account profile view

## Authentication Model

- Cookie: `a11ylens_session`
- Middleware protects all non-public pages
- Public pages: `/login`, `/about-us`
- Public auth APIs: `/api/auth/*`

## API Surface

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Projects & Collaboration
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/[id]`
- `DELETE /api/projects/[id]`
- `GET /api/projects/[id]/collaborators`
- `POST /api/projects/[id]/collaborators`
- `GET /api/invites`
- `POST /api/invites/[id]` (`accept` or `reject`)

### Sites, Crawl, Scans
- `POST /api/sites`
- `POST /api/crawl`
- `POST /api/sites/[id]/scans`
- `GET /api/sites/[id]/scans`
- `GET /api/scans/[scanId]`
- `GET /api/scans/[scanId]/export`

## Notes

- The scanner currently launches Chrome using a macOS-specific executable path in `lib/scanner.ts`.
- If you run on Linux/CI, set or adjust Puppeteer launch configuration accordingly.
