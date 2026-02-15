# Crawler Notes

The crawler is already integrated.

- Crawler implementation: `lib/crawler.ts`
- API route: `app/api/crawl/route.ts`
- Also used in scan pipeline: `app/api/sites/[id]/scans/route.ts`

## What it does

Given a start URL, it discovers internal links up to configured limits and returns pages to add/scan.

## Limits

Request-time limits:

- `maxPages` (1-500)
- `maxDepth` (1-10)

Scan endpoint defaults can also come from env vars:

- `SCAN_CRAWL_MAX_PAGES`
- `SCAN_CRAWL_MAX_DEPTH`

## API usage

```bash
curl -X POST http://localhost:3000/api/crawl \
  -H 'Content-Type: application/json' \
  -H 'Cookie: a11ylens_session=<session-cookie>' \
  -d '{"projectId":"<id>","startUrl":"https://example.com","maxPages":100,"maxDepth":5}'
```

Returns `202` while crawling is performed in background.

## Access control

Crawler requests require authentication and project access. Unauthorized users receive `401`/`404`/`403` depending on context.
