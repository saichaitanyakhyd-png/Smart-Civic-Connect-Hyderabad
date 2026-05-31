# Security Policy

## Supported Versions

This is a prototype project. Security fixes should target the latest code on the `main` branch.

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a Vulnerability

Please report security issues privately instead of opening a public issue.

If this repository is hosted on GitHub, use GitHub's private vulnerability reporting feature if it is enabled. Otherwise, contact the repository owner directly with:

- A clear description of the issue
- Steps to reproduce it
- Potential impact
- Any suggested fix, if available

Do not include real citizen data, real phone numbers, or sensitive location data in reports.

## Security Notes for This Project

- Uploaded photos are accepted only as image data URLs for PNG, JPG, JPEG, and WEBP.
- The server stores report records in SQLite and photos on disk.
- Static file and upload serving should remain path-guarded to prevent directory traversal.
- User-controlled report text must be escaped before being rendered in the browser.
- This prototype does not include authentication, authorization, encryption-at-rest, audit logging, or data retention controls.

## Production Warning

Before using this app with real public data, add production-grade protections:

- Authentication for civic staff/admin actions
- Authorization around status changes and data deletion
- HTTPS-only deployment
- Rate limiting and request size limits appropriate for the host
- Strong privacy policy and retention rules
- Secure backups for SQLite and uploaded photos
- Monitoring and incident response process
