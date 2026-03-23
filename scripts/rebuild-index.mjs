import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootWin = path.resolve(__dirname, "..");
const htmlPath = path.join(rootWin, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");

// Truncate accidental content after closing </html> (e.g. duplicate script blocks)
{
  const htmlEnd = html.lastIndexOf("</html>");
  if (htmlEnd !== -1) html = html.slice(0, htmlEnd + "</html>".length);
}

// Globe canvas — apply to full document before extracting <main>
if (!html.includes('id="globe-canvas"')) {
  html = html.replace(
    /(<section id="visualizations" class="visuals-section">)/,
    `$1\n      <canvas id="globe-canvas" class="globe-canvas" width="1920" height="1080" aria-hidden="true"></canvas>\n      <div class="globe-overlay" aria-hidden="true"></div>\n      <img class="globe-poster" src="globe/ezgif-frame-001.jpg" alt="" loading="lazy" />`
  );
}

const mainMatch = html.match(/<main class="site-main">([\s\S]*?)<\/main>/);
if (!mainMatch) {
  console.error("Could not find main");
  process.exit(1);
}
let main = mainMatch[1];

// Insert servers scrub zone before skills-atlas
const serversZone = `      <div id="servers-scrub-zone" class="servers-scrub-zone" aria-hidden="true">
        <div class="servers-scrub-sticky">
          <canvas id="servers-canvas" class="servers-canvas" width="1920" height="1080"></canvas>
          <img class="servers-poster" src="servers/ezgif-frame-001.jpg" alt="" width="1920" height="1080" loading="lazy" />
        </div>
      </div>
`;

if (!main.includes('id="servers-scrub-zone"')) {
  main = main.replace(
    /(\s+)(<div class="skills-atlas">)/,
    `$1${serversZone}\n$1$2`
  );
}

// Remove laptop block inside skills-atlas (slice from machine open to nexus open)
{
  const a = main.indexOf('<div class="skills-machine" id="laptopScene"');
  const b = main.indexOf('<div class="skills-atlas-nexus">');
  if (a !== -1 && b !== -1 && b > a) {
    main = main.slice(0, a) + main.slice(b);
  } else {
    console.warn("skills-machine block not found — skip removal");
  }
}

// Journey rocket zone before journey-track-shell
const rocketZone = `        <div id="journey-rocket-zone" class="journey-rocket-zone" aria-hidden="true">
          <div class="journey-rocket-sticky">
            <canvas id="rocket-canvas" class="rocket-canvas" width="1920" height="1080"></canvas>
            <img class="rocket-poster" src="rockets/screenshot_001.jpg" alt="" width="1920" height="1080" loading="lazy" />
            <div class="journey-rocket-overlays">
              <div class="journey-overlay-card" data-journey-segment="0"></div>
              <div class="journey-overlay-card" data-journey-segment="1"></div>
              <div class="journey-overlay-card" data-journey-segment="2"></div>
              <div class="journey-overlay-card" data-journey-segment="3"></div>
            </div>
          </div>
        </div>
`;

if (!main.includes('id="journey-rocket-zone"')) {
  main = main.replace(
    /(\s+)(<div class="journey-track-shell">)/,
    `${rocketZone}\n$1$2`
  );
}

const headAndOpenBody = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="James Liebel interactive resume and portfolio.">
  <title>James Liebel | Resume + Portfolio</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/bundled/lenis.min.js" defer></script>
  <link rel="icon"
    href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚀</text></svg>">
  <script>document.documentElement.classList.add('js');</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
`;

const cinematicCss = `
    :root {
      --bg: #0c0f1a;
      --bg-elevated: #12162a;
      --accent: #6366f1;
      --text: #f4f4f8;
      --text-muted: rgba(244, 244, 248, 0.68);
      --border: rgba(99, 102, 241, 0.28);
      --nav-height: 72px;
      --container: min(1180px, calc(100vw - 40px));
      --radius: 16px;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: auto; }
    body {
      margin: 0;
      font-family: Inter, system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      overflow-x: hidden;
    }
    body.menu-open { overflow: hidden; }

    .eyebrow, .section-kicker, .terminal-label, .resume-kicker, .footer-kicker,
    .rail a, .gallery-tag, .nav-links a, .visual-label, .pb-brand, .pb-nav strong {
      font-family: "Space Mono", monospace;
    }

    a { color: inherit; text-decoration: none; }
    button { font: inherit; cursor: pointer; }
    img, iframe { display: block; max-width: 100%; border: 0; }

    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }

    /* Preloader — dark cinematic shell (hero waits for intro canvas) */
    .preloader {
      display: none;
    }
    .js .preloader {
      position: fixed;
      inset: 0;
      z-index: 1390;
      display: grid;
      place-items: center;
      background: #000;
      color: var(--text);
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.5s ease, visibility 0.5s;
    }
    .preloader.is-done { opacity: 0; visibility: hidden; pointer-events: none; }
    .preloader-inner { display: grid; gap: 14px; justify-items: center; }
    .preloader-mark {
      margin: 0;
      font: 700 clamp(64px, 14vw, 120px)/1 "Space Mono", monospace;
      letter-spacing: 0.08em;
      color: var(--accent);
    }
    .preloader-bar { width: min(220px, 60vw); height: 2px; border-radius: 999px; background: rgba(99,102,241,0.25); overflow: hidden; }
    .preloader-bar span { display: block; height: 100%; width: 40%; background: var(--accent); animation: preloaderInd 1.2s ease-in-out infinite; }
    @keyframes preloaderInd { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }

    /* Intro canvas */
    #intro-canvas {
      position: fixed;
      inset: 0;
      z-index: 1400;
      width: 100vw;
      height: 100vh;
      display: block;
      background: #000;
    }
    .intro-jl-overlay {
      position: fixed;
      inset: 0;
      z-index: 1401;
      display: grid;
      place-items: center;
      pointer-events: none;
      font: 700 clamp(56px, 12vw, 120px)/1 "Space Mono", monospace;
      letter-spacing: 0.12em;
      color: rgba(244,244,248,0.92);
      text-shadow: 0 0 40px rgba(99,102,241,0.45);
      animation: introPulse 1.8s ease-in-out infinite;
    }
    @keyframes introPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
    .intro-skip {
      position: fixed;
      right: 20px;
      bottom: 22px;
      z-index: 1402;
      padding: 10px 18px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(12,15,26,0.75);
      color: var(--text);
      font-family: "Space Mono", monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .intro-skip:hover { background: rgba(99,102,241,0.25); }

    #scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 2px;
      width: 0;
      z-index: 1350;
      background: linear-gradient(90deg, var(--accent), #a5b4fc);
      pointer-events: none;
    }

    .site-nav {
      position: sticky;
      top: 0;
      z-index: 1200;
      background: rgba(12, 15, 26, 0.88);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(99, 102, 241, 0.15);
    }
    .site-nav-inner {
      width: var(--container);
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: var(--nav-height);
      padding: 8px 0;
    }
    .brand-badge {
      font: 700 22px/1 "Space Mono", monospace;
      color: var(--accent);
      letter-spacing: 0.06em;
    }
    .nav-links {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      gap: 6px 10px;
      align-items: center;
    }
    .nav-indicator {
      position: absolute;
      bottom: 2px;
      height: 2px;
      background: var(--accent);
      border-radius: 2px;
      pointer-events: none;
    }
    .nav-link {
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.04em;
    }
    .nav-link.active, .nav-link:hover { color: var(--text); }
    .nav-actions { display: flex; align-items: center; gap: 12px; }
    .nav-icon-link { color: var(--text-muted); }
    .nav-icon-link:hover { color: var(--accent); }
    .nav-icon-link svg { width: 22px; height: 22px; fill: currentColor; }
    .nav-availability {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      font: 600 10px/1 "Space Mono", monospace;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }
    @media (min-width: 920px) { .nav-availability { display: inline-flex; } }
    .nav-availability-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 12px var(--accent);
    }
    .nav-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: transparent;
      border: 0;
      padding: 8px;
    }
    @media (max-width: 920px) { .nav-toggle { display: flex; } }
    .nav-toggle span { width: 22px; height: 2px; background: var(--text); border-radius: 2px; }
    .mobile-nav {
      position: fixed;
      inset: 0;
      z-index: 1250;
      background: rgba(0,0,0,0.55);
      padding: 24px;
    }
    .mobile-nav-inner {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      max-width: 400px;
      margin-left: auto;
    }
    .mobile-nav-links { display: grid; gap: 18px; margin: 24px 0; }
    .mobile-nav-links a { font-weight: 600; font-size: 20px; }
    .mobile-nav-actions { display: flex; gap: 16px; font-family: "Space Mono", monospace; font-size: 12px; }

    .site-main section[id] { scroll-margin-top: calc(var(--nav-height) + 16px); }

    /* Hero */
    .hero-section {
      position: relative;
      min-height: 100vh;
      padding: calc(var(--nav-height) + 32px) 0 48px;
      overflow: clip;
    }
    .hero-ambient { position: absolute; inset: 0; pointer-events: none; opacity: 0.4; }
    .hero-inner {
      width: var(--container);
      margin: 0 auto;
 display: grid;
      grid-template-columns: 1fr;
      gap: 40px;
      align-items: start;
      position: relative;
      z-index: 2;
    }
    @media (min-width: 1024px) {
      .hero-inner { grid-template-columns: 1.05fr 0.95fr; align-items: center; }
    }
    .eyebrow { color: var(--accent); font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 12px; }
    .hero-title { margin: 0; font-size: clamp(2.5rem, 6vw, 4.25rem); line-height: 0.95; letter-spacing: -0.04em; font-weight: 700; }
    .hero-line { display: block; }
    .hero-rotator { color: var(--accent); }
    .summary { margin: 20px 0 0; max-width: 52ch; color: var(--text-muted); line-height: 1.75; font-size: 1.05rem; }

    .hero-terminal {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0,0,0,0.35);
    }
    .terminal-chrome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(99,102,241,0.08);
      font-family: "Space Mono", monospace;
      font-size: 11px;
      color: var(--text-muted);
    }
    .terminal-body { padding: 20px; }
    .switch { position: relative; display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
    .switch button {
      flex: 1;
      min-width: 120px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
      background: transparent;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 12px;
    }
    .switch button.active {
      background: rgba(99,102,241,0.22);
      border-color: var(--border);
      color: var(--text);
    }
    .stack-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .mini { padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
    .mini small, .mini span { color: var(--text-muted); font-size: 12px; }
    .mini strong { display: block; margin: 6px 0; font-size: 1rem; color: var(--text); }
    .tag-row, .pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag, .pill {
      display: inline-flex;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.08);
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
    }
    .pill { font-family: "Space Mono", monospace; font-size: 10px; letter-spacing: 0.06em; }

    /* Sections */
    .section-shell {
      width: var(--container);
      margin: 0 auto;
      padding: 88px 0;
    }
    .section-head { margin-bottom: 36px; }
    .section-head-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr;
    }
    @media (min-width: 900px) {
      .section-head-grid { grid-template-columns: 1fr 1fr; align-items: end; }
    }
    .section-head h2 { margin: 10px 0 0; font-size: clamp(1.75rem, 3vw, 2.5rem); letter-spacing: -0.03em; }
    .section-head p { margin: 0; color: var(--text-muted); line-height: 1.65; }

    /* Servers scrub */
    .servers-scrub-zone {
      height: max(200vh, calc(var(--servers-frames, 120) * 20px));
      margin-bottom: 48px;
      position: relative;
    }
    .servers-scrub-sticky {
      position: sticky;
      top: 0;
      height: 100vh;
      width: 100%;
      background: #000;
    }
    .servers-canvas { width: 100%; height: 100%; display: block; object-fit: cover; }
    .servers-poster {
      display: none;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    @media (max-width: 767px) {
      .servers-scrub-zone { height: auto; min-height: 220px; margin-bottom: 32px; }
      .servers-scrub-sticky { position: relative; height: 56vh; min-height: 280px; }
      .servers-canvas { display: none !important; }
      .servers-poster { display: block; }
    }

    /* Skills atlas — cables only (no laptop) */
    .skills-atlas { position: relative; margin-top: 24px; }
    .skills-atlas-cables { width: 100%; height: auto; opacity: 0.35; }

    .skills-atlas-nexus, .skills-atlas-branches {
      margin-top: 32px;
    }
    .skills-branch {
      background: var(--bg-elevated);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: var(--radius);
      padding: 24px;
    }

    /* Skills grid / bento */
    .skills-grid {
      margin-top: 40px;
      display: grid;
      gap: 20px;
    }
    @media (min-width: 960px) {
      .skills-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
    }
    .bento-card {
      background: var(--bg-elevated);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: var(--radius);
      padding: 24px;
    }

    /* Projects */
    .work-section { position: relative; }
    .project-rail-wrap { margin-bottom: 24px; }
    .project-rail { display: flex; flex-wrap: wrap; gap: 10px; }
    .project-rail a {
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      font-family: "Space Mono", monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .project-rail a.active { border-color: var(--accent); color: var(--accent); background: rgba(99,102,241,0.12); }
    .detail, .project-section { color: var(--text-muted); }

    /* Visualizations + globe */
    #visualizations {
      position: relative;
      overflow: hidden;
      background: var(--bg);
    }
    .globe-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      pointer-events: none;
    }
    .globe-overlay {
      position: absolute;
      inset: 0;
      background: rgba(8, 10, 22, 0.55);
      z-index: 1;
      pointer-events: none;
    }
    .globe-poster {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      pointer-events: none;
      display: none;
    }
    #visualizations .section-shell { position: relative; z-index: 2; }
    @media (max-width: 767px) {
      .globe-canvas { display: none !important; }
      .globe-poster { display: block; }
    }
    .visual-grid { display: grid; gap: 20px; }
    @media (min-width: 900px) { .visual-grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
    .visual-card {
      background: rgba(18,22,42,0.85);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .visual-card.featured { grid-column: 1 / -1; }

    /* Journey */
    .journey-section { position: relative; overflow: clip; background: var(--bg); color: var(--text); }
    .journey-ambient { display: none; }

    .journey-rocket-zone {
      height: max(300vh, calc(var(--rocket-frames, 120) * 24px));
      position: relative;
      margin-bottom: 32px;
    }
    .journey-rocket-sticky {
      position: sticky;
      top: 0;
      height: 100vh;
      width: 100%;
      background: #000;
    }
    .rocket-canvas { width: 100%; height: 100%; display: block; }
    .rocket-poster { display: none; width: 100%; height: 100%; object-fit: cover; }
    .journey-rocket-overlays {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 24px 4vw;
    }
    .journey-overlay-card {
      max-width: min(440px, 92vw);
      max-height: 78vh;
      overflow: auto;
      padding: 22px;
      border-radius: var(--radius);
      background: rgba(12, 15, 26, 0.72);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      box-shadow: 0 20px 50px rgba(0,0,0,0.4);
      color: var(--text);
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: auto;
    }
    .journey-overlay-card.is-visible { opacity: 1; }
    .journey-overlay-card *[hidden] { display: revert; }
    @media (max-width: 767px) {
      .journey-rocket-zone { height: auto; min-height: 200px; margin-bottom: 0; }
      .journey-rocket-sticky { position: relative; height: 45vh; min-height: 240px; }
      .rocket-canvas { display: none !important; }
      .rocket-poster { display: block; }
      .journey-rocket-overlays { display: none; }
    }

    .rail a {
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }
    .rail a.active { border-color: var(--accent); color: var(--accent); }
    .journey-track-shell { overflow-x: auto; scroll-snap-type: x mandatory; }
    .journey-track { display: flex; gap: 16px; }
    .journey-stop {
      flex: 0 0 min(92vw, 980px);
      scroll-snap-align: start;
      background: var(--bg-elevated);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: var(--radius);
      padding: 28px;
    }

    /* Resume */
    .resume-shell-section {
      background: linear-gradient(180deg, #0c0f1a, #12162a);
    }
    .resume-panel {
      max-width: 860px;
      margin: 0 auto;
      padding: 28px;
      background: rgba(18,22,42,0.9);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text);
    }
    .resume-page {
      background: #fff;
      color: #111;
      border-radius: var(--radius);
      padding: 0.55in;
      box-shadow: 0 24px 60px rgba(0,0,0,0.35);
    }

    .site-footer {
      background: #070914;
      color: var(--text-muted);
      padding: 72px 0 28px;
    }
    .site-footer-inner {
      width: var(--container);
      margin: 0 auto;
      display: grid;
      gap: 28px;
      grid-template-columns: 1fr;
    }
    @media (min-width: 900px) { .site-footer-inner { grid-template-columns: 1.2fr 0.8fr 1fr; } }
    .site-footer h2 { margin: 0; font-size: clamp(2.5rem, 6vw, 4rem); color: var(--text); }
    .footer-kicker { color: var(--accent); font-size: 11px; letter-spacing: 0.14em; }

    /* Utility: hide custom cursor on touch */
    .custom-cursor, .custom-cursor-dot { pointer-events: none; }

    @media print {
      @page { size: letter; margin: 0.59in; }
      body { background: #fff; }
      body * { visibility: hidden !important; }
      #resume, #resume * { visibility: visible !important; }
      #resume { position: absolute; left: 0; top: 0; width: 100%; background: #fff; }
      .noprint, .site-nav, .mobile-nav, .site-footer, .preloader, #scroll-progress, #intro-canvas, .intro-jl-overlay, .intro-skip { display: none !important; }
    }
`;

const printCssClose = `  </style>
</head>
`;

const bodyOpen = `<body>
  <canvas id="intro-canvas" width="1920" height="1080" aria-hidden="true"></canvas>
  <div class="intro-jl-overlay" id="introJlOverlay" aria-hidden="true">JL</div>
  <button type="button" class="intro-skip" id="introSkip" aria-label="Skip intro">Skip</button>

  <div class="preloader" id="preloader" aria-hidden="true">
    <div class="preloader-inner">
      <p class="preloader-mark">JL</p>
      <div class="preloader-bar" aria-hidden="true"><span id="preloaderBarFill"></span></div>
    </div>
  </div>
`;

// Strip old inline style in hero if any - main might contain <style> for switch - keep as-is

const bodyMid = `
  <div id="scroll-progress" aria-hidden="true"></div>
  <div class="custom-cursor" id="customCursor" aria-hidden="true"></div>
  <div class="custom-cursor-dot" id="customCursorDot" aria-hidden="true"></div>

  <header class="site-nav" id="siteNav">
    <div class="site-nav-inner">
      <a class="brand-badge" href="#hero" aria-label="James Liebel home">JL</a>
      <nav class="nav-links" aria-label="Primary">
        <span class="nav-indicator" id="navIndicator" aria-hidden="true"></span>
        <a class="nav-link" href="#hero">Home</a>
        <a class="nav-link" href="#skills">Skills</a>
        <a class="nav-link" href="#projects">Featured Work</a>
        <a class="nav-link" href="#visualizations">Visualizations</a>
        <a class="nav-link" href="#journey">Journey</a>
        <a class="nav-link" href="#resume">Resume</a>
      </nav>
      <div class="nav-actions">
        <a class="nav-icon-link" href="https://github.com/James-Liebel" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.3 9.4 7.88 10.92.58.1.79-.25.79-.56v-1.97c-3.2.69-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a10.95 10.95 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.83 1.19 3.09 0 4.43-2.69 5.41-5.26 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
          </svg>
        </a>
        <div class="nav-availability" aria-label="Available for internships">
          <span class="nav-availability-dot" aria-hidden="true"></span>
          <span>Available · Summer 2026</span>
        </div>
        <button class="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-controls="mobileNav" aria-label="Open navigation">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <div class="mobile-nav" id="mobileNav" hidden>
    <div class="mobile-nav-inner">
      <div class="mobile-nav-top">
        <a class="brand-badge" href="#hero" aria-label="James Liebel home">JL</a>
        <button class="nav-toggle" id="navClose" type="button" aria-label="Close navigation">
          <span></span><span></span><span></span>
        </button>
      </div>
      <nav class="mobile-nav-links" aria-label="Mobile">
        <a href="#hero">Home</a>
        <a href="#skills">Skills</a>
        <a href="#projects">Featured Work</a>
        <a href="#visualizations">Visualizations</a>
        <a href="#journey">Journey</a>
        <a href="#resume">Resume</a>
      </nav>
      <div class="mobile-nav-actions">
        <a href="https://github.com/James-Liebel" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://linkedin.com/in/james-liebel" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </div>
  </div>

  <main class="site-main">
${main}
  </main>
`;

// Grab portfolio-site.js through inline Power BI script only (inside <body>);
// strip any existing canvas IIFE so we never duplicate it on re-run.
const scriptsIdx = html.indexOf('<script src="projects/web/portfolio-site.js"');
if (scriptsIdx === -1) {
  console.error("scripts not found");
  process.exit(1);
}
const bodyCloseIdx = html.indexOf("</body>");
let scriptsTail =
  bodyCloseIdx === -1
    ? html.slice(scriptsIdx)
    : html.slice(scriptsIdx, bodyCloseIdx);
scriptsTail = scriptsTail.trimEnd();
const canvasDuplicateMark =
  "\n\n  <script>\n(function () {\n  'use strict';\n\n  function coverDraw";
const dupAt = scriptsTail.indexOf(canvasDuplicateMark);
if (dupAt !== -1) scriptsTail = scriptsTail.slice(0, dupAt).trimEnd();

const canvasBoot = `
  <script>
(function () {
  'use strict';

  function coverDraw(ctx, img, w, h) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const scale = Math.max(w / iw, h / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const x = (w - nw) / 2;
    const y = (h - nh) / 2;
    ctx.drawImage(img, x, y, nw, nh);
  }

  function pad3(n) {
    return String(n).padStart(3, '0');
  }

  async function discoverFrames(folder) {
    const cap = 9999;
    const conc = 8;
    let total = 0;
    outer: for (let start = 1; start <= cap; start += conc) {
      const batch = [];
      for (let j = 0; j < conc && start + j <= cap; j++) batch.push(start + j);
      const results = await Promise.all(
        batch.map(n =>
          fetch(folder + '/ezgif-frame-' + pad3(n) + '.jpg', { method: 'HEAD' })
            .then(r => r.ok)
            .catch(() => false)
        )
      );
      for (let k = 0; k < results.length; k++) {
        if (!results[k]) break outer;
        total++;
      }
    }
    if (total === 0) console.warn('[frames] no frames in', folder);
    return total;
  }

  function loadImages(folder, count) {
    const imgs = [];
    const promises = [];
    for (let i = 1; i <= count; i++) {
      const img = new Image();
      img.decoding = 'async';
      imgs.push(img);
      promises.push(
        new Promise((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error('img'));
          img.src = folder + '/ezgif-frame-' + pad3(i) + '.jpg';
        }).catch(() => {})
      );
    }
    return Promise.all(promises).then(() => imgs);
  }

  function dispatchIntroComplete() {
    window.dispatchEvent(new Event('intro-complete'));
  }

  function initIntro() {
    const canvas = document.getElementById('intro-canvas');
    const jl = document.getElementById('introJlOverlay');
    const skip = document.getElementById('introSkip');
    if (!canvas) return dispatchIntroComplete();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      if (jl) jl.remove();
      canvas.remove();
      if (skip) skip.remove();
      return dispatchIntroComplete();
    }

    const ctx = canvas.getContext('2d');
    let finished = false;
    function cleanup() {
      if (finished) return;
      finished = true;
      if (jl) jl.remove();
      if (skip) skip.remove();
      canvas.remove();
      dispatchIntroComplete();
    }

    function resize() {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    skip?.addEventListener('click', () => fadeOut());

    function fadeOut() {
      canvas.style.transition = 'opacity 0.6s ease';
      canvas.style.opacity = '0';
      if (jl) jl.style.transition = 'opacity 0.6s ease', jl.style.opacity = '0';
      if (skip) skip.style.opacity = '0';
      setTimeout(cleanup, 620);
    }

    discoverFrames('intro').then(count => {
      if (!count) {
        console.warn('[intro] skipped');
        return cleanup();
      }
      return loadImages('intro', count).then(imgs => ({ imgs, count }));
    }).then(data => {
      if (!data) return;
      const { imgs, count } = data;
      if (jl) jl.style.display = 'none';
      let frameIndex = 0;
      const fps = 30;
      const frameMs = 1000 / fps;
      let last = performance.now();
      let heldEnd = false;

      function tick(now) {
        if (finished) return;
        resize();
        const w = canvas.width / devicePixelRatio;
        const h = canvas.height / devicePixelRatio;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        coverDraw(ctx, imgs[frameIndex], w, h);

        if (frameIndex >= count - 1) {
          if (!heldEnd) {
            heldEnd = true;
            setTimeout(() => fadeOut(), 400);
          }
          return;
        }

        if (now - last >= frameMs) {
          frameIndex++;
          last = now;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }).catch(() => cleanup());
  }

  function initServers() {
    const zone = document.getElementById('servers-scrub-zone');
    const canvas = document.getElementById('servers-canvas');
    if (!zone || !canvas || !window.gsap || !window.ScrollTrigger) return;
    const sticky = zone.querySelector('.servers-scrub-sticky');
    let count = 120;
    const mq = window.matchMedia('(max-width: 767px)');
    if (mq.matches) {
      zone.style.setProperty('--servers-frames', String(count));
      return;
    }

    const ctx = canvas.getContext('2d');
    function sizeCanvas() {
      const r = sticky.getBoundingClientRect();
      canvas.width = r.width * devicePixelRatio;
      canvas.height = r.height * devicePixelRatio;
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(async e => {
          if (!e.isIntersecting) return;
          io.disconnect();
          count = await discoverFrames('servers');
          if (!count) return;
          zone.style.setProperty('--servers-frames', String(count));
          zone.style.height = 'max(200vh, calc(' + count + ' * 20px))';
          const imgs = await loadImages('servers', count);
          sizeCanvas();
          window.addEventListener('resize', sizeCanvas, { passive: true });

          gsap.registerPlugin(ScrollTrigger);
          sizeCanvas();
          ScrollTrigger.create({
            trigger: zone,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: self => {
              const t = self.progress;
              const idx = Math.min(count - 1, Math.floor(t * count));
              sizeCanvas();
              const cw = canvas.width / devicePixelRatio;
              const ch = canvas.height / devicePixelRatio;
              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, cw, ch);
              coverDraw(ctx, imgs[idx], cw, ch);
            }
          });
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);
          coverDraw(ctx, imgs[0], canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);
        });
      },
      { rootMargin: '300px 0px', threshold: 0 }
    );
    io.observe(zone);
  }

  function initRocket() {
    const zone = document.getElementById('journey-rocket-zone');
    const canvas = document.getElementById('rocket-canvas');
    if (!zone || !canvas || !window.gsap || !window.ScrollTrigger) return;
    const mq = window.matchMedia('(max-width: 767px)');
    if (mq.matches) {
      zone.style.setProperty('--rocket-frames', '120');
      return;
    }

    const panels = [
      document.querySelector('#journey-overview.jpanel'),
      document.querySelector('#journey-experience.jpanel'),
      document.querySelector('#journey-education.jpanel'),
      document.querySelector('#journey-leadership.jpanel')
    ];
    const cards = [...zone.querySelectorAll('.journey-overlay-card')];
    panels.forEach((p, i) => {
      if (!p || !cards[i]) return;
      const clone = p.cloneNode(true);
      clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
      cards[i].innerHTML = "";
      while (clone.firstChild) cards[i].appendChild(clone.firstChild);
    });

    let activeSeg = -1;
    function setSegment(seg) {
      if (seg === activeSeg) return;
      activeSeg = seg;
      cards.forEach((c, i) => {
        c.classList.toggle('is-visible', i === seg);
      });
    }

    const ctx = canvas.getContext('2d');
    const sticky = zone.querySelector('.journey-rocket-sticky');
    function sizeCanvas() {
      const r = sticky.getBoundingClientRect();
      canvas.width = r.width * devicePixelRatio;
      canvas.height = r.height * devicePixelRatio;
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(async e => {
          if (!e.isIntersecting) return;
          io.disconnect();
          let count = await discoverFrames('rockets');
          if (!count) return;
          zone.style.setProperty('--rocket-frames', String(count));
          zone.style.height = 'max(300vh, calc(' + count + ' * 24px))';
          const imgs = await loadImages('rockets', count);
          sizeCanvas();
          window.addEventListener('resize', sizeCanvas, { passive: true });

          gsap.registerPlugin(ScrollTrigger);
          sizeCanvas();
          ScrollTrigger.create({
            trigger: zone,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: self => {
              const t = self.progress;
              const idx = Math.min(count - 1, Math.floor(t * count));
              sizeCanvas();
              const cw = canvas.width / devicePixelRatio;
              const ch = canvas.height / devicePixelRatio;
              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, cw, ch);
              coverDraw(ctx, imgs[idx], cw, ch);
              const seg = Math.min(3, Math.floor(t * 4));
              setSegment(seg);
            }
          });
          setSegment(0);
        });
      },
      { rootMargin: '300px 0px', threshold: 0 }
    );
    io.observe(zone);
  }

  function initGlobe() {
    const section = document.getElementById('visualizations');
    const canvas = document.getElementById('globe-canvas');
    if (!section || !canvas) return;
    const ctx = canvas.getContext('2d');
    const mq = window.matchMedia('(max-width: 767px)');
    if (mq.matches) return;

    function sizeCanvas() {
      const r = section.getBoundingClientRect();
      canvas.width = Math.max(1, r.width * devicePixelRatio);
      canvas.height = Math.max(1, r.height * devicePixelRatio);
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(async e => {
          if (!e.isIntersecting) return;
          io.disconnect();
          const count = await discoverFrames('globe');
          if (!count) return;
          const imgs = await loadImages('globe', count);
          sizeCanvas();
          window.addEventListener('resize', sizeCanvas, { passive: true });

          let frame = 0;
          const fps = 30;
          const frameMs = 1000 / fps;
          let last = performance.now();
          let acc = 0;
          function loop(now) {
            acc += now - last;
            last = now;
            while (acc >= frameMs) {
              frame = (frame + 1) % count;
              acc -= frameMs;
            }
            const img = imgs[frame];
            const w = canvas.width / devicePixelRatio;
            const h = canvas.height / devicePixelRatio;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
            coverDraw(ctx, img, w, h);
            requestAnimationFrame(loop);
          }
          requestAnimationFrame(loop);
        });
      },
      { rootMargin: '300px 0px', threshold: 0.01 }
    );
    io.observe(section);
  }

  window.addEventListener('load', () => {
    Promise.all([
      discoverFrames('intro'),
      discoverFrames('servers'),
      discoverFrames('rockets'),
      discoverFrames('globe')
    ]).catch(() => {});

    initIntro();
    initServers();
    initRocket();
    initGlobe();
  });
})();
  </script>
`;

const out =
  headAndOpenBody +
  cinematicCss +
  printCssClose +
  bodyOpen +
  bodyMid +
  scriptsTail +
  canvasBoot +
  `
</body>

</html>
`;

fs.writeFileSync(htmlPath, out, "utf8");
console.log("Wrote new index.html");
