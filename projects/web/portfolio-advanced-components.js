/* Portfolio advanced interactive components — loaded after main animation script */
(function () {
  'use strict';

  var MOBILE = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ─── 1. Hero WebGL particles ─────────────────────────────────────────────
  function initHeroWebGL() {
    if (MOBILE || reduced) return;
    var canvas = document.getElementById('hero-webgl');
    var hero = document.getElementById('hero');
    if (!canvas || !hero) return;

    var gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) {
      canvas.remove();
      return;
    }

    var N = 900;
    var positions = new Float32Array(N * 2);
    var velocities = new Float32Array(N);
    var sizes = new Float32Array(N);
    var offsets = new Float32Array(N * 2);
    var targets = new Float32Array(N * 2);
    var rands = new Float32Array(N);
    var i, j;
    for (i = 0; i < N; i++) {
      positions[i * 2] = Math.random() * 2 - 1;
      positions[i * 2 + 1] = Math.random() * 2 - 1;
      rands[i] = Math.random() * Math.PI * 2;
      velocities[i] = Math.random();
      sizes[i] = 1.5 + Math.random() * 2;
      offsets[i * 2] = offsets[i * 2 + 1] = 0;
      targets[i * 2] = targets[i * 2 + 1] = 0;
    }

    var vsSrc = [
      'attribute vec2 aBase;',
      'attribute float aRand;',
      'attribute float aSize;',
      'attribute float aVelocity;',
      'attribute vec2 aOffset;',
      'uniform float uTime;',
      'uniform vec2 uResolution;',
      'varying float vVel;',
      'void main(){',
      'vVel=aVelocity;',
      'vec2 p=aBase;',
      'p.x+=sin(uTime*0.7+aRand*6.28318)*0.12;',
      'p.y+=cos(uTime*0.55+aRand*4.0)*0.10;',
      'p+=aOffset;',
      'vec2 clip=p;',
      'gl_Position=vec4(clip,0.0,1.0);',
      'float dpr=uResolution.y>0.0?uResolution.x/max(uResolution.x,uResolution.y):1.0;',
      'gl_PointSize=aSize*(uResolution.y>0.0?min(uResolution.x,uResolution.y)/480.0:1.0)*2.0;',
      '}'
    ].join('');

    var fsSrc = [
      'precision mediump float;',
      'varying float vVel;',
      'void main(){',
      'vec2 c=gl_PointCoord-vec2(0.5);',
      'float d=length(c);',
      'if(d>0.5)discard;',
      'float a=(1.0-smoothstep(0.25,0.5,d))*0.35;',
      'vec3 c1=vec3(0.388,0.400,0.945);',
      'vec3 c2=vec3(0.494,1.0,0.831);',
      'vec3 col=mix(c1,c2,clamp(vVel,0.0,1.0));',
      'gl_FragColor=vec4(col,a);',
      '}'
    ].join('');

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    var vShader = compile(gl.VERTEX_SHADER, vsSrc);
    var fShader = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vShader || !fShader) {
      canvas.remove();
      return;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.remove();
      return;
    }
    gl.useProgram(prog);

    var locBase = gl.getAttribLocation(prog, 'aBase');
    var locRand = gl.getAttribLocation(prog, 'aRand');
    var locSize = gl.getAttribLocation(prog, 'aSize');
    var locVel = gl.getAttribLocation(prog, 'aVelocity');
    var locOff = gl.getAttribLocation(prog, 'aOffset');
    var uTime = gl.getUniformLocation(prog, 'uTime');
    var uRes = gl.getUniformLocation(prog, 'uResolution');

    var bufBase = gl.createBuffer();
    var bufRand = gl.createBuffer();
    var bufSize = gl.createBuffer();
    var bufVel = gl.createBuffer();
    var bufOff = gl.createBuffer();

    function bufData(buf, data, usage) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    }

    bufData(bufBase, positions, gl.STATIC_DRAW);
    bufData(bufRand, rands, gl.STATIC_DRAW);
    bufData(bufSize, sizes, gl.STATIC_DRAW);
    bufData(bufVel, velocities, gl.STATIC_DRAW);
    bufData(bufOff, offsets, gl.DYNAMIC_DRAW);

    function bindAttrib(buf, loc, size, stride, offset) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    }

    var mouseNdc = [0, 0];
    var running = false;
    var start = performance.now();
    var sizeDirty = true;

    function setSize(force) {
      var rect = hero.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(rect.width * dpr));
      var h = Math.max(1, Math.floor(rect.height * dpr));
      if (!force && canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      gl.viewport(0, 0, w, h);
    }

    function heroToNdc(clientX, clientY) {
      var rect = hero.getBoundingClientRect();
      var x = ((clientX - rect.left) / rect.width) * 2 - 1;
      var y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      return [x, y];
    }

    hero.addEventListener(
      'mousemove',
      function (e) {
        var ndc = heroToNdc(e.clientX, e.clientY);
        mouseNdc[0] = ndc[0];
        mouseNdc[1] = ndc[1];
      },
      { passive: true }
    );

    var io = new IntersectionObserver(
      function (ents) {
        ents.forEach(function (en) {
          running = en.isIntersecting;
          if (running) sizeDirty = true;
        });
      },
      { threshold: 0.01 }
    );
    io.observe(hero);

    window.addEventListener(
      'resize',
      function () {
        sizeDirty = true;
      },
      { passive: true }
    );

    function tick(now) {
      if (!running) {
        requestAnimationFrame(tick);
        return;
      }
      if (sizeDirty) {
        var rect0 = hero.getBoundingClientRect();
        var dpr0 = Math.min(window.devicePixelRatio || 1, 2);
        var w0 = Math.max(1, Math.floor(rect0.width * dpr0));
        var h0 = Math.max(1, Math.floor(rect0.height * dpr0));
        canvas.width = w0;
        canvas.height = h0;
        canvas.style.width = rect0.width + 'px';
        canvas.style.height = rect0.height + 'px';
        gl.viewport(0, 0, w0, h0);
        sizeDirty = false;
      }
      var t = (now - start) * 0.001;
      var mx = mouseNdc[0];
      var my = mouseNdc[1];
      var threshNdc = 0.2;
      for (i = 0; i < N; i++) {
        var bx = positions[i * 2];
        var by = positions[i * 2 + 1];
        var px = bx + Math.sin(t * 0.7 + rands[i] * 6.28318) * 0.12;
        var py = by + Math.cos(t * 0.55 + rands[i] * 4.0) * 0.1;
        var dx = px - mx;
        var dy = py - my;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var tx = 0;
        var ty = 0;
        if (dist < threshNdc && dist > 1e-6) {
          var push = (threshNdc - dist) / threshNdc * 0.1;
          tx = (dx / dist) * push;
          ty = (dy / dist) * push;
        }
        targets[i * 2] = tx;
        targets[i * 2 + 1] = ty;
        offsets[i * 2] = lerp(offsets[i * 2], targets[i * 2], 0.08);
        offsets[i * 2 + 1] = lerp(offsets[i * 2 + 1], targets[i * 2 + 1], 0.08);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, bufOff);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, offsets);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(prog);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);

      bindAttrib(bufBase, locBase, 2, 0, 0);
      bindAttrib(bufRand, locRand, 1, 0, 0);
      bindAttrib(bufSize, locSize, 1, 0, 0);
      bindAttrib(bufVel, locVel, 1, 0, 0);
      bindAttrib(bufOff, locOff, 2, 0, 0);

      gl.drawArrays(gl.POINTS, 0, N);
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // ─── 2. SVG path scroll dividers ───────────────────────────────────────────
  function initPathDividers() {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);

    function setup(idPrefix, pathId, dotId) {
      var svg = document.getElementById(idPrefix);
      var path = document.getElementById(pathId);
      var dot = document.getElementById(dotId);
      if (!svg || !path || !dot) return;
      var len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);

      var proxy = { p: 0 };
      window.gsap.to(proxy, {
        p: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: svg,
          start: 'top 85%',
          end: 'bottom 15%',
          scrub: true,
          onUpdate: function () {
            var pr = proxy.p;
            path.style.strokeDashoffset = String(len * (1 - pr));
            var pt = path.getPointAtLength(len * pr);
            dot.setAttribute('cx', pt.x);
            dot.setAttribute('cy', pt.y);
          }
        }
      });
    }

    setup('sectionDividerHeroSkills', 'pathHeroSkills', 'dotHeroSkills');
    setup('sectionDividerCapProj', 'pathCapProj', 'dotCapProj');
    setup('sectionDividerProjViz', 'pathProjViz', 'dotProjViz');
    setup('sectionDividerVizJourney', 'pathVizJourney', 'dotVizJourney');
    setup('sectionDividerJourneyResume', 'pathJourneyResume', 'dotJourneyResume');
  }

  // ─── 3. Project card WebGL distortion ─────────────────────────────────────
  function initProjectDistortion() {
    if (MOBILE || reduced) return;
    var sections = document.querySelectorAll('.project-section');
    if (!sections.length) return;

    var vs = 'attribute vec2 aP;varying vec2 vUv;void main(){vUv=0.5*(aP+1.0);gl_Position=vec4(aP,0.0,1.0);}';
    var fs = [
      'precision mediump float;',
      'uniform float uTime;',
      'uniform vec2 uMouse;',
      'uniform vec2 uRes;',
      'varying vec2 vUv;',
      'void main(){',
      'vec2 uv=vUv;',
      'vec2 m=uMouse;',
      'float dist=distance(uv,m);',
      'float ripple=sin(dist*40.0-uTime*6.0)*0.015/(dist+0.1);',
      'vec2 dir=uv-m;',
      'float L=length(dir)+1e-5;',
      'uv+=dir/L*ripple;',
      'vec3 base=vec3(0.06,0.08,0.14);',
      'float g=0.15+0.1*sin(uv.x*20.0)+0.08*cos(uv.y*18.0);',
      'gl_FragColor=vec4(base+g*vec3(0.4,0.45,0.7),1.0);',
      '}'
    ].join('');

    sections.forEach(function (section) {
      var c = section.querySelector('.project-distortion-canvas');
      if (!c) return;
      section.addEventListener(
        'mouseenter',
        function () {
          var gl = c.getContext('webgl', { alpha: true, premultipliedAlpha: false });
          if (!gl) return;

          function compile(type, src) {
            var sh = gl.createShader(type);
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            return sh;
          }
          var prog = gl.createProgram();
          gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
          gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
          gl.linkProgram(prog);
          if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

          var raf = null;
          var start = performance.now();
          var endAt = start + 1200;
          var uTime = gl.getUniformLocation(prog, 'uTime');
          var uMouse = gl.getUniformLocation(prog, 'uMouse');
          var uRes = gl.getUniformLocation(prog, 'uRes');
          var buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
          var loc = gl.getAttribLocation(prog, 'aP');

          function size() {
            var w = section.clientWidth;
            var h = section.clientHeight;
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            c.width = Math.max(1, Math.floor(w * dpr));
            c.height = Math.max(1, Math.floor(h * dpr));
            gl.viewport(0, 0, c.width, c.height);
          }

          function localMouse(e) {
            var r = section.getBoundingClientRect();
            return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
          }

          var mouseUv = [0.5, 0.5];
          function onMove(e) {
            var m = localMouse(e);
            mouseUv[0] = m[0];
            mouseUv[1] = m[1];
          }
          section.addEventListener('mousemove', onMove, { passive: true });

          c.style.opacity = '0';
          c.style.transition = 'opacity 0.25s ease';
          requestAnimationFrame(function () {
            c.style.opacity = '0.35';
          });

          function frame(now) {
            if (now >= endAt) {
              if (raf) cancelAnimationFrame(raf);
              section.removeEventListener('mousemove', onMove);
              c.style.opacity = '0';
              setTimeout(function () {
                gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext();
              }, 300);
              return;
            }
            size();
            gl.useProgram(prog);
            gl.uniform1f(uTime, (now - start) * 0.001);
            gl.uniform2f(uMouse, mouseUv[0], mouseUv[1]);
            gl.uniform2f(uRes, c.width, c.height);
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            raf = requestAnimationFrame(frame);
          }
          raf = requestAnimationFrame(frame);
        },
        { once: true }
      );
    });
  }

  // ─── 4. Velocity marquee ─────────────────────────────────────────────────
  function initVelocityMarquees() {
    var heroTrack = document.getElementById('heroPills');
    var skillsTrack = document.querySelector('.skills-marquee-track');
    if (heroTrack) heroTrack.classList.add('portfolio-marquee-js');
    if (skillsTrack) skillsTrack.classList.add('portfolio-marquee-js');

    var lastY = window.scrollY || 0;
    var lastT = performance.now();
    var vel = 0;
    var blurHero = 0;
    var blurSkills = 0;
    var stopTimer = null;

    function measureVel() {
      var now = performance.now();
      var y = window.scrollY || 0;
      var dt = Math.max(1, now - lastT);
      var raw = (y - lastY) / dt * 16;
      lastY = y;
      lastT = now;
      vel = Math.abs(raw);
      if (vel > 5) {
        if (stopTimer) clearTimeout(stopTimer);
        stopTimer = setTimeout(function () {
          vel = 0;
        }, 800);
      }
    }

    function stepMarquee(el, direction, blurState) {
      if (!el) return blurState;
      var base = 0.8;
      var extra = vel > 5 ? vel * 0.3 : 0;
      var dx = base + extra;
      var x = parseFloat(el.dataset.marqX || '0');
      x += direction * dx;
      var half = el.scrollWidth / 2;
      if (!el.dataset.marqHalf) el.dataset.marqHalf = String(half);
      half = parseFloat(el.dataset.marqHalf) || half;
      if (direction < 0 && x < -half) x += half;
      if (direction > 0 && x > 0) x -= half;
      el.dataset.marqX = String(x);
      el.style.transform = 'translateX(' + x + 'px)';

      var maxB = el === heroTrack ? 2.2 : 4;
      var targetBlur = Math.min(vel * 0.28, maxB);
      if (vel <= 0.01) targetBlur = 0;
      blurState = lerp(blurState, targetBlur, 0.12);
      el.style.filter = 'blur(' + blurState + 'px)';
      return blurState;
    }

    function tick() {
      measureVel();
      blurHero = stepMarquee(heroTrack, -1, blurHero);
      blurSkills = stepMarquee(skillsTrack, -1, blurSkills);
      requestAnimationFrame(tick);
    }

    if (heroTrack || skillsTrack) {
      if (heroTrack && heroTrack.dataset.marqHalf === undefined) {
        heroTrack.dataset.marqHalf = String(heroTrack.scrollWidth / 2);
      }
      if (skillsTrack && skillsTrack.dataset.marqHalf === undefined) {
        skillsTrack.dataset.marqHalf = String(skillsTrack.scrollWidth / 2);
      }
      requestAnimationFrame(tick);
    }
  }

  // ─── 6. Cursor trail ─────────────────────────────────────────────────────
  function initCursorTrail() {
    if (MOBILE || reduced) return;
    var canvas = document.getElementById('cursor-trail');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var N = 28;
    var pts = [];
    for (var i = 0; i < N; i++) pts.push({ x: 0, y: 0, vx: 0, vy: 0 });

    var mx = 0;
    var my = 0;
    var running = true;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener(
      'mousemove',
      function (e) {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true }
    );

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
    });

    function tick() {
      if (!running) {
        requestAnimationFrame(tick);
        return;
      }
      resize();
      pts[0].x = lerp(pts[0].x, mx, 0.28);
      pts[0].y = lerp(pts[0].y, my, 0.28);
      var i;
      for (i = 1; i < N; i++) {
        var p = pts[i];
        var prev = pts[i - 1];
        p.vx += (prev.x - p.x) * 0.18;
        p.vy += (prev.y - p.y) * 0.18;
        p.vx *= 0.78;
        p.vy *= 0.78;
        p.x += p.vx;
        p.y += p.vy;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (i = 0; i < N - 1; i++) {
        var t = i / (N - 1);
        var lw = lerp(3, 0.5, t);
        var g = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[N - 1].x, pts[N - 1].y);
        g.addColorStop(0, 'rgba(99,102,241,0.7)');
        g.addColorStop(1, 'rgba(99,102,241,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        var nx = (pts[i].x + pts[i + 1].x) * 0.5;
        var ny = (pts[i].y + pts[i + 1].y) * 0.5;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, nx, ny);
        ctx.stroke();
      }

      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('intro-complete', function () {
      canvas.style.zIndex = '9998';
    });
    requestAnimationFrame(tick);
  }

  // ─── 7. Split text headings ────────────────────────────────────────────────
  function splitText(el) {
    var text = el.textContent;
    el.textContent = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '\n') {
        frag.appendChild(document.createElement('br'));
        continue;
      }
      var wrap = document.createElement('span');
      wrap.className = 'split-char-wrap';
      var span = document.createElement('span');
      span.className = 'split-char';
      span.textContent = ch === ' ' ? '\u00a0' : ch;
      span.style.display = 'inline-block';
      span.style.transform = 'translateY(110%)';
      span.style.opacity = '0';
      wrap.appendChild(span);
      frag.appendChild(wrap);
    }
    el.appendChild(frag);
    return el.querySelectorAll('.split-char');
  }

  function initSplitHeadings() {
    if (!window.gsap) return;
    var heroTitle = document.getElementById('heroTitle');

    document.querySelectorAll('section h1, section h2').forEach(function (h) {
      if (h.closest('.journey-overlay-card')) return;
      var prev = h.previousElementSibling;
      if (!prev || !prev.classList || !prev.classList.contains('section-kicker')) return;
      if (h === heroTitle || h.closest('#heroTitle')) return;
      var chars = splitText(h);
      if (!chars.length) return;
      window.gsap.set(chars, { y: '110%', opacity: 0 });
      var io = new IntersectionObserver(
        function (ents, ob) {
          ents.forEach(function (e) {
            if (!e.isIntersecting) return;
            ob.unobserve(h);
            window.gsap.to(chars, {
              y: '0%',
              opacity: 1,
              duration: 0.6,
              ease: 'power3.out',
              stagger: 0.018
            });
          });
        },
        { threshold: 0.2 }
      );
      io.observe(h);
    });

    if (heroTitle && !heroTitle.closest('.journey-overlay-card')) {
      var heroParts = heroTitle.querySelectorAll('.hero-name, .hero-line:not(.hero-rotator)');
      var allHeroChars = [];
      heroParts.forEach(function (part) {
        splitText(part).forEach(function (c) {
          allHeroChars.push(c);
        });
      });
      var rotLine = heroTitle.querySelector('.hero-rotator');
      if (rotLine) {
        window.gsap.set(rotLine, { y: '110%', opacity: 0 });
      }
      if (allHeroChars.length) {
        window.gsap.set(allHeroChars, { y: '110%', opacity: 0 });
      }
      if (allHeroChars.length || rotLine) {
        window.addEventListener(
          'intro-complete',
          function () {
            if (allHeroChars.length) {
              window.gsap.to(allHeroChars, {
                y: '0%',
                opacity: 1,
                duration: 0.6,
                ease: 'power3.out',
                stagger: 0.018
              });
            }
            if (rotLine) {
              window.gsap.to(rotLine, {
                y: '0%',
                opacity: 1,
                duration: 0.55,
                ease: 'power3.out'
              });
            }
          },
          { once: true }
        );
      }
    }
  }

  // ─── 8. GitHub heatmap ───────────────────────────────────────────────────
  function initGithubHeatmap() {
    var wrap = document.getElementById('github-heatmap');
    var cvs = document.getElementById('ghHeatmapCanvas');
    var tip = document.getElementById('ghHeatmapTooltip');
    if (!wrap || !cvs) return;

    fetch('https://github-contributions-api.jogruber.de/v4/James-Liebel?y=last')
      .then(function (r) {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(function (data) {
        var flat = [];
        if (data.contributions && Array.isArray(data.contributions)) {
          flat = data.contributions;
        } else if (data.weeks && Array.isArray(data.weeks)) {
          data.weeks.forEach(function (w) {
            var days = w.contributionDays || w.contribution_days || [];
            days.forEach(function (day) {
              flat.push(day);
            });
          });
        }
        if (!flat.length) throw new Error();
        wrap.removeAttribute('hidden');

        var cols = 53;
        var rows = 7;
        var cell = 12;
        var gap = 3;
        var padX = 40;
        var padY = 28;
        var cw = padX * 2 + cols * cell + (cols - 1) * gap;
        var ch = padY * 2 + rows * cell + (rows - 1) * gap + 18;

        cvs.width = cw;
        cvs.height = ch;
        var ctx = cvs.getContext('2d');
        if (!ctx) return;

        flat = flat.slice(-400);

        function level(n) {
          if (!n) return { c: 'rgba(99,102,241,0.07)', g: null };
          if (n < 4) return { c: 'rgba(99,102,241,0.28)', g: null };
          if (n < 7) return { c: 'rgba(129,140,248,0.55)', g: null };
          if (n < 10) return { c: 'rgba(167,139,250,0.82)', g: '0 0 7px rgba(139,92,246,0.45)' };
          return { c: 'rgba(192,132,252,1)', g: '0 0 10px rgba(99,102,241,0.75)' };
        }

        var dateMap = {};
        flat.forEach(function (entry) {
          if (entry.date) dateMap[entry.date] = entry.count != null ? entry.count : 0;
        });
        var lastEntry = flat[flat.length - 1];
        var endD = lastEntry && lastEntry.date ? new Date(lastEntry.date + 'T12:00:00') : new Date();
        var cur = new Date(endD);
        cur.setDate(cur.getDate() - (cols * rows - 1));
        while (cur.getDay() !== 0) {
          cur.setDate(cur.getDate() - 1);
        }

        var grid = [];
        var colData = [];
        var w, r, ds, cnt;
        for (w = 0; w < cols; w++) {
          colData[w] = [];
          for (r = 0; r < rows; r++) {
            ds = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
            cnt = dateMap[ds] != null ? dateMap[ds] : 0;
            colData[w].push({ count: cnt, date: ds, x: padX + w * (cell + gap), y: padY + r * (cell + gap) });
            cur.setDate(cur.getDate() + 1);
          }
        }

        var animCol = 0;
        var start = performance.now();

        function drawCol(cc) {
          colData[cc].forEach(function (cellInfo) {
            var L = level(cellInfo.count);
            ctx.fillStyle = L.c;
            ctx.shadowColor = 'transparent';
            if (L.g) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = 'rgba(99,102,241,0.65)';
            }
            ctx.fillRect(cellInfo.x, cellInfo.y, cell, cell);
            ctx.shadowBlur = 0;
            grid.push(cellInfo);
          });
        }

        function frame(now) {
          var elapsed = now - start;
          var targetCol = Math.min(cols - 1, Math.floor(elapsed / 8));
          while (animCol <= targetCol) {
            drawCol(animCol);
            animCol++;
          }
          if (animCol < cols) requestAnimationFrame(frame);
        }

        ctx.clearRect(0, 0, cw, ch);
        ctx.font = '700 10px "Space Mono", monospace';
        ctx.fillStyle = 'rgba(245,247,255,0.55)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';

        var monthLetters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        var colOnFirstOfMonth = {};
        var colFirstWeekForMonth = {};
        var wc;
        var rc;
        for (wc = 0; wc < cols; wc++) {
          for (rc = 0; rc < rows; rc++) {
            var cinfo = colData[wc][rc];
            var dt = new Date(cinfo.date + 'T12:00:00');
            var yk = dt.getFullYear();
            var mk = dt.getMonth() + 1;
            var mkey = yk + '-' + String(mk).padStart(2, '0');
            if (colFirstWeekForMonth[mkey] === undefined) colFirstWeekForMonth[mkey] = wc;
            else colFirstWeekForMonth[mkey] = Math.min(colFirstWeekForMonth[mkey], wc);
            if (dt.getDate() === 1) colOnFirstOfMonth[mkey] = wc;
          }
        }

        var monthKeys = Object.keys(colFirstWeekForMonth).sort();
        for (var ki = 0; ki < monthKeys.length; ki++) {
          var key = monthKeys[ki];
          var wLabel = colOnFirstOfMonth[key] != null ? colOnFirstOfMonth[key] : colFirstWeekForMonth[key];
          var mNum = parseInt(key.split('-')[1], 10);
          if (mNum < 1 || mNum > 12) continue;
          var letter = monthLetters[mNum - 1];
          var xMid = padX + wLabel * (cell + gap) + cell * 0.5;
          ctx.fillText(letter, xMid, 14);
        }

        requestAnimationFrame(frame);

        var hover = null;
        cvs.addEventListener('mousemove', function (e) {
          var r = cvs.getBoundingClientRect();
          var sx = (e.clientX - r.left) * (cvs.width / r.width);
          var sy = (e.clientY - r.top) * (cvs.height / r.height);
          var found = null;
          grid.forEach(function (cellInfo) {
            if (sx >= cellInfo.x && sx <= cellInfo.x + cell && sy >= cellInfo.y && sy <= cellInfo.y + cell) found = cellInfo;
          });
          if (found !== hover) {
            hover = found;
            if (found && tip) {
              tip.textContent = (found.date || 'Day') + ': ' + found.count + ' commits';
              tip.style.left = e.clientX + 10 + 'px';
              tip.style.top = e.clientY + 10 + 'px';
              tip.classList.add('is-on');
            } else if (tip) tip.classList.remove('is-on');
          } else if (found && tip) {
            tip.style.left = e.clientX + 10 + 'px';
            tip.style.top = e.clientY + 10 + 'px';
          }
        });
        cvs.addEventListener('mouseleave', function () {
          hover = null;
          if (tip) tip.classList.remove('is-on');
        });
      })
      .catch(function () {
        if (wrap) wrap.setAttribute('hidden', '');
      });
  }

  // ─── 9. Magnetic buttons ───────────────────────────────────────────────────
  function initMagneticButtons() {
    var sel = '.btn, .btn-soft, .project-open, .resume-link, .signal-link';
    document.querySelectorAll(sel).forEach(function (btn) {
      if (
        btn.closest('.site-nav') ||
        btn.closest('.mobile-nav') ||
        btn.closest('.site-footer') ||
        btn.closest('.switch') ||
        btn.closest('.project-rail')
      ) {
        return;
      }

      var raf = null;
      var curX = 0;
      var curY = 0;
      var scale = 1;
      var active = false;

      function loop() {
        if (!active) {
          curX = lerp(curX, 0, 0.12);
          curY = lerp(curY, 0, 0.12);
        }
        btn.style.transform = 'translate3d(' + curX + 'px,' + curY + 'px,0) scale(' + scale + ')';
        if (Math.abs(curX) < 0.15 && Math.abs(curY) < 0.15 && !active) {
          btn.style.transform = '';
          if (raf) cancelAnimationFrame(raf);
          raf = null;
          return;
        }
        raf = requestAnimationFrame(loop);
      }

      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 72) return;
        active = true;
        var max = 7;
        var tx = (dx / 72) * max;
        var ty = (dy / 72) * max;
        curX = lerp(curX, tx, 0.18);
        curY = lerp(curY, ty, 0.18);
        if (!raf) raf = requestAnimationFrame(loop);
      });

      btn.addEventListener('mouseleave', function () {
        active = false;
        if (!raf) raf = requestAnimationFrame(loop);
      });

      btn.addEventListener('mousedown', function () {
        scale = 0.97;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      btn.addEventListener('mouseup', function () {
        scale = 1;
      });
    });
  }

  // ─── 10. Section counter ─────────────────────────────────────────────────
  function initSectionCounter() {
    if (MOBILE) return;
    var el = document.getElementById('section-counter');
    var inner = document.getElementById('sectionCounterInner');
    var lineFill = document.getElementById('sectionCounterLine');
    var numEl = document.getElementById('sectionCounterNum');
    if (!el || !inner || !lineFill || !numEl) return;

    var sections = ['hero', 'skills', 'projects', 'visualizations', 'journey', 'resume'].map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    var total = sections.length;
    var current = 0;
    var animating = false;

    function format(n) {
      var s = String(n + 1).padStart(2, '0');
      var t = String(total).padStart(2, '0');
      return s + ' / ' + t;
    }

    numEl.textContent = format(0);

    function updateCounter() {
      var y = window.scrollY + window.innerHeight * 0.42;
      var idx = 0;
      sections.forEach(function (s, i) {
        var top = s.getBoundingClientRect().top + window.scrollY;
        if (y >= top) idx = i;
      });
      if (idx !== current && !animating) {
        animating = true;
        var old = numEl.cloneNode(true);
        old.style.position = 'absolute';
        old.style.top = '0';
        old.style.clipPath = 'inset(0 0 0 0)';
        inner.insertBefore(old, numEl);
        numEl.textContent = format(idx);
        numEl.style.transform = 'translateY(100%)';
        numEl.style.clipPath = 'inset(0 0 0 0)';
        if (window.gsap) {
          window.gsap.to(old, {
            y: '-100%',
            duration: 0.4,
            ease: 'power2.inOut',
            onComplete: function () {
              old.remove();
            }
          });
          window.gsap.to(numEl, {
            y: '0%',
            duration: 0.4,
            ease: 'power2.inOut',
            onComplete: function () {
              animating = false;
            }
          });
        } else {
          old.remove();
          numEl.style.transform = '';
          animating = false;
        }
        current = idx;
      }

      var sec = sections[current];
      if (sec) {
        var start = sec.getBoundingClientRect().top + window.scrollY;
        var end = start + sec.offsetHeight;
        var prog = (y - start) / Math.max(1, end - start);
        prog = Math.max(0, Math.min(1, prog));
        lineFill.style.height = prog * 100 + '%';
      }
    }

    window.addEventListener('scroll', updateCounter, { passive: true });
    window.addEventListener(
      'intro-complete',
      function () {
        el.classList.add('is-visible');
        requestAnimationFrame(updateCounter);
      },
      { once: true }
    );
    updateCounter();
  }

  // ─── 11. Simplex noise journey ────────────────────────────────────────────
  function initJourneyNoise() {
    if (MOBILE || reduced) return;
    var section = document.getElementById('journey');
    var canvas = document.getElementById('noise-canvas');
    if (!section || !canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var off = document.createElement('canvas');
    off.width = 320;
    off.height = 180;
    var octx = off.getContext('2d');
    if (!octx) return;

    var F2 = 0.5 * (Math.sqrt(3) - 1);
    var G2 = (3 - Math.sqrt(3)) / 6;
    var perm = new Uint8Array(512);
    var p0 = new Uint8Array(256);
    var i;
    for (i = 0; i < 256; i++) p0[i] = i;
    for (i = 255; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = p0[i];
      p0[i] = p0[j];
      p0[j] = t;
    }
    for (i = 0; i < 512; i++) perm[i] = p0[i & 255];

    function grad2(hash, x, y) {
      var h = hash & 7;
      var u = h < 4 ? x : y;
      var v = h < 4 ? y : x;
      return ((h & 1) !== 0 ? -u : u) + ((h & 2) !== 0 ? -2 * v : 2 * v);
    }

    function noise2D(xin, yin) {
      var s = (xin + yin) * F2;
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var t = (i + j) * G2;
      var X0 = i - t;
      var Y0 = j - t;
      var x0 = xin - X0;
      var y0 = yin - Y0;
      var i1 = x0 > y0 ? 1 : 0;
      var j1 = x0 > y0 ? 0 : 1;
      var x1 = x0 - i1 + G2;
      var y1 = y0 - j1 + G2;
      var x2 = x0 - 1 + 2 * G2;
      var y2 = y0 - 1 + 2 * G2;
      var ii = i & 255;
      var jj = j & 255;
      var n0 = 0;
      var n1 = 0;
      var n2 = 0;
      var t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) {
        t0 *= t0;
        n0 = t0 * t0 * grad2(perm[ii + perm[jj]], x0, y0);
      }
      var t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) {
        t1 *= t1;
        n1 = t1 * t1 * grad2(perm[ii + i1 + perm[jj + j1]], x1, y1);
      }
      var t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) {
        t2 *= t2;
        n2 = t2 * t2 * grad2(perm[ii + 1 + perm[jj + 1]], x2, y2);
      }
      return 70 * (n0 + n1 + n2);
    }

    var scrollOff = 0;
    var frameSkip = 0;
    var running = false;
    var io = new IntersectionObserver(
      function (ents) {
        ents.forEach(function (e) {
          running = e.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    io.observe(section);

    function size() {
      var w = section.offsetWidth;
      var h = section.offsetHeight;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }

    function tick() {
      if (running) {
        size();
        frameSkip = (frameSkip + 1) % 3;
        scrollOff += 0.4;
        if (frameSkip === 0) {
          var px = octx.createImageData(off.width, off.height);
          var d = px.data;
          var yy, xx, idx, val;
          for (yy = 0; yy < off.height; yy++) {
            for (xx = 0; xx < off.width; xx++) {
              val = (noise2D(xx * 0.04, yy * 0.04 + scrollOff * 0.02) + 1) * 0.5;
              idx = (yy * off.width + xx) * 4;
              d[idx] = 99;
              d[idx + 1] = 102;
              d[idx + 2] = 241;
              d[idx + 3] = Math.floor(val * 30);
            }
          }
          octx.putImageData(px, 0, 0);
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }
      requestAnimationFrame(tick);
    }

    window.addEventListener('resize', size, { passive: true });
    requestAnimationFrame(tick);
  }

  // ─── Skills section: SVG pipeline (spines, converging feeders, trunk) ─────
  function initSkillsPipeline() {
    var region = document.getElementById('skillsPipelineRegion');
    var svg = document.getElementById('skillsPipelineSvg');
    var bridge = document.getElementById('skillsPipelineSummary');
    if (!region || !svg || !bridge) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var played = false;
    var resizeTimer = null;
    var mergePulseTween = null;

    var COL = {
      eng: { base: '#1d4ed8', mid: '#3b82f6', glow: '#60a5fa' },
      sci: { base: '#5b21b6', mid: '#7c3aed', glow: '#a78bfa' },
      ana: { base: '#0e7490', mid: '#0891b2', glow: '#22d3ee' }
    };

    function ns(tag, attrs, parent) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      if (attrs) {
        Object.keys(attrs).forEach(function (k) {
          el.setAttribute(k, attrs[k]);
        });
      }
      if (parent) parent.appendChild(el);
      return el;
    }

    function setDashReveal(path, hidden) {
      try {
        var len = path.getTotalLength();
        if (!len || !isFinite(len)) len = 1;
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = hidden ? String(len) : '0';
      } catch (e) {
        path.style.strokeDasharray = 'none';
        path.style.strokeDashoffset = '0';
      }
    }

    function revealAll(paths) {
      paths.forEach(function (p) {
        setDashReveal(p, false);
      });
    }

    /** @param {boolean} fullReveal after first play (resize) — skip dash hide */
    function layoutAndPaint(fullReveal) {
      var cols = region.querySelectorAll('.skills-atlas-column');
      if (cols.length < 3) return null;

      var r = region.getBoundingClientRect();
      var br = bridge.getBoundingClientRect();
      var H = Math.max(0, Math.round(br.top - r.top));
      var W = Math.max(1, Math.round(r.width));
      if (H < 48) {
        svg.setAttribute('height', '0');
        svg.style.height = '0';
        return null;
      }

      svg.innerHTML = '';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', String(W));
      svg.setAttribute('height', String(H));
      svg.style.height = H + 'px';

      var defs = ns('defs', null, svg);
      var filter = ns(
        'filter',
        { id: 'skillsMergeGlow', x: '-100%', y: '-100%', width: '300%', height: '300%' },
        defs
      );
      ns('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '5', result: 'skillsBlur' }, filter);
      var mergeEl = ns('feMerge', null, filter);
      ns('feMergeNode', { in: 'skillsBlur' }, mergeEl);
      ns('feMergeNode', { in: 'SourceGraphic' }, mergeEl);

      var gradFlow = ns(
        'linearGradient',
        { id: 'skillsPipeFlowGrad', x1: '0', y1: '0', x2: '0', y2: String(H), gradientUnits: 'userSpaceOnUse' },
        defs
      );
      ns('stop', { offset: '0%', 'stop-color': '#0c4a6e', 'stop-opacity': '1' }, gradFlow);
      ns('stop', { offset: '40%', 'stop-color': '#2563eb', 'stop-opacity': '1' }, gradFlow);
      ns('stop', { offset: '100%', 'stop-color': '#22d3ee', 'stop-opacity': '1' }, gradFlow);
      if (!reduced) {
        var animY1 = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animY1.setAttribute('attributeName', 'y1');
        animY1.setAttribute('values', '-' + H + ';' + H + ';-' + H);
        animY1.setAttribute('dur', '2.8s');
        animY1.setAttribute('repeatCount', 'indefinite');
        gradFlow.appendChild(animY1);
        var animY2 = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animY2.setAttribute('attributeName', 'y2');
        animY2.setAttribute('values', '0;' + H * 2 + ';0');
        animY2.setAttribute('dur', '2.8s');
        animY2.setAttribute('repeatCount', 'indefinite');
        gradFlow.appendChild(animY2);
      }

      var bx = br.left - r.left + br.width / 2;
      var by = H;
      var mx = W * 0.5;
      var bend = W * 0.15;

      var order = ['eng', 'sci', 'ana'];
      var colMeta = [];
      var maxSy = 0;
      var i;
      for (i = 0; i < 3; i++) {
        var colEl = cols[i];
        var cr = colEl.getBoundingClientRect();
        var sy = Math.round(cr.bottom - r.top);
        if (sy > maxSy) maxSy = sy;
        colMeta.push({
          col: colEl,
          key: order[i],
          topY: Math.max(0, Math.round(cr.top - r.top)),
          sy: sy,
          spineX: Math.round(cr.left - r.left + 3)
        });
      }

      var gapBand = H - maxSy;
      var my = maxSy + Math.max(40, gapBand * 0.5);
      if (my > H - 32) my = H - 32;
      if (my <= maxSy + 12) my = Math.min(H - 28, maxSy + Math.max(24, gapBand * 0.35));

      var stackCols =
        window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;

      var columnBasePaths = [];
      var columnGradPaths = [];
      var columnFlowPaths = [];

      for (i = 0; i < 3; i++) {
        var meta = colMeta[i];
        var key = meta.key;
        var spineX = meta.spineX;
        var topY = meta.topY;
        var sy = meta.sy;
        var curveFromY = stackCols ? maxSy : sy;
        if (curveFromY < sy) curveFromY = sy;

        var cp1x = spineX;
        var cp1y = curveFromY + (my - curveFromY) * 0.38;
        var cp2x = i === 0 ? mx - bend : i === 2 ? mx + bend : spineX + (mx - spineX) * 0.55;
        var cp2y = my - Math.max(20, (my - curveFromY) * 0.22);

        var d =
          'M ' +
          spineX +
          ' ' +
          topY +
          ' L ' +
          spineX +
          ' ' +
          sy +
          (curveFromY > sy + 1
            ? ' L ' + spineX + ' ' + curveFromY
            : '') +
          ' C ' +
          cp1x +
          ' ' +
          cp1y +
          ', ' +
          cp2x +
          ' ' +
          cp2y +
          ', ' +
          mx +
          ' ' +
          my;

        var baseF = ns('path', { class: 'skills-pipe-column-base', fill: 'none' }, svg);
        baseF.setAttribute('d', d);
        baseF.setAttribute('stroke', COL[key].base);
        baseF.setAttribute('stroke-width', '3');
        baseF.setAttribute('stroke-linecap', 'round');
        baseF.setAttribute('stroke-linejoin', 'round');
        baseF.setAttribute('opacity', '0.9');
        columnBasePaths.push(baseF);

        var feed = ns('path', { class: 'skills-pipe-column-grad', fill: 'none' }, svg);
        feed.setAttribute('d', d);
        feed.setAttribute('stroke', 'url(#skillsPipeFlowGrad)');
        feed.setAttribute('stroke-width', '2');
        feed.setAttribute('stroke-linecap', 'round');
        feed.setAttribute('stroke-linejoin', 'round');
        columnGradPaths.push(feed);

        var flow = ns('path', { class: 'skills-pipe-column-flow', fill: 'none' }, svg);
        flow.setAttribute('d', d);
        flow.setAttribute('stroke', COL[key].glow);
        flow.setAttribute('stroke-width', '2');
        flow.setAttribute('stroke-linecap', 'round');
        flow.setAttribute('stroke-linejoin', 'round');
        flow.setAttribute('stroke-dasharray', '10 22');
        flow.setAttribute('opacity', '0');
        columnFlowPaths.push(flow);
      }

      var trunkD = 'M ' + mx + ' ' + my + ' L ' + bx + ' ' + by;
      var trunkBase = ns('path', { class: 'skills-pipe-trunk-base', fill: 'none' }, svg);
      trunkBase.setAttribute('d', trunkD);
      trunkBase.setAttribute('stroke', '#1e3a8a');
      trunkBase.setAttribute('stroke-width', '3.5');
      trunkBase.setAttribute('stroke-linecap', 'round');
      trunkBase.setAttribute('opacity', '0.92');

      var trunk = ns('path', { class: 'skills-pipe-trunk', fill: 'none' }, svg);
      trunk.setAttribute('d', trunkD);
      trunk.setAttribute('stroke', 'url(#skillsPipeFlowGrad)');
      trunk.setAttribute('stroke-width', '2.5');
      trunk.setAttribute('stroke-linecap', 'round');

      var trunkFlow = ns('path', { class: 'skills-pipe-trunk-flow', fill: 'none' }, svg);
      trunkFlow.setAttribute('d', trunkD);
      trunkFlow.setAttribute('stroke', '#f0f9ff');
      trunkFlow.setAttribute('stroke-width', '1.5');
      trunkFlow.setAttribute('stroke-linecap', 'round');
      trunkFlow.setAttribute('stroke-dasharray', '8 18');
      trunkFlow.setAttribute('opacity', '0');

      var mergeNode = ns('circle', { class: 'skills-pipe-merge-node', cx: String(mx), cy: String(my), r: '6' }, svg);
      mergeNode.setAttribute('fill', '#22d3ee');
      mergeNode.setAttribute('filter', 'url(#skillsMergeGlow)');
      mergeNode.setAttribute('opacity', fullReveal || reduced ? '0.95' : '0');
      mergeNode.setAttribute('stroke', '#f0f9ff');
      mergeNode.setAttribute('stroke-width', '1.5');

      var i2;
      if (reduced || fullReveal) {
        revealAll(columnBasePaths);
        revealAll(columnGradPaths);
        revealAll([trunkBase, trunk]);
        columnFlowPaths.forEach(function (f) {
          f.setAttribute('opacity', '0.85');
        });
        trunkFlow.setAttribute('opacity', '0.85');
      } else {
        for (i2 = 0; i2 < columnBasePaths.length; i2++) setDashReveal(columnBasePaths[i2], true);
        for (i2 = 0; i2 < columnGradPaths.length; i2++) setDashReveal(columnGradPaths[i2], true);
        setDashReveal(trunkBase, true);
        setDashReveal(trunk, true);
      }

      return {
        columnBasePaths: columnBasePaths,
        columnGradPaths: columnGradPaths,
        columnFlowPaths: columnFlowPaths,
        trunk: trunk,
        trunkBase: trunkBase,
        trunkFlow: trunkFlow,
        mergeNode: mergeNode
      };
    }

    function startFlowLoops(gsap) {
      if (!gsap || reduced) return;
      svg.querySelectorAll('.skills-pipe-column-flow, .skills-pipe-trunk-flow').forEach(function (p) {
        gsap.killTweensOf(p);
        gsap.set(p, { strokeDashoffset: 0 });
        gsap.to(p, {
          strokeDashoffset: -48,
          duration: 2.4,
          ease: 'none',
          repeat: -1
        });
      });
    }

    function startMergePulse(gsap, node) {
      if (!gsap || reduced || !node) return;
      if (mergePulseTween) mergePulseTween.kill();
      mergePulseTween = gsap.to(node, {
        attr: { r: 10 },
        duration: 0.75,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }

    function runDraw(gsap) {
      if (played || reduced) return;
      played = true;
      var o = layoutAndPaint(false);
      if (!o || !o.trunk) return;

      var tl = gsap.timeline();

      tl.to(o.columnBasePaths.concat(o.columnGradPaths), {
        strokeDashoffset: 0,
        duration: 1.35,
        ease: 'power2.inOut'
      });

      tl.to(o.mergeNode, { opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.32');

      tl.to([o.trunkBase, o.trunk], { strokeDashoffset: 0, duration: 0.75, ease: 'power2.inOut' }, '+=0.08');

      tl.to([o.trunkFlow].concat(o.columnFlowPaths), { opacity: 0.88, duration: 0.25, ease: 'power1.out' }, '-=0.35');

      tl.call(function () {
        startMergePulse(gsap, o.mergeNode);
        startFlowLoops(gsap);
      });

      tl.call(function () {
        gsap.to(bridge, {
          scale: 1.03,
          duration: 0.34,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          transformOrigin: '50% 50%'
        });
      });
    }

    var io = new IntersectionObserver(
      function (ents) {
        ents.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          waitForGsap(function () {
            if (reduced) {
              layoutAndPaint(true);
              return;
            }
            if (!window.gsap) {
              layoutAndPaint(true);
              return;
            }
            runDraw(window.gsap);
          });
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(region);

    window.addEventListener(
      'resize',
      function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          if (window.gsap) {
            window.gsap.killTweensOf(bridge);
            svg.querySelectorAll('.skills-pipe-column-flow, .skills-pipe-trunk-flow').forEach(function (p) {
              window.gsap.killTweensOf(p);
            });
            if (mergePulseTween) mergePulseTween.kill();
          }
          var o = layoutAndPaint(played || reduced);
          if (played && !reduced && window.gsap && o) {
            startMergePulse(window.gsap, o.mergeNode);
            startFlowLoops(window.gsap);
          }
        }, 140);
      },
      { passive: true }
    );

    requestAnimationFrame(function () {
      if (!played) layoutAndPaint(false);
    });
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────
  function waitForGsap(cb) {
    if (window.gsap) {
      cb();
      return;
    }
    var n = 0;
    var t = setInterval(function () {
      n++;
      if (window.gsap) {
        clearInterval(t);
        cb();
      } else if (n > 120) clearInterval(t);
    }, 50);
  }

  window.addEventListener('load', function () {
    /* Hero WebGL particles disabled — animated field behind the cursor was distracting */
    initPathDividers();
    initSkillsPipeline();
    initProjectDistortion();
    waitForGsap(function () {
      initSplitHeadings();
      initSectionCounter();
    });
    initVelocityMarquees();
    /* Cursor trail canvas disabled — mouse-following ribbon read as spinning particles */
    /* Magnetic buttons + scroll effects: portfolio-premium.js */
    initJourneyNoise();
    initGithubHeatmap();
  });
})();
