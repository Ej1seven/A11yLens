# axe-core Scanner Notes

This project already uses axe-core via Puppeteer.

- Scanner implementation: `lib/scanner.ts`
- API trigger: `POST /api/sites/[id]/scans`
- Results stored in `Issue` rows and shown on `/scans/[scanId]`

## Dependencies

Already included in `package.json`:

- `@axe-core/puppeteer`
- `puppeteer`

If needed:

```bash
npm install @axe-core/puppeteer puppeteer
```

## Important runtime note

`lib/scanner.ts` currently launches Chrome with a macOS path:

`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

If running on Linux/CI/container, update Puppeteer launch options (for example `executablePath` and launch args) to match that environment.

## Output mapping

Scanner maps axe results to internal severities:

- `critical` + `serious` -> `critical`
- `moderate` -> `warning`
- `minor` -> `info`
- `incomplete` checks are recorded as `info`

## Stored issue fields

- `type`
- `severity`
- `element`
- `message`
- `selector`
- `suggestion`
- `helpUrl`
- `wcagLevel`
- `context`
- `pageUrl`
