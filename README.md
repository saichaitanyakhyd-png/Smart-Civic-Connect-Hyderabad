# Smart Civic Connect

Smart Civic Connect is a lightweight civic issue reporting prototype. Citizens can capture or upload a photo, describe a local issue, attach an optional GPS location, and submit the report to a Node.js backend. Submitted reports can be reviewed and moved through simple status states.

## Features

- Camera capture from supported browsers
- Photo upload from device gallery
- Reporter name and phone fields with anonymous fallback
- Civic issue category, area or landmark, and description
- Optional GPS location attachment
- Submitted complaints dashboard
- Report status updates: `Submitted`, `In Progress`, `Resolved`
- Demo data clear action
- SQLite-backed persistence using Node's built-in `node:sqlite`
- Uploaded image storage in `uploads/`
- Single-server deployment for frontend, API, uploads, and database

## Tech Stack

- HTML, CSS, and browser JavaScript
- Node.js HTTP server
- Built-in `node:sqlite`
- Local filesystem storage for SQLite data and uploaded images

## Requirements

- Node.js `24.16.0` or newer
- A modern browser
- Camera and location permissions if using those optional browser features

This project does not require third-party npm packages.

## Project Structure

```text
.
├── app.js                # Frontend behavior and API calls
├── frontend-server.js    # Optional local frontend-only server with API proxy
├── index.html            # App markup
├── server.js             # Main backend, API, static server, SQLite storage
├── styles.css            # App styles
├── data/                 # SQLite database folder
├── uploads/              # Uploaded report photos
├── render.yaml           # Render deployment example
├── DEPLOYMENT.md         # Hosting notes
└── .env.example          # Example environment variables
```

## Quick Start

Start the complete app with one command:

```bash
npm start
```

Open the URL printed in the terminal. By default it is:

```text
http://127.0.0.1:5600
```

If port `5600` is busy, the server automatically tries the next available port.

## Local Development

You can run the full app from the backend server:

```bash
npm run backend
```

Or run the frontend and backend separately:

```bash
npm run backend
npm run frontend
```

Default local URLs:

```text
Backend and full app: http://127.0.0.1:5600
Frontend dev server:  http://127.0.0.1:5500
```

The frontend dev server proxies `/api` and `/uploads` to the active backend port. If a default port is busy, both servers try nearby ports and print the final URL.

## Scripts

```bash
npm start          # Run the production-style single server
npm run backend    # Run server.js
npm run frontend   # Run frontend-server.js for separate frontend development
npm run deploy:check
```

`deploy:check` runs JavaScript syntax checks for `server.js`, `app.js`, and `frontend-server.js`.

## Environment Variables

```text
NODE_VERSION=24.16.0
PORT=5600
HOST=127.0.0.1
STORAGE_DIR=.
FRONTEND_PORT=5500
BACKEND_PORT=5600
```

Common production settings:

- `PORT`: usually provided by the hosting platform.
- `HOST`: automatically uses `0.0.0.0` when `PORT` is set.
- `STORAGE_DIR`: optional persistent storage root. When set, the app stores data in `${STORAGE_DIR}/data` and uploads in `${STORAGE_DIR}/uploads`.

## API

### Health

```http
GET /api/health
```

Returns server health, app name, database type, and uptime.

### List Reports

```http
GET /api/reports
```

Returns all reports in newest-first order.

### Create Report

```http
POST /api/reports
Content-Type: application/json
```

Example body:

```json
{
  "name": "Asha Kumar",
  "phone": "9876543210",
  "category": "Road damage",
  "landmark": "MG Road signal",
  "description": "Large pothole near the left lane.",
  "photo": "data:image/jpeg;base64,...",
  "location": {
    "lat": "12.971599",
    "lng": "77.594566"
  }
}
```

Required fields are `category`, `landmark`, `description`, and a valid image `photo`. `name`, `phone`, and `location` are optional.

### Update Report Status

```http
PATCH /api/reports/:id/status
Content-Type: application/json
```

Example body:

```json
{
  "status": "In Progress"
}
```

Allowed statuses are `Submitted`, `In Progress`, and `Resolved`.

### Clear Demo Reports

```http
DELETE /api/reports
```

Deletes all reports and removes uploaded report images. This is intended for demos and hackathon resets.

## Storage

By default, the app stores files in the project directory:

```text
data/smart_civic.db
uploads/
```

With `STORAGE_DIR=/var/data`, storage moves to:

```text
/var/data/data/smart_civic.db
/var/data/uploads/
```

Keep persistent storage enabled on hosted deployments if reports and photos should survive restarts.

## Deployment

For Render, Railway, or similar platforms:

```text
Build command: npm install
Start command: npm start
```

Set:

```text
NODE_VERSION=24.16.0
```

Use the platform-provided `PORT`. For persistent data, configure a disk and set `STORAGE_DIR` to the mounted path. This repository includes `render.yaml` as a Render example.

## Browser Notes

- Camera access usually requires `localhost` or HTTPS.
- Location access requires user permission.
- Uploaded images are resized in the browser before submission when possible.

## License

MIT
