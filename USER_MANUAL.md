# User Manual

This manual explains how to use Smart Civic Connect to submit and manage civic issue reports.

## Opening the App

Start the app:

```bash
npm start
```

Open the URL shown in the terminal. The default URL is:

```text
http://127.0.0.1:5600
```

## Main Sections

The sidebar has two sections:

- `Report issue`: create a new civic complaint.
- `Submitted`: view submitted complaints and update their status.

## Submit a Civic Report

1. Open `Report issue`.
2. Add photo evidence using one of these options:

```text
Open camera -> Capture
Upload photo
```

3. Fill in the report details:

- Reporter name
- Mobile number
- Issue category
- Area or landmark
- Description

4. Optionally select `Get location` to attach GPS coordinates.
5. Select `Upload report`.

After a successful upload, the app opens the `Submitted` section and shows the new complaint.

## Photo Evidence

You must add a photo before submitting a report.

Use `Open camera` when the browser has camera permission. Camera access works best on `localhost` or HTTPS. If camera permission is blocked, use `Upload photo`.

Supported image formats:

```text
PNG
JPG
JPEG
WEBP
```

## Location

Location is optional. Select `Get location` to ask the browser for GPS access.

If permission is granted, the report includes latitude and longitude. If permission is blocked, the report can still be submitted without GPS coordinates.

## View Submitted Reports

Open `Submitted` to see all reports. Each report can include:

- Issue photo
- Category
- Description
- Area or landmark
- GPS coordinates, when attached
- Reporter name
- Phone number
- Submission date and time
- Current status

The counters at the top summarize total reports, photo reports, and location reports.

## Update Report Status

In the `Submitted` section, use the status dropdown on a report.

Available statuses:

```text
Submitted
In Progress
Resolved
```

The updated status is saved to the backend.

## Clear Demo Reports

Use the clear reports action in the `Submitted` section to remove all demo reports. This also removes uploaded report photos from the uploads folder.

Use this only when you want to reset the demo data.

## Troubleshooting

### The App Does Not Open

Make sure the server is running:

```bash
npm start
```

If port `5600` is busy, check the terminal for the new URL.

### Backend Is Not Reachable

Start the backend:

```bash
npm start
```

If using separate servers, start both:

```bash
npm run backend
npm run frontend
```

### Camera Does Not Work

- Allow camera permission in the browser.
- Use `http://127.0.0.1` or HTTPS.
- Try uploading a photo instead.

### Location Does Not Work

- Allow location permission in the browser.
- Make sure location services are enabled on the device.
- Submit the report without GPS if location is unavailable.

### Reports Disappear After Deployment Restart

Configure persistent storage and set `STORAGE_DIR` on the hosting platform. Without persistent storage, uploaded photos and SQLite data may be lost on restart.
