# Changelog

All notable changes to Smart Civic Connect will be documented in this file.

This project follows a simple release history format. Add new entries under `Unreleased` until a version is tagged.

## Unreleased

### Added

- Repository health documentation and configuration files.
- Contributor, user, and agent documentation.
- Preparation for the final Smart Civic Connect release and version tagging.

### Changed

- Removed the frontend "Backend connected" status pill.
- Expanded README with setup, API, storage, and deployment details.

## 1.0.0 - 2026-05-31

### Added

- Initial Smart Civic Connect prototype.
- Browser photo capture and image upload.
- Optional geolocation attachment.
- Civic report submission form.
- Submitted reports view with summary counters.
- Report status updates for `Submitted`, `In Progress`, and `Resolved`.
- SQLite storage using Node.js built-in `node:sqlite`.
- Uploaded image storage in `uploads/`.
- Single Node server for frontend, API, uploads, and database access.
- Optional frontend development server with API/upload proxy.
