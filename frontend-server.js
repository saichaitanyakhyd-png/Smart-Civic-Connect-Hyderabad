const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const START_PORT = Number(process.env.FRONTEND_PORT || 5500);
const ROOT = __dirname;
const BACKEND_START_PORT = Number(process.env.BACKEND_PORT || 5600);
let backendPort = null;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

async function serve(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const safePath = requestUrl.pathname === "/" ? "/index.html" : decodeURIComponent(requestUrl.pathname);
  const filePath = path.normalize(path.join(ROOT, safePath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("File not found");
  }
}

function proxyRequest(req, res, targetPort) {
  const options = {
    hostname: "127.0.0.1",
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxy.on("error", () => {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ message: "Backend is not running." }));
  });

  req.pipe(proxy);
}

function checkBackendPort(port) {
  return new Promise((resolve) => {
    let body = "";
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          resolve(res.statusCode === 200 && data.database === "sqlite");
        } catch {
          resolve(false);
        }
      });
    });

    req.on("error", () => resolve(false));
    req.setTimeout(400, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function findBackendPort() {
  if (backendPort && (await checkBackendPort(backendPort))) {
    return backendPort;
  }

  for (let port = BACKEND_START_PORT; port < BACKEND_START_PORT + 25; port += 1) {
    if (await checkBackendPort(port)) {
      backendPort = port;
      console.log(`Frontend connected to backend at http://127.0.0.1:${port}`);
      return port;
    }
  }

  return null;
}

function createFrontendServer() {
  return http.createServer((req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (requestUrl.pathname.startsWith("/api/") || requestUrl.pathname.startsWith("/uploads/")) {
      findBackendPort().then((port) => {
        if (port) {
          proxyRequest(req, res, port);
          return;
        }

        res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ message: "Start backend first with npm.cmd run backend." }));
      });
      return;
    }

    serve(req, res).catch(() => {
      res.writeHead(500);
      res.end("Server error");
    });
  });
}

function listenOnAvailablePort(port, attemptsLeft = 20) {
  const server = createFrontendServer();

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.log(`Frontend port ${port} is busy. Trying ${port + 1}...`);
      listenOnAvailablePort(port + 1, attemptsLeft - 1);
      return;
    }

    console.error("Unable to start frontend server:", error.message);
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Frontend running at http://127.0.0.1:${port}`);
  });
}

listenOnAvailablePort(START_PORT);
