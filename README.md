# Smart Civic Connect

A basic hackathon prototype for reporting city-level civic issues.

## Hackathon Deploy

Use **one server** for deployment:

```bash
npm start
```

The same server serves:

- Frontend app
- Backend API
- Uploaded images
- SQLite database connection

Required environment:

```text
NODE_VERSION=24.16.0
```

Optional persistent storage:

```text
STORAGE_DIR=/var/data
```

Health check:

```text
/api/health
```

## Features

- Camera capture from the browser
- Upload photo from device
- Reporter name and mobile number
- Issue category
- Area or landmark
- Description
- Optional GPS location
- Submit report to backend
- View submitted complaints
- Track status: `Submitted`, `In Progress`, `Resolved`
- SQLite database storage

## Run

Backend only, serving both frontend and API:

```bash
npm start
```

Open:

```text
http://127.0.0.1:5600
```

If port `5600` is already busy, the backend automatically tries the next port.
Use the URL printed in the terminal, for example:

```text
http://127.0.0.1:5601
```

Frontend and backend separately:

Open terminal 1:

```bash
npm run backend
```

Open terminal 2:

```bash
npm run frontend
```

Then use:

```text
Frontend: http://127.0.0.1:5500
Backend:  http://127.0.0.1:5600
```

If `5500` is busy, the frontend automatically tries `5501`, `5502`, and so on.
Use the frontend URL printed in the terminal.
The frontend server automatically forwards `/api` and `/uploads` requests to the active backend port, so submitted reports are saved in SQLite.

## Backend API

```text
GET    /api/health
GET    /api/reports
POST   /api/reports
PATCH  /api/reports/:id/status
DELETE /api/reports
```

Uploaded photos are saved in `uploads/`.
Report data is saved in the SQLite database `data/smart_civic.db`.

## Deployment Notes

For Render/Railway-style hosting, use:

```text
Build command: npm install
Start command: npm start
```

Set environment variables:

```text
PORT=<provided by platform>
NODE_VERSION=24.16.0
```

Optional persistent storage:

```text
STORAGE_DIR=/var/data
```

When `STORAGE_DIR` is set, SQLite data and uploaded photos are saved there:

```text
/var/data/data/smart_civic.db
/var/data/uploads/
```

This project includes `render.yaml` for Render deployment with a persistent disk.
