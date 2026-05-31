# AGENTS.md

Guidance for AI coding agents working on Smart Civic Connect.

## Project Summary

Smart Civic Connect is a small civic reporting prototype. It uses static frontend files and a Node.js backend in `server.js`. The backend serves the frontend, exposes JSON API endpoints, stores reports in SQLite, and writes uploaded photos to disk.

The project intentionally avoids third-party runtime dependencies.

## Important Files

- `index.html`: app structure and form markup
- `styles.css`: visual styling and responsive layout
- `app.js`: frontend state, camera/upload/location behavior, API requests, report rendering
- `server.js`: main server, API routes, SQLite setup, upload handling, static file serving
- `frontend-server.js`: optional local static server with API/upload proxy
- `.env.example`: environment variable reference
- `render.yaml`: Render deployment example
- `DEPLOYMENT.md`: deployment notes

## Run Commands

```bash
npm start
npm run backend
npm run frontend
npm run deploy:check
```

Use `npm start` for the complete app. Use separate backend/frontend scripts only when testing the proxy development flow.

## Architecture Notes

- `server.js` serves `index.html`, `styles.css`, `app.js`, and upload files.
- Reports are stored in `data/smart_civic.db` unless `STORAGE_DIR` is set.
- Uploaded photos are stored in `uploads/` unless `STORAGE_DIR` is set.
- `PORT` disables local port fallback because hosted platforms expect the provided port.
- Without `PORT`, the backend starts at `5600` and tries nearby ports when busy.
- The frontend server starts at `5500` and proxies `/api` and `/uploads` to the backend.

## API Contract

Routes:

```text
GET    /api/health
GET    /api/reports
POST   /api/reports
PATCH  /api/reports/:id/status
DELETE /api/reports
GET    /uploads/:file
```

Valid report statuses:

```text
Submitted
In Progress
Resolved
```

`POST /api/reports` requires:

- `category`
- `landmark`
- `description`
- `photo` as a supported image data URL

Supported photo MIME types:

```text
image/png
image/jpeg
image/jpg
image/webp
```

## Agent Working Rules

- Keep the app dependency-free unless the user explicitly asks for a package or the benefit is very clear.
- Do not remove local user data, database files, or uploaded files unless the user asks.
- Do not commit generated uploads or SQLite database files.
- Preserve the current simple deployment model: one Node server for frontend, API, uploads, and database.
- Keep UI changes consistent with the existing restrained civic dashboard style.
- Keep cards and controls mobile-safe; verify long text does not overlap.
- Escape user-provided content before rendering HTML.
- Keep path handling guarded so static files and uploads cannot escape the project or storage directories.
- Maintain the existing status values unless the user asks for a workflow change.

## Verification

At minimum, run:

```bash
npm run deploy:check
```

For frontend or behavior changes, also manually verify:

- App loads in a browser.
- Photo upload creates a preview.
- Report submission creates a persisted report.
- Submitted tab renders reports.
- Status dropdown updates the backend.
- Clear demo reports works only when intended.

For storage or deployment changes, verify:

- `STORAGE_DIR` writes database and uploads under the configured directory.
- `/api/health` returns a healthy response.
- Static files still serve from the project root.
