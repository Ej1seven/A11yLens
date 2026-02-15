# Setup & Deployment

## Local Development

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

## Local Database

Default uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

Useful Prisma commands:

```bash
npx prisma studio
npx prisma generate
npx prisma db push
```

## Production Notes

### 1. Database

Use PostgreSQL in production and update `DATABASE_URL`.

### 2. Build/Run

```bash
npm run build
npm run start
```

### 3. Required env vars

```env
DATABASE_URL="postgresql://..."

# Optional scanner defaults
SCAN_CRAWL_MAX_PAGES=50
SCAN_CRAWL_MAX_DEPTH=5
```

### 4. Session cookie behavior

- Cookie name: `a11ylens_session`
- `secure=true` in production
- `httpOnly`, `sameSite=lax`

## Vercel

1. Import repo in Vercel
2. Set environment variables
3. Ensure database is reachable from Vercel
4. Add build command if needed:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma db push && next build"
  }
}
```

## Troubleshooting

### Prisma client errors

```bash
npx prisma generate
```

### Schema drift / local reset

```bash
npx prisma db push --force-reset
```

### Port already in use

```bash
lsof -ti:3000 | xargs kill
```
