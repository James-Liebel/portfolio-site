/**
 * Copies vendored JS from node_modules into projects/web/vendor/
 * Run after: npm install
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const vendor = path.join(root, "projects", "web", "vendor");

const copies = [
  ["node_modules/gsap/dist/gsap.min.js", "gsap.min.js"],
  ["node_modules/gsap/dist/ScrollTrigger.min.js", "ScrollTrigger.min.js"],
  ["node_modules/@studio-freight/lenis/dist/lenis.min.js", "lenis.min.js"],
  ["node_modules/powerbi-client/dist/powerbi.min.js", "powerbi.min.js"],
];

fs.mkdirSync(vendor, { recursive: true });
for (const [rel, name] of copies) {
  const from = path.join(root, rel);
  const to = path.join(vendor, name);
  fs.copyFileSync(from, to);
  console.log("copied", name);
}
