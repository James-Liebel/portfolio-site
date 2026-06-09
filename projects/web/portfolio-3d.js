/* Hero 3D data constellation. ES module, loaded only on capable desktops by the
   inline bootstrap in index.html (skipped on mobile, reduced-motion, low-power,
   and non-WebGL2 machines, which also skips the ~750KB Three.js download).

   One particle cloud (n=2400) morphs between three formations on a timed cycle:
   k-means scatter, loss surface with a gradient-descent path, dense network with
   signal pulses. The earlier hero field was removed for reading as cursor noise;
   this scene avoids that failure mode on purpose: no per-frame jitter, no
   cursor-following, one slow rigid rotation with low-frequency breathing only. */

import * as THREE from './vendor/three.module.min.js';

(function () {
  'use strict';

  if (window.__heroConstellation) return;
  window.__heroConstellation = true;

  const N = 2400;
  const FOV = 42;
  const HOLD_MS = 6800;
  const MORPH_MS = 2600;
  const INTRO_MS = 3200;
  const EDGE_SEGMENTS = 8;

  const PALETTES = {
    dark: {
      cluster: [[0.506, 0.549, 0.972], [0.133, 0.827, 0.933], [0.494, 1.0, 0.831]],
      outlier: [0.42, 0.46, 0.62],
      surfaceLow: [0.31, 0.33, 0.78],
      surfaceHigh: [0.494, 1.0, 0.831],
      layers: [[0.506, 0.549, 0.972], [0.133, 0.827, 0.933], [0.494, 1.0, 0.831]],
      grid: 0x6366f1,
      gridOpacity: 0.07,
      alpha: 1,
      additive: true
    },
    light: {
      cluster: [[0.31, 0.275, 0.898], [0.035, 0.569, 0.698], [0.022, 0.588, 0.412]],
      outlier: [0.55, 0.6, 0.7],
      surfaceLow: [0.26, 0.23, 0.75],
      surfaceHigh: [0.022, 0.588, 0.412],
      layers: [[0.31, 0.275, 0.898], [0.035, 0.569, 0.698], [0.022, 0.588, 0.412]],
      grid: 0x4f46e5,
      gridOpacity: 0.12,
      alpha: 0.85,
      additive: false
    }
  };

  const HUD_LABELS = [
    '01 · k-means scatter · k=3',
    '02 · loss surface · gradient descent',
    '03 · dense network · 4 layers'
  ];

  // ─── Formation generators (positions cached, colors theme-dependent) ──────

  let gaussSpare = null;
  function gauss() {
    if (gaussSpare !== null) {
      const v = gaussSpare;
      gaussSpare = null;
      return v;
    }
    let u = 0;
    let v = 0;
    let s = 0;
    do {
      u = Math.random() * 2 - 1;
      v = Math.random() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const m = Math.sqrt((-2 * Math.log(s)) / s);
    gaussSpare = v * m;
    return u * m;
  }

  function genScatter() {
    const pos = new Float32Array(N * 3);
    const key = new Float32Array(N); // cluster index, 3 = outlier
    const centers = [[-5.4, 2.4, -1.6], [4.8, -1.4, 1.8], [0.6, 4.6, 3.0]];
    const spreads = [[2.2, 1.5, 1.9], [2.7, 1.9, 1.6], [1.7, 1.4, 1.6]];
    for (let i = 0; i < N; i++) {
      if (Math.random() < 0.12) {
        // sparse outlier shell so the clusters read as structure, not a blob
        const r = 9.5 + Math.random() * 3.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.cos(phi) * 0.6;
        pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        key[i] = 3;
      } else {
        const c = i % 3;
        pos[i * 3] = centers[c][0] + gauss() * spreads[c][0];
        pos[i * 3 + 1] = centers[c][1] + gauss() * spreads[c][1];
        pos[i * 3 + 2] = centers[c][2] + gauss() * spreads[c][2];
        key[i] = c;
      }
    }
    return { pos, key };
  }

  function lossHeight(x, z) {
    const r2 = x * x + z * z;
    return -3.4 * Math.exp(-r2 / 24) + 0.4 * Math.sin(x * 1.05) * Math.cos(z * 1.2) + 0.018 * r2;
  }

  function genSurface() {
    const pos = new Float32Array(N * 3);
    const key = new Float32Array(N); // normalized height
    const cols = 56;
    const rows = 42;
    const gridCount = cols * rows;
    let minH = Infinity;
    let maxH = -Infinity;
    const heights = new Float32Array(gridCount);
    for (let i = 0; i < gridCount; i++) {
      const cx = i % cols;
      const cz = (i / cols) | 0;
      const x = (cx / (cols - 1) - 0.5) * 17;
      const z = (cz / (rows - 1) - 0.5) * 13;
      const h = lossHeight(x, z);
      heights[i] = h;
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
      pos[i * 3] = x;
      pos[i * 3 + 1] = h;
      pos[i * 3 + 2] = z;
    }
    for (let i = 0; i < gridCount; i++) {
      key[i] = (heights[i] - minH) / (maxH - minH);
    }
    // leftover particles float above the surface as sampled observations
    for (let i = gridCount; i < N; i++) {
      const x = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 11;
      pos[i * 3] = x;
      pos[i * 3 + 1] = lossHeight(x, z) + 0.7 + Math.random() * 2.6;
      pos[i * 3 + 2] = z;
      key[i] = 1; // brightest end of the ramp
    }
    return { pos, key };
  }

  const NET_X = [-7.6, -2.6, 2.6, 7.6];
  const NET_COUNTS = [5, 9, 9, 4];

  function netNodes() {
    const layers = [];
    for (let l = 0; l < 4; l++) {
      const nodes = [];
      const count = NET_COUNTS[l];
      if (count === 9) {
        for (let a = -1; a <= 1; a++) {
          for (let b = -1; b <= 1; b++) nodes.push([NET_X[l], a * 3.1, b * 3.1]);
        }
      } else if (count === 5) {
        nodes.push([NET_X[l], 0, 0]);
        for (let a = -1; a <= 1; a += 2) {
          for (let b = -1; b <= 1; b += 2) nodes.push([NET_X[l], a * 2.9, b * 2.9]);
        }
      } else {
        for (let a = -1; a <= 1; a += 2) {
          for (let b = -1; b <= 1; b += 2) nodes.push([NET_X[l], a * 2.1, b * 2.1]);
        }
      }
      layers.push(nodes);
    }
    return layers;
  }

  function genNetwork() {
    const layers = netNodes();
    const edges = [];
    for (let l = 0; l < 3; l++) {
      for (const a of layers[l]) {
        for (const b of layers[l + 1]) edges.push([a, b, l]);
      }
    }
    const pos = new Float32Array(N * 3);
    const key = new Float32Array(N); // 0..1 progress through the network
    for (let i = 0; i < N; i++) {
      const onNode = Math.random() < 0.25;
      if (onNode) {
        const l = (Math.random() * 4) | 0;
        const node = layers[l][(Math.random() * layers[l].length) | 0];
        pos[i * 3] = node[0] + gauss() * 0.32;
        pos[i * 3 + 1] = node[1] + gauss() * 0.32;
        pos[i * 3 + 2] = node[2] + gauss() * 0.32;
        key[i] = l / 3;
      } else {
        const [a, b, l] = edges[(Math.random() * edges.length) | 0];
        const t = Math.random();
        pos[i * 3] = a[0] + (b[0] - a[0]) * t + gauss() * 0.16;
        pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + gauss() * 0.16;
        pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + gauss() * 0.16;
        key[i] = (l + t) / 3;
      }
    }
    return { pos, key, edges };
  }

  function genIntro() {
    // wide sphere shell the cloud collapses from on first reveal
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 16 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return { pos, key: null };
  }

  function colorize(formation, data, palette, out) {
    const mixc = (a, b, t, j) => a[j] + (b[j] - a[j]) * t;
    for (let i = 0; i < N; i++) {
      let c;
      if (formation === 0) {
        c = data.key[i] === 3 ? palette.outlier : palette.cluster[data.key[i]];
        out[i * 3] = c[0];
        out[i * 3 + 1] = c[1];
        out[i * 3 + 2] = c[2];
      } else if (formation === 1) {
        const t = data.key[i];
        for (let j = 0; j < 3; j++) out[i * 3 + j] = mixc(palette.surfaceLow, palette.surfaceHigh, t, j);
      } else {
        const t = data.key[i] * 2; // 0..2 across the three layer colors
        const a = t < 1 ? palette.layers[0] : palette.layers[1];
        const b = t < 1 ? palette.layers[1] : palette.layers[2];
        const f = t < 1 ? t : t - 1;
        for (let j = 0; j < 3; j++) out[i * 3 + j] = mixc(a, b, Math.min(f, 1), j);
      }
    }
  }

  // ─── Shaders ───────────────────────────────────────────────────────────────

  const POINTS_VERT = `
    attribute vec3 aTo;
    attribute vec3 aColorFrom;
    attribute vec3 aColorTo;
    attribute float aSeed;
    attribute float aSize;
    uniform float uTime;
    uniform float uMorph;
    uniform float uPointScale;
    varying vec3 vColor;
    varying float vFade;
    void main() {
      float stag = 0.4;
      float t = clamp(uMorph * (1.0 + stag) - aSeed * stag, 0.0, 1.0);
      t = t * t * (3.0 - 2.0 * t);
      vec3 p = mix(position, aTo, t);
      p += 0.12 * vec3(
        sin(uTime * 0.21 + aSeed * 6.2832),
        cos(uTime * 0.17 + aSeed * 12.566),
        sin(uTime * 0.14 + aSeed * 9.4248)
      );
      vColor = mix(aColorFrom, aColorTo, t);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float dist = max(-mv.z, 0.1);
      gl_PointSize = min(aSize * uPointScale / dist, 64.0);
      vFade = smoothstep(58.0, 27.0, dist) * smoothstep(5.0, 11.0, dist);
      vFade *= 0.78 + 0.22 * sin(uTime * 0.5 + aSeed * 6.2832);
      gl_Position = projectionMatrix * mv;
    }
  `;

  const POINTS_FRAG = `
    uniform float uAlpha;
    varying vec3 vColor;
    varying float vFade;
    void main() {
      vec2 c = gl_PointCoord - vec2(0.5);
      float d = length(c);
      if (d > 0.5) discard;
      float core = 1.0 - smoothstep(0.0, 0.2, d);
      float halo = 1.0 - smoothstep(0.1, 0.5, d);
      float a = (core * 0.9 + halo * 0.32) * vFade * uAlpha;
      gl_FragColor = vec4(vColor, a);
    }
  `;

  const LINE_VERT = `
    attribute vec3 aColor;
    attribute float aT;
    attribute float aSeed;
    uniform float uTime;
    uniform float uPulseSpeed;
    varying vec3 vColor;
    varying float vBright;
    void main() {
      float head = fract(uTime * uPulseSpeed + aSeed);
      float pulse = smoothstep(0.09, 0.0, abs(aT - head));
      vBright = 0.3 + pulse * 2.1;
      vColor = aColor;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const LINE_FRAG = `
    uniform float uAlpha;
    uniform float uLineAlpha;
    varying vec3 vColor;
    varying float vBright;
    void main() {
      float a = 0.36 * vBright * uLineAlpha * uAlpha;
      if (a < 0.004) discard;
      gl_FragColor = vec4(vColor * vBright, a);
    }
  `;

  // ─── Scene assembly ────────────────────────────────────────────────────────

  function buildLineSystem(points, colorA, colorB, pulseSpeed, palette) {
    // subdivide so a brightness pulse can travel along each polyline
    const segs = [];
    for (let e = 0; e < points.length; e++) {
      const [a, b] = points[e];
      const seed = Math.random();
      for (let s = 0; s < EDGE_SEGMENTS; s++) {
        const t0 = s / EDGE_SEGMENTS;
        const t1 = (s + 1) / EDGE_SEGMENTS;
        segs.push([a, b, t0, seed], [a, b, t1, seed]);
      }
    }
    const count = segs.length;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const ts = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const [a, b, t, seed] = segs[i];
      pos[i * 3] = a[0] + (b[0] - a[0]) * t;
      pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t;
      pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t;
      for (let j = 0; j < 3; j++) col[i * 3 + j] = colorA[j] + (colorB[j] - colorA[j]) * t;
      ts[i] = t;
      seeds[i] = seed;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aT', new THREE.BufferAttribute(ts, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAlpha: { value: 1 },
        uLineAlpha: { value: 0 },
        uPulseSpeed: { value: pulseSpeed }
      },
      transparent: true,
      depthWrite: false,
      blending: palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const lines = new THREE.LineSegments(geo, mat);
    lines.frustumCulled = false;
    return lines;
  }

  function descentPath() {
    // numeric gradient descent on the loss surface, drawn just above it
    const pts = [];
    let x = 6.6;
    let z = -4.6;
    const eps = 0.05;
    const step = 0.5;
    for (let i = 0; i < 26; i++) {
      pts.push([x, lossHeight(x, z) + 0.16, z]);
      const gx = (lossHeight(x + eps, z) - lossHeight(x - eps, z)) / (2 * eps);
      const gz = (lossHeight(x, z + eps) - lossHeight(x, z - eps)) / (2 * eps);
      x -= step * gx;
      z -= step * gz;
    }
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
    return segs;
  }

  function buildHud(host) {
    const hud = document.createElement('div');
    hud.className = 'hero-3d-hud';
    hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML =
      '<i class="hud-c hud-c--tl"></i><i class="hud-c hud-c--tr"></i>' +
      '<i class="hud-c hud-c--bl"></i><i class="hud-c hud-c--br"></i>' +
      '<div class="hud-readout">' +
      '<span class="hud-line hud-line--formation"></span>' +
      '<span class="hud-line hud-line--meta"></span>' +
      '</div>';
    host.appendChild(hud);
    return {
      root: hud,
      formation: hud.querySelector('.hud-line--formation'),
      meta: hud.querySelector('.hud-line--meta')
    };
  }

  function init() {
    // the inline bootstrap already filters, but guard again in case this module
    // is ever loaded directly
    if (
      document.documentElement.classList.contains('perf-lite') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ) {
      return;
    }
    const hero = document.getElementById('hero');
    const canvas = document.getElementById('hero-webgl');
    const ambient = hero ? hero.querySelector('.hero-ambient') : null;
    if (!hero || !canvas || !ambient) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power'
      });
    } catch (err) {
      canvas.remove();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
    const group = new THREE.Group();
    scene.add(group);

    const root = document.documentElement;
    let palette = root.getAttribute('data-theme') === 'light' ? PALETTES.light : PALETTES.dark;

    // formation caches: positions are theme-independent, colors are not
    const data = [genScatter(), genSurface(), genNetwork()];
    const intro = genIntro();
    const colorScratch = new Float32Array(N * 3);

    const seeds = new Float32Array(N);
    const sizes = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      seeds[i] = Math.random();
      sizes[i] = 0.07 + Math.random() * 0.09;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(intro.pos.slice(), 3));
    geo.setAttribute('aTo', new THREE.BufferAttribute(data[0].pos.slice(), 3));
    colorize(0, data[0], palette, colorScratch);
    geo.setAttribute('aColorFrom', new THREE.BufferAttribute(colorScratch.slice(), 3));
    geo.setAttribute('aColorTo', new THREE.BufferAttribute(colorScratch.slice(), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 40);

    const pointsMat = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERT,
      fragmentShader: POINTS_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uPointScale: { value: 600 },
        uAlpha: { value: palette.alpha }
      },
      transparent: true,
      depthWrite: false,
      blending: palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const points = new THREE.Points(geo, pointsMat);
    points.frustumCulled = false;
    group.add(points);

    const netLines = buildLineSystem(
      data[2].edges.map(e => [e[0], e[1]]),
      palette.layers[0],
      palette.layers[2],
      0.1,
      palette
    );
    group.add(netLines);

    const pathLines = buildLineSystem(descentPath(), palette.surfaceHigh, palette.surfaceLow, 0.16, palette);
    group.add(pathLines);

    const grid = new THREE.LineSegments(
      buildGridGeometry(),
      new THREE.LineBasicMaterial({
        color: palette.grid,
        transparent: true,
        opacity: palette.gridOpacity,
        depthWrite: false
      })
    );
    grid.position.y = -6.6;
    group.add(grid);

    function buildGridGeometry() {
      const lines = [];
      const half = 11;
      const stepCount = 10;
      for (let i = 0; i <= stepCount; i++) {
        const v = -half + (i / stepCount) * half * 2;
        lines.push(-half, 0, v, half, 0, v, v, 0, -half, v, 0, half);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lines), 3));
      return g;
    }

    const hud = buildHud(ambient);
    hud.formation.textContent = HUD_LABELS[0];
    hud.meta.textContent = 'n=2,400 · webgl2';

    // ─── State ───────────────────────────────────────────────────────────────
    let fromIdx = 0;
    let toIdx = 0;
    let phase = 'intro'; // intro | hold | morph
    let phaseStart = 0;
    let yaw = 0.6;
    let pointerX = 0;
    let pointerY = 0;
    let yawOff = 0;
    let pitchOff = 0;
    let scrollFade = 1;
    let netAlpha = 0;
    let pathAlpha = 0;
    let gridAlpha = 1;
    let running = false;
    let raf = 0;
    let lastT = 0;
    let frames = 0;
    let fpsWindowStart = 0;
    let live = false;

    function applyTheme() {
      palette = root.getAttribute('data-theme') === 'light' ? PALETTES.light : PALETTES.dark;
      colorize(fromIdx, data[fromIdx], palette, colorScratch);
      geo.attributes.aColorFrom.array.set(colorScratch);
      geo.attributes.aColorFrom.needsUpdate = true;
      colorize(toIdx, data[toIdx], palette, colorScratch);
      geo.attributes.aColorTo.array.set(colorScratch);
      geo.attributes.aColorTo.needsUpdate = true;
      const blend = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
      [pointsMat, netLines.material, pathLines.material].forEach(m => {
        m.blending = blend;
        m.needsUpdate = true;
      });
      grid.material.color.setHex(palette.grid);
      grid.material.opacity = palette.gridOpacity;
      canvas.style.mixBlendMode = palette.additive ? 'screen' : 'normal';
    }

    new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    function setSize() {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      pointsMat.uniforms.uPointScale.value =
        renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2));
      group.position.x = w >= 1180 ? 3.4 : 0;
    }
    setSize();
    if (window.ResizeObserver) {
      new ResizeObserver(setSize).observe(hero);
    } else {
      window.addEventListener('resize', setSize, { passive: true });
    }

    hero.addEventListener(
      'pointermove',
      e => {
        const r = hero.getBoundingClientRect();
        pointerX = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointerY = ((e.clientY - r.top) / r.height) * 2 - 1;
      },
      { passive: true }
    );

    let heroHeight = 1;
    function measureScroll() {
      heroHeight = Math.max(hero.offsetHeight, 1);
    }
    function updateScrollFade() {
      scrollFade = 1 - Math.min(Math.max(window.scrollY / (heroHeight * 0.85), 0), 1);
    }
    measureScroll();
    updateScrollFade();
    window.addEventListener('resize', measureScroll, { passive: true });
    window.addEventListener('scroll', updateScrollFade, { passive: true });

    function startMorph(now) {
      fromIdx = toIdx;
      toIdx = (toIdx + 1) % 3;
      geo.attributes.position.array.set(data[fromIdx].pos);
      geo.attributes.position.needsUpdate = true;
      colorize(fromIdx, data[fromIdx], palette, colorScratch);
      geo.attributes.aColorFrom.array.set(colorScratch);
      geo.attributes.aColorFrom.needsUpdate = true;
      geo.attributes.aTo.array.set(data[toIdx].pos);
      geo.attributes.aTo.needsUpdate = true;
      colorize(toIdx, data[toIdx], palette, colorScratch);
      geo.attributes.aColorTo.array.set(colorScratch);
      geo.attributes.aColorTo.needsUpdate = true;
      phase = 'morph';
      phaseStart = now;
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!lastT) {
        lastT = now;
        fpsWindowStart = now;
        phaseStart = now;
      }
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      const time = now / 1000;

      // fps readout: real measurement, refreshed once per second
      frames++;
      if (now - fpsWindowStart >= 1000) {
        const fps = Math.round((frames * 1000) / (now - fpsWindowStart));
        hud.meta.textContent = 'n=2,400 · ' + fps + ' fps · webgl2';
        frames = 0;
        fpsWindowStart = now;
      }

      // formation scheduling
      if (phase === 'intro') {
        const p = Math.min((now - phaseStart) / INTRO_MS, 1);
        pointsMat.uniforms.uMorph.value = p;
        if (p === 1) {
          phase = 'hold';
          phaseStart = now;
        }
      } else if (phase === 'hold') {
        pointsMat.uniforms.uMorph.value = 1;
        if (now - phaseStart >= HOLD_MS) startMorph(now);
      } else {
        const p = Math.min((now - phaseStart) / MORPH_MS, 1);
        pointsMat.uniforms.uMorph.value = p;
        if (p >= 0.5 && hud.formation.textContent !== HUD_LABELS[toIdx]) {
          hud.formation.textContent = HUD_LABELS[toIdx];
        }
        if (p === 1) {
          phase = 'hold';
          phaseStart = now;
        }
      }

      // per-formation accessory fades
      const settledNet = toIdx === 2 && phase !== 'intro';
      const settledPath = toIdx === 1 && phase !== 'intro';
      netAlpha += ((settledNet ? 1 : 0) - netAlpha) * Math.min(dt * 2.4, 1);
      pathAlpha += ((settledPath ? 1 : 0) - pathAlpha) * Math.min(dt * 2.4, 1);
      gridAlpha += ((toIdx === 2 ? 0 : 1) - gridAlpha) * Math.min(dt * 2.4, 1);
      netLines.material.uniforms.uLineAlpha.value = netAlpha;
      pathLines.material.uniforms.uLineAlpha.value = pathAlpha;
      grid.material.opacity = palette.gridOpacity * gridAlpha * scrollFade;

      // slow rigid rotation + pointer parallax, no cursor chasing
      yaw += dt * 0.05;
      yawOff += (pointerX * 0.3 - yawOff) * Math.min(dt * 2.2, 1);
      pitchOff += (pointerY * 0.14 - pitchOff) * Math.min(dt * 2.2, 1);
      const r = 24 + (1 - scrollFade) * 9;
      const cy = yaw + yawOff;
      camera.position.set(
        Math.sin(cy) * r,
        4.2 + pitchOff * 6 + (1 - scrollFade) * -2.5,
        Math.cos(cy) * r
      );
      camera.lookAt(0, 0.4, 0);

      const alpha = palette.alpha * scrollFade;
      pointsMat.uniforms.uAlpha.value = alpha;
      netLines.material.uniforms.uAlpha.value = alpha;
      pathLines.material.uniforms.uAlpha.value = alpha;
      pointsMat.uniforms.uTime.value = time;
      netLines.material.uniforms.uTime.value = time;
      pathLines.material.uniforms.uTime.value = time;

      if (scrollFade > 0.01) renderer.render(scene, camera);

      if (!live) {
        live = true;
        canvas.classList.add('is-live');
        hud.root.classList.add('is-live');
      }
    }

    function start() {
      if (running) return;
      running = true;
      lastT = 0;
      // a morph interrupted off-screen finishes invisibly; resuming mid-morph
      // would snap particles back to its start
      if (phase === 'morph') phase = 'hold';
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      entries => {
        const onScreen = entries[0].isIntersecting;
        if (onScreen && !document.hidden) start();
        else stop();
      },
      { rootMargin: '120px' }
    );
    io.observe(hero);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (scrollFade > 0) start();
    });

    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      stop();
      canvas.classList.remove('is-live');
      hud.root.classList.remove('is-live');
    });

    start();
  }

  function whenIdle(fn) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 2000 });
    else setTimeout(fn, 350);
  }

  if (document.readyState === 'complete') {
    whenIdle(init);
  } else {
    window.addEventListener('load', () => whenIdle(init), { once: true });
  }
})();
