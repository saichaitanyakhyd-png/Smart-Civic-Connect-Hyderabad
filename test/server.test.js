const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const storageDir = path.join(os.tmpdir(), `smart-civic-test-${Date.now()}`);
process.env.STORAGE_DIR = storageDir;
process.env.PORT = "0";

const { closeDatabase, createAppServer, ensureStorage } = require("../server");

const samplePhoto =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lZ0f2wAAAABJRU5ErkJggg==";

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function requestJson(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json();
  return { response, data };
}

test("Smart Civic Connect API stores, updates, and clears reports", async () => {
  await ensureStorage();
  const server = createAppServer();
  const baseUrl = await listen(server);

  try {
    const health = await requestJson(baseUrl, "/api/health");
    assert.equal(health.response.status, 200);
    assert.equal(health.data.status, "ok");
    assert.equal(health.data.database, "sqlite");

    const created = await requestJson(baseUrl, "/api/reports", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Citizen",
        phone: "9999999999",
        category: "Road damage",
        landmark: "Test Circle",
        description: "A pothole needs attention.",
        photo: samplePhoto,
        location: { lat: "17.385044", lng: "78.486671" },
      }),
    });

    assert.equal(created.response.status, 201);
    assert.equal(created.data.report.status, "Submitted");
    assert.equal(created.data.report.category, "Road damage");
    assert.match(created.data.report.photoUrl, /^\/uploads\/.+\.png$/);

    const listed = await requestJson(baseUrl, "/api/reports");
    assert.equal(listed.response.status, 200);
    assert.equal(listed.data.reports.length, 1);

    const updated = await requestJson(baseUrl, `/api/reports/${created.data.report.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Resolved" }),
    });

    assert.equal(updated.response.status, 200);
    assert.equal(updated.data.report.status, "Resolved");

    const cleared = await requestJson(baseUrl, "/api/reports", { method: "DELETE" });
    assert.equal(cleared.response.status, 200);

    const empty = await requestJson(baseUrl, "/api/reports");
    assert.equal(empty.data.reports.length, 0);
  } finally {
    await close(server);
    closeDatabase();
    await fs.rm(storageDir, { recursive: true, force: true });
  }
});

test("POST /api/reports rejects missing required report fields", async () => {
  await ensureStorage();
  const server = createAppServer();
  const baseUrl = await listen(server);

  try {
    const result = await requestJson(baseUrl, "/api/reports", {
      method: "POST",
      body: JSON.stringify({
        category: "",
        landmark: "Test Circle",
        description: "Missing photo and category.",
      }),
    });

    assert.equal(result.response.status, 400);
    assert.match(result.data.message, /image photo|required/i);
  } finally {
    await close(server);
    closeDatabase();
    await fs.rm(storageDir, { recursive: true, force: true });
  }
});
