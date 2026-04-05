const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname);
const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
let port = Number.isFinite(preferredPort) ? preferredPort : 3000;
const portCeiling = port + 20;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

function send404(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404 Not Found");
}

const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    let rel = pathname.replace(/^\/+/, "");
    if (rel === "") {
      rel = "index.html";
    }
    rel = path.normalize(rel).replace(/^(\.\.(\/|\\))+/, "");

    const filePath = path.resolve(ROOT, rel);
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
      send404(res);
      return;
    }

    fs.stat(filePath, (err, st) => {
      if (err || !st.isFile()) {
        send404(res);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext] || "application/octet-stream";

      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          send404(res);
          return;
        }
        res.writeHead(200, { "Content-Type": type });
        res.end(data);
      });
    });
  } catch {
    send404(res);
  }
});

let listeningLogged = false;
function onListening() {
  if (listeningLogged) return;
  listeningLogged = true;
  console.log(`Server running at http://localhost:${port}`);
}

server.on("error", err => {
  if (err.code === "EADDRINUSE" && port < portCeiling) {
    console.warn(`Port ${port} in use, trying ${port + 1}…`);
    port += 1;
    setImmediate(() => {
      server.listen(port, onListening);
    });
  } else {
    console.error(err);
    process.exit(1);
  }
});

server.listen(port, onListening);
