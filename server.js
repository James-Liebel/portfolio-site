const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname);
const PORT = 3000;

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

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
