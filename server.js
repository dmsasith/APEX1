// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json({ limit: "10mb" }));
var distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Application build in progress or dist/index.html not found.");
  }
});
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
