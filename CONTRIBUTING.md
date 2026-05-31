# Contributing

Thank you for helping improve Smart Civic Connect. This project is intentionally small and practical, so contributions should keep the app easy to run, demo, and understand.

## Development Setup

1. Install Node.js `24.16.0` or newer.
2. Clone or open the project folder.
3. Start the app:

```bash
npm start
```

4. Open the printed local URL, usually:

```text
http://127.0.0.1:5600
```

For separate frontend/backend development:

```bash
npm run backend
npm run frontend
```

## Before You Change Code

- Read the relevant file before editing.
- Keep changes focused on the feature or bug being handled.
- Preserve the no-dependency approach unless a dependency clearly earns its place.
- Avoid committing generated demo data, uploaded images, or local database files.

## Code Style

- Use plain JavaScript, HTML, and CSS.
- Keep functions small and named around behavior.
- Prefer existing patterns in `app.js`, `server.js`, and `styles.css`.
- Use readable UI text and clear validation messages.
- Escape user-controlled text before rendering it into HTML.
- Keep comments rare and useful.

## Frontend Guidelines

- Keep the first screen focused on reporting an issue.
- Make controls obvious on mobile and desktop.
- Do not add marketing sections unless the project direction changes.
- Test camera upload fallback paths, because camera permissions vary by browser.
- Keep layout stable when text, images, or report cards change.

## Backend Guidelines

- Keep the API JSON-based.
- Validate required fields on the server.
- Accept only supported image data URLs: PNG, JPG, JPEG, or WEBP.
- Keep uploaded file paths inside the configured uploads directory.
- Keep status values limited to:

```text
Submitted
In Progress
Resolved
```

## Testing Checklist

Run the syntax check:

```bash
npm run deploy:check
```

Manually verify:

- App loads at the server URL.
- A report can be submitted with an uploaded photo.
- The browser camera path works when permission is granted.
- Location can be attached when permission is granted.
- Submitted reports appear in the Submitted tab.
- Status changes persist after page refresh.
- Clear demo reports removes reports and uploaded images.
- `/api/health` returns a healthy response.

## Pull Request Checklist

- Describe what changed and why.
- Mention how it was tested.
- Include screenshots for visible UI changes when practical.
- Note any storage, deployment, or environment variable changes.
- Keep unrelated formatting or refactors out of the same change.

## Data Safety

This is a prototype. Do not store real sensitive citizen data unless the project has been upgraded with production-grade privacy, authentication, authorization, and retention policies.
