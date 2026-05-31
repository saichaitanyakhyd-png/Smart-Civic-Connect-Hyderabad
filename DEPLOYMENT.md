# Deploy Smart Civic Connect

## Fastest Option

Deploy this project as a single Node.js web service.

```text
Build command: npm install
Start command: npm start
```

Set:

```text
NODE_VERSION=24.16.0
```

After deployment, open:

```text
https://your-app-url/
```

Check:

```text
https://your-app-url/api/health
```

## Important

Use only `npm start` on hosting. Do not run `npm run frontend` and `npm run backend` separately on deployment.

For persistent SQLite data and uploaded photos, configure a persistent disk and set:

```text
STORAGE_DIR=/var/data
```

Without persistent storage, the app will still work for the hackathon demo, but saved data may disappear after a redeploy or server restart depending on the host.
