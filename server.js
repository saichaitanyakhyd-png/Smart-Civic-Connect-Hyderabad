const http = require("http");
const fsSync = require("fs");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const START_PORT = Number(process.env.PORT || 5600);
const HOST = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const ROOT = __dirname;
const SHOULD_FALLBACK_PORT = !process.env.PORT;
let db;
let storageRoot = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : ROOT;
let dataDir = path.join(storageRoot, "data");
let uploadsDir = path.join(storageRoot, "uploads");
let dbFile = path.join(dataDir, "smart_civic.db");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function configureStorage(root) {
  storageRoot = root;
  dataDir = path.join(storageRoot, "data");
  uploadsDir = path.join(storageRoot, "uploads");
  dbFile = path.join(dataDir, "smart_civic.db");
}

async function prepareStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });
}

async function ensureStorage() {
  try {
    await prepareStorage();
  } catch (error) {
    if (!process.env.STORAGE_DIR) {
      throw error;
    }

    const fallbackRoot = path.join(os.tmpdir(), "smart-civic-connect");
    console.warn(
      `Storage directory "${storageRoot}" is not writable (${error.code || error.message}). ` +
        `Using temporary storage at "${fallbackRoot}".`
    );
    configureStorage(fallbackRoot);
    await prepareStorage();
  }

  initializeDatabase();
}

function initializeDatabase() {
  if (db) return db;

  fsSync.mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(dbFile);
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      category TEXT NOT NULL,
      landmark TEXT NOT NULL,
      description TEXT NOT NULL,
      lat TEXT,
      lng TEXT,
      photo_url TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  return db;
}

function closeDatabase() {
  if (!db) return;
  db.close();
  db = null;
}

function rowToReport(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    category: row.category,
    landmark: row.landmark,
    description: row.description,
    location: row.lat && row.lng ? { lat: row.lat, lng: row.lng } : null,
    photoUrl: row.photo_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function insertReport(report) {
  initializeDatabase()
    .prepare(
      `
        INSERT INTO reports (
          id, name, phone, category, landmark, description,
          lat, lng, photo_url, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      report.id,
      report.name,
      report.phone,
      report.category,
      report.landmark,
      report.description,
      report.location?.lat || null,
      report.location?.lng || null,
      report.photoUrl,
      report.status,
      report.createdAt,
      report.updatedAt || null
    );
}

function findReport(id) {
  const row = initializeDatabase().prepare("SELECT * FROM reports WHERE id = ?").get(id);

  return row ? rowToReport(row) : null;
}

function setReportStatus(id, status) {
  const updatedAt = new Date().toISOString();
  const result = initializeDatabase()
    .prepare("UPDATE reports SET status = ?, updated_at = ? WHERE id = ?")
    .run(status, updatedAt, id);

  if (result.changes === 0) {
    return null;
  }

  return findReport(id);
}

async function readReports() {
  await ensureStorage();
  return initializeDatabase()
    .prepare("SELECT * FROM reports ORDER BY created_at DESC")
    .all()
    .map(rowToReport);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

async function savePhoto(dataUrl, reportId) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    throw new Error("A valid image photo is required.");
  }

  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
  if (!match) {
    throw new Error("Photo must be PNG, JPG, JPEG, or WEBP.");
  }

  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
  const fileName = `${reportId}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  const bytes = Buffer.from(match[2], "base64");

  await fs.writeFile(filePath, bytes);
  return `/uploads/${fileName}`;
}

async function createReport(req, res) {
  try {
    const body = JSON.parse(await collectBody(req));
    const id = crypto.randomUUID();
    const photoUrl = await savePhoto(body.photo, id);

    const report = {
      id,
      name:
        typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Anonymous citizen",
      phone:
        typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : "Not provided",
      category: requiredString(body.category, "Category"),
      landmark: requiredString(body.landmark, "Area or landmark"),
      description: requiredString(body.description, "Description"),
      location:
        body.location &&
        typeof body.location.lat === "string" &&
        typeof body.location.lng === "string"
          ? { lat: body.location.lat, lng: body.location.lng }
          : null,
      photoUrl,
      status: "Submitted",
      createdAt: new Date().toISOString(),
    };

    insertReport(report);
    sendJson(res, 201, { message: "Report uploaded successfully.", report });
  } catch (error) {
    sendJson(res, 400, { message: error.message || "Unable to create report." });
  }
}

async function updateReportStatus(req, res, id) {
  try {
    const body = JSON.parse(await collectBody(req));
    const allowed = new Set(["Submitted", "In Progress", "Resolved"]);

    if (!allowed.has(body.status)) {
      sendJson(res, 400, { message: "Status must be Submitted, In Progress, or Resolved." });
      return;
    }

    const report = setReportStatus(id, body.status);

    if (!report) {
      sendJson(res, 404, { message: "Report not found." });
      return;
    }

    sendJson(res, 200, { message: "Status updated.", report });
  } catch (error) {
    sendJson(res, 400, { message: error.message || "Unable to update status." });
  }
}

async function clearReports(res) {
  const reports = await readReports();
  initializeDatabase().prepare("DELETE FROM reports").run();

  await Promise.all(
    reports
      .filter((report) => report.photoUrl && report.photoUrl.startsWith("/uploads/"))
      .map((report) =>
        fs.rm(path.join(uploadsDir, path.basename(report.photoUrl)), { force: true })
      )
  );

  sendJson(res, 200, { message: "All demo reports cleared." });
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const safePath = decodedPath === "/" ? "/index.html" : decodedPath;
  const filePath = path.normalize(path.join(ROOT, safePath));

  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { message: "Forbidden." });
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    sendJson(res, 404, { message: "File not found." });
  }
}

async function serveUpload(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const relativePath = decodeURIComponent(requestUrl.pathname.replace(/^\/uploads\/?/, ""));
  const filePath = path.normalize(path.join(uploadsDir, relativePath));

  if (!filePath.startsWith(uploadsDir)) {
    sendJson(res, 403, { message: "Forbidden." });
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    sendJson(res, 404, { message: "Upload not found." });
  }
}

async function router(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      status: "ok",
      app: "Smart Civic Connect",
      database: "sqlite",
      uptime: Math.round(process.uptime()),
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/reports") {
    sendJson(res, 200, { reports: await readReports() });
    return;
  }

  if (req.method === "POST" && pathname === "/api/reports") {
    await createReport(req, res);
    return;
  }

  if (req.method === "DELETE" && pathname === "/api/reports") {
    await clearReports(res);
    return;
  }

  const statusMatch = pathname.match(/^\/api\/reports\/([^/]+)\/status$/);
  if (req.method === "PATCH" && statusMatch) {
    await updateReportStatus(req, res, statusMatch[1]);
    return;
  }

  if (req.method === "GET") {
    if (pathname.startsWith("/uploads/")) {
      await serveUpload(req, res);
      return;
    }

    await serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { message: "Method not allowed." });
}

function createAppServer() {
  return http.createServer((req, res) => {
    router(req, res).catch((error) => {
      sendJson(res, 500, { message: error.message || "Server error." });
    });
  });
}

function listenOnAvailablePort(port, attemptsLeft = 20) {
  const server = createAppServer();

  server.on("error", (error) => {
    if (SHOULD_FALLBACK_PORT && error.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.log(`Port ${port} is busy. Trying ${port + 1}...`);
      listenOnAvailablePort(port + 1, attemptsLeft - 1);
      return;
    }

    console.error("Unable to start server:", error.message);
    process.exit(1);
  });

  server.listen(port, HOST, () => {
    const displayHost = HOST === "0.0.0.0" ? "127.0.0.1" : HOST;
    console.log(`Smart Civic Connect running at http://${displayHost}:${port}`);
    console.log(`SQLite database: ${dbFile}`);
    console.log(`Uploads folder: ${uploadsDir}`);
  });
}

if (require.main === module) {
  ensureStorage()
    .then(() => listenOnAvailablePort(START_PORT))
    .catch((error) => {
      console.error("Unable to prepare storage:", error.message);
      process.exit(1);
    });
}

module.exports = {
  closeDatabase,
  createAppServer,
  ensureStorage,
};
