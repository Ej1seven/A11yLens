# Usage Examples

## Example 1: Solo workflow

1. Register and log in
2. Create project: `Marketing Site`
3. Add `https://example.com`
4. Run scan
5. Filter by `critical` in scan results
6. Export CSV for task tracking

## Example 2: Team collaboration

1. Owner creates project
2. Owner invites teammate by email on project page
3. Teammate accepts invite from dashboard request card
4. Both users can run scans and view results for shared project

## Example 3: Crawl + scan deeper sites

1. Use crawler (`POST /api/crawl`) from project UI
2. Configure `maxPages` and `maxDepth`
3. Run scan on discovered site entries
4. Review grouped issues by page in results

## Example API calls

### Create project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H 'Content-Type: application/json' \
  -H 'Cookie: a11ylens_session=<session-cookie>' \
  -d '{"name":"Client A"}'
```

### Invite collaborator

```bash
curl -X POST http://localhost:3000/api/projects/<projectId>/collaborators \
  -H 'Content-Type: application/json' \
  -H 'Cookie: a11ylens_session=<session-cookie>' \
  -d '{"email":"teammate@example.com"}'
```

### Respond to invite

```bash
curl -X POST http://localhost:3000/api/invites/<inviteId> \
  -H 'Content-Type: application/json' \
  -H 'Cookie: a11ylens_session=<session-cookie>' \
  -d '{"action":"accept"}'
```

### Start scan

```bash
curl -X POST http://localhost:3000/api/sites/<siteId>/scans \
  -H 'Content-Type: application/json' \
  -H 'Cookie: a11ylens_session=<session-cookie>' \
  -d '{"maxPages":50,"maxDepth":5}'
```
