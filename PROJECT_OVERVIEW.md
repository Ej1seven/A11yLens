# A11yLens Project Overview

## Summary

A11yLens is an authenticated accessibility scanning platform where users:

- create projects
- add websites/pages
- run accessibility scans
- review issues by severity/type/page
- invite collaborators to shared projects
- export CSV reports

## Current Capabilities

- Custom email/password auth with session table + cookie
- Owner/collaborator access model
- Collaboration invite workflow (pending/accepted/rejected)
- Project-level site management
- Configurable scan limits (max pages, max depth)
- Crawl-first scan pipeline (discover pages, then run axe-core scan)
- Chart-based result analysis and grouped issue presentation

## Core Pages

- `app/login/page.tsx`
- `app/page.tsx`
- `app/projects/[id]/page.tsx`
- `app/scans/[scanId]/page.tsx`
- `app/account/page.tsx`
- `app/about-us/page.tsx`

## Core APIs

- Auth: `app/api/auth/*`
- Projects: `app/api/projects/*`
- Invites: `app/api/invites/*`
- Sites/Scans: `app/api/sites/*`, `app/api/scans/*`
- Crawl: `app/api/crawl/route.ts`

## Data Model (Prisma)

- `User`
- `Session`
- `Project`
- `ProjectCollaborator`
- `CollaborationInvite`
- `Site`
- `Scan`
- `Issue`

## What Changed From Earlier Iterations

- Authentication and collaboration are no longer stretch goals; they are implemented.
- Crawler setup is integrated into the app codebase.
- axe-core scanning is integrated and active.
