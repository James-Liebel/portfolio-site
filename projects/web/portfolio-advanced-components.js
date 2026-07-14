/* Portfolio advanced interactive components — loaded after main animation script */
(function () {
  'use strict';

  var MOBILE = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Low-end machines stutter on the per-pixel/WebGL canvas effects; skip them.
  var lowPower =
    (navigator.hardwareConcurrency || 8) <= 4 ||
    (navigator.deviceMemory || 8) <= 4;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }






  // ─── 8. GitHub heatmap ───────────────────────────────────────────────────
  function initGithubHeatmap() {
    var wrap = document.getElementById('github-heatmap');
    var cvs = document.getElementById('ghHeatmapCanvas');
    var tip = document.getElementById('ghHeatmapTooltip');
    if (!wrap || !cvs) return;

    var heatmapController = new AbortController();
    var heatmapTimeout = setTimeout(function () { heatmapController.abort(); }, 5000);
    fetch('https://github-contributions-api.jogruber.de/v4/James-Liebel?y=last', { signal: heatmapController.signal })
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
        // Revealing the heatmap adds height mid-page; re-measure scroll
        // triggers so section reveals below stay aligned. While the intro has
        // the body height-locked, defer to its completion.
        if (window.ScrollTrigger) {
          if (document.body.classList.contains('intro-running')) {
            window.addEventListener('intro-complete', function () {
              window.ScrollTrigger.refresh();
            }, { once: true });
          } else {
            window.ScrollTrigger.refresh();
          }
        }

        var cols = 53;
        var rows = 7;
        var cell = 12;
        var gap = 3;
        var padX = 40;
        var padY = 26;
        var legendH = 30;
        var gridH = rows * cell + (rows - 1) * gap;
        var cw = padX * 2 + cols * cell + (cols - 1) * gap;
        var ch = padY + gridH + legendH;
        var isLight = document.documentElement.getAttribute('data-theme') === 'light';
        var labelColor = isLight ? 'rgba(51,65,85,0.92)' : 'rgba(245,247,255,0.85)';

        cvs.width = cw;
        cvs.height = ch;
        var ctx = cvs.getContext('2d');
        if (!ctx) return;

        flat = flat.slice(-400);

        var dateMap = {};
        flat.forEach(function (entry) {
          if (entry.date) dateMap[entry.date] = entry.count != null ? entry.count : 0;
        });

        var maxCount = 0;
        Object.keys(dateMap).forEach(function (k) {
          var v = dateMap[k];
          if (typeof v === 'number' && v > maxCount) maxCount = v;
        });
        if (maxCount < 1) maxCount = 1;

        function level(n) {
          if (!n) return { c: 'rgba(91,130,201,0.07)', g: null };
          var t = Math.min(1, Math.sqrt(n / maxCount));
          var knee = 0.58;
          var tailCompress = 0.52;
          if (t > knee) {
            t = knee + (t - knee) * tailCompress;
          }
          if (t <= 0.28) return { c: 'rgba(91,130,201,0.28)', g: null };
          if (t <= 0.52) return { c: 'rgba(126,147,196,0.55)', g: null };
          if (t <= 0.74) return { c: 'rgba(120,140,198,0.82)', g: '0 0 7px rgba(120,140,198,0.45)' };
          return { c: 'rgba(108,148,205,1)', g: '0 0 10px rgba(91,130,201,0.75)' };
        }
        // Anchor on the current week so the rightmost column is always today's
        // week, the way GitHub renders it. Advancing endD to this week's Saturday
        // keeps that column full; today and any future days sit in it as empty
        // cells. Without this the grid ends on the *previous* Saturday and drops
        // the current partial week on every day except Saturday.
        var lastEntry = flat[flat.length - 1];
        var today = new Date();
        today.setHours(12, 0, 0, 0);
        var lastDataD = lastEntry && lastEntry.date ? new Date(lastEntry.date + 'T12:00:00') : today;
        var endD = today.getTime() >= lastDataD.getTime() ? today : lastDataD;
        endD.setDate(endD.getDate() + (6 - endD.getDay()));
        var cur = new Date(endD);
        cur.setDate(cur.getDate() - (cols * rows - 1));
        while (cur.getDay() !== 0) {
          cur.setDate(cur.getDate() - 1);
        }

        var grid = [];
        var colData = [];
        var totalContrib = 0;
        var w, r, ds, cnt;
        for (w = 0; w < cols; w++) {
          colData[w] = [];
          for (r = 0; r < rows; r++) {
            ds = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
            cnt = dateMap[ds] != null ? dateMap[ds] : 0;
            totalContrib += cnt;
            colData[w].push({ count: cnt, date: ds, future: cur.getTime() > today.getTime(), x: padX + w * (cell + gap), y: padY + r * (cell + gap) });
            cur.setDate(cur.getDate() + 1);
          }
        }

        var totalEl = document.getElementById('ghHeatmapTotal');
        if (totalEl) {
          totalEl.innerHTML = '<strong>' + totalContrib.toLocaleString() + '</strong> contributions in the last year';
        }

        var animCol = 0;
        var start = performance.now();

        function drawCol(cc) {
          colData[cc].forEach(function (cellInfo) {
            // Days after today haven't happened yet — leave them blank so the
            // current week reads as a true partial week instead of a padded column.
            if (cellInfo.future) return;
            var L = level(cellInfo.count);
            ctx.fillStyle = L.c;
            ctx.shadowColor = 'transparent';
            if (L.g) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = 'rgba(91,130,201,0.65)';
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
        ctx.font = '500 9px "IBM Plex Mono", monospace';
        ctx.fillStyle = labelColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
        var lastLabelX = -Infinity;
        for (var ki = 0; ki < monthKeys.length; ki++) {
          var key = monthKeys[ki];
          var wLabel = colOnFirstOfMonth[key] != null ? colOnFirstOfMonth[key] : colFirstWeekForMonth[key];
          var mNum = parseInt(key.split('-')[1], 10);
          if (mNum < 1 || mNum > 12) continue;
          var labelX = padX + wLabel * (cell + gap);
          // Skip labels that would overlap the previous one (e.g. a sliver of a
          // partial month at the very start of the grid).
          if (labelX - lastLabelX < 28) continue;
          if (labelX + 22 > cw - padX) continue;
          ctx.fillText(monthNames[mNum - 1], labelX, padY - 10);
          lastLabelX = labelX;
        }

        // Weekday labels down the left gutter (Mon / Wed / Fri, like GitHub).
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        var dayLabels = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };
        Object.keys(dayLabels).forEach(function (rIdx) {
          var ri = parseInt(rIdx, 10);
          ctx.fillText(dayLabels[ri], padX - 8, padY + ri * (cell + gap) + cell / 2);
        });

        // Less → More legend along the bottom-right.
        var legendColors = [
          'rgba(91,130,201,0.10)',
          'rgba(91,130,201,0.28)',
          'rgba(126,147,196,0.55)',
          'rgba(120,140,198,0.82)',
          'rgba(108,148,205,1)'
        ];
        var sw = 11;
        var sgap = 3;
        var legendY = padY + gridH + 16;
        var swatchesW = legendColors.length * sw + (legendColors.length - 1) * sgap;
        var moreW = 30;
        var lessW = 30;
        var legendStartX = cw - padX - (lessW + swatchesW + moreW);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.font = '500 11px "IBM Plex Mono", monospace';
        ctx.fillStyle = labelColor;
        ctx.fillText('Less', legendStartX, legendY + sw / 2);
        var legendSx = legendStartX + lessW;
        for (var li = 0; li < legendColors.length; li++) {
          ctx.fillStyle = legendColors[li];
          ctx.fillRect(legendSx, legendY, sw, sw);
          legendSx += sw + sgap;
        }
        ctx.fillStyle = labelColor;
        ctx.fillText('More', legendSx + 4, legendY + sw / 2);

        requestAnimationFrame(frame);

        function tipLabel(cellInfo) {
          var n = cellInfo.count;
          var count = n === 0 ? 'No contributions' : n + (n === 1 ? ' contribution' : ' contributions');
          var when = cellInfo.date;
          var d = new Date(cellInfo.date + 'T12:00:00');
          if (!isNaN(d)) {
            when = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          }
          return count + ' on ' + when;
        }

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
              tip.textContent = tipLabel(found);
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
      })
      .finally(function () {
        clearTimeout(heatmapTimeout);
      });
  }



  // ─── Skills map: an animated hub-and-spoke constellation of the four
  // skill clusters. Same visual family as the hero figure: quiet pills,
  // hairline edges, traveling pulses on the process flow, hover focus.
  function initSkillsMap() {
    var svg = document.getElementById('skillsMapSvg');
    var details = document.getElementById('skillsAtlasDetails');
    var caption = document.getElementById('skillsMapCaption');
    if (!svg || !details) return;

    var NS = 'http://www.w3.org/2000/svg';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var CLUSTERS = [
      { key: 'eng', name: 'Data Engineering', index: '01', hub: [230, 210], fan: [100, 260], radii: [106, 156, 206],
        skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Data Cleaning', 'Train/Test Splits', 'Jupyter', 'Git'] },
      { key: 'sci', name: 'Data Science', index: '02', hub: [600, 170], fan: [190, 350], radii: [98, 150, 202],
        skills: ['Scikit-learn', 'XGBoost', 'Random Forest', 'Logistic Regression', 'SVM', 'GridSearchCV', 'KNN', 'SMOTE', 'VADER · TF-IDF', 'Model Evaluation'] },
      { key: 'ana', name: 'Data Analysis', index: '03', hub: [970, 210], fan: [280, 440], radii: [106, 156, 206],
        skills: ['Power BI · PL-300', 'DAX', 'D3.js', 'GeoJSON', 'Matplotlib', 'Seaborn', 'Next.js', 'TypeScript', 'React', 'GitHub Pages'] },
      { key: 'ai', name: 'AI & Agents', index: 'AI', hub: [600, 520], fan: [28, 152], radii: [96, 146, 196],
        skills: ['Prompt Engineering', 'Agent Workflows', 'LLM Evaluation · RLHF', 'Local LLMs', 'Workflow Automation', 'AI Content Pipelines'] }
    ];
    var FLOWS = [['eng', 'sci'], ['sci', 'ana']];
    var SUPPORTS = [['ai', 'eng'], ['ai', 'sci'], ['ai', 'ana']];

    var measure = (function () {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      return function (text, font) {
        ctx.font = font;
        return ctx.measureText(text).width;
      };
    })();

    function el(tag, attrs, parent) {
      var node = document.createElementNS(NS, tag);
      for (var k in attrs) node.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(node);
      return node;
    }

    var hubOf = {};
    CLUSTERS.forEach(function (c) { hubOf[c.key] = c.hub; });

    function edgePath(a, b, bow) {
      var mx = (a[0] + b[0]) / 2;
      var my = (a[1] + b[1]) / 2;
      var dx = b[0] - a[0];
      var dy = b[1] - a[1];
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      // perpendicular offset gives the edge a gentle bow
      var nx = -dy / len;
      var ny = dx / len;
      return 'M' + a[0] + ',' + a[1] + ' Q' + (mx + nx * bow) + ',' + (my + ny * bow) + ' ' + b[0] + ',' + b[1];
    }

    var built = false;
    function build() {
      if (built) return;
      built = true;

      var edgesG = el('g', { 'class': 'sm-edges' }, svg);
      var nodeIndex = 0;
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      var extend = function (x0, y0, x1, y1) {
        if (x0 < minX) minX = x0;
        if (y0 < minY) minY = y0;
        if (x1 > maxX) maxX = x1;
        if (y1 > maxY) maxY = y1;
      };

      FLOWS.forEach(function (pair) {
        var d = edgePath(hubOf[pair[0]], hubOf[pair[1]], 46);
        el('path', { d: d, 'class': 'sm-edge sm-edge--flow' }, edgesG);
        el('path', { d: d, 'class': 'sm-pulse' }, edgesG);
      });
      SUPPORTS.forEach(function (pair) {
        el('path', { d: edgePath(hubOf[pair[0]], hubOf[pair[1]], 26), 'class': 'sm-edge sm-edge--support' }, edgesG);
      });

      CLUSTERS.forEach(function (c) {
        var clusterG = el('g', { 'class': 'sm-cluster sm-' + c.key }, svg);
        var spokesG = el('g', { 'class': 'sm-spokes' }, clusterG);
        var nodesG = el('g', { 'class': 'sm-nodes' }, clusterG);
        var hub = c.hub;
        var nodeRefs = [];

        // hub marker + label
        var hubG = el('g', { 'class': 'sm-hub' }, clusterG);
        el('circle', { cx: hub[0], cy: hub[1], r: 12, 'class': 'sm-hub-ring' }, hubG);
        el('circle', { cx: hub[0], cy: hub[1], r: 5.5, 'class': 'sm-hub-dot' }, hubG);
        var hubFont = '600 13.5px Inter, system-ui, sans-serif';
        var hw = Math.ceil(measure(c.name, hubFont)) + 34;
        var below = c.key !== 'ai';
        var hy = below ? hub[1] + 24 : hub[1] - 58;
        el('rect', { x: hub[0] - hw / 2, y: hy, width: hw, height: 34, rx: 8, 'class': 'sm-hub-pill' }, hubG);
        el('text', { x: hub[0], y: hy + 22, 'text-anchor': 'middle', 'class': 'sm-hub-name' }, hubG).textContent = c.name;
        el('text', { x: hub[0], y: below ? hy + 48 : hy - 10, 'text-anchor': 'middle', 'class': 'sm-hub-index' }, hubG).textContent = c.index;
        extend(hub[0] - hw / 2, Math.min(hy - 18, hub[1] - 14), hub[0] + hw / 2, Math.max(hy + 52, hub[1] + 14));

        var n = c.skills.length;
        var span = c.fan[1] - c.fan[0];
        c.skills.forEach(function (label, i) {
          var deg = n === 1 ? (c.fan[0] + span / 2) : c.fan[0] + (span * i) / (n - 1);
          var rad = (deg * Math.PI) / 180;
          var r = c.radii[i % c.radii.length];
          var dirX = Math.cos(rad);
          var dirY = Math.sin(rad);
          var ax = hub[0] + dirX * r;
          var ay = hub[1] + dirY * r;

          var font = '500 12.5px Inter, system-ui, sans-serif';
          var w = Math.ceil(measure(label, font)) + 26;
          var h = 30;
          // keep a constant gap between spoke tip and the pill's near edge
          var push = (Math.abs(dirX) * w) / 2 + (Math.abs(dirY) * h) / 2 + 6;
          var cx = ax + dirX * push;
          var cy = ay + dirY * push;

          el('line', { x1: hub[0], y1: hub[1], x2: ax, y2: ay, 'class': 'sm-spoke' }, spokesG);

          var g = el('g', { 'class': 'sm-node' }, nodesG);
          g.style.setProperty('--smi', String(nodeIndex));
          if (!reduced) {
            var dur = (6.5 + Math.random() * 4.5).toFixed(2);
            g.style.setProperty('--smx', ((Math.random() * 6 - 3)).toFixed(1) + 'px');
            g.style.setProperty('--smy', ((Math.random() * 4 - 2)).toFixed(1) + 'px');
            g.style.setProperty('--smd', dur + 's');
            g.style.setProperty('--smo', (-Math.random() * dur).toFixed(2) + 's');
          }
          var inner = el('g', { 'class': 'sm-in' }, g);
          el('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 7, 'class': 'sm-node-pill' }, inner);
          el('text', { x: cx, y: cy + 4.5, 'text-anchor': 'middle', 'class': 'sm-node-label' }, inner).textContent = label;
          extend(cx - w / 2 - 6, cy - h / 2 - 6, cx + w / 2 + 6, cy + h / 2 + 6);
          nodeIndex++;

          nodeRefs.push(g);
          var spoke = spokesG.lastChild;
          g.addEventListener('pointerenter', function () {
            svg.classList.add('is-dim');
            g.classList.add('is-hit');
            spoke.classList.add('is-hit');
            hubG.classList.add('is-hit');
          });
          g.addEventListener('pointerleave', function () {
            svg.classList.remove('is-dim');
            g.classList.remove('is-hit');
            spoke.classList.remove('is-hit');
            hubG.classList.remove('is-hit');
          });
        });

        hubG.addEventListener('pointerenter', function () {
          svg.classList.add('is-dim');
          clusterG.classList.add('is-hit');
        });
        hubG.addEventListener('pointerleave', function () {
          svg.classList.remove('is-dim');
          clusterG.classList.remove('is-hit');
        });
      });

      // fit the viewBox to whatever the labels actually needed
      svg.setAttribute('viewBox', (minX - 12) + ' ' + (minY - 12) + ' ' + (maxX - minX + 24) + ' ' + (maxY - minY + 24));

      if (caption) {
        var total = CLUSTERS.reduce(function (sum, c) { return sum + c.skills.length; }, 0);
        caption.textContent = 'Skills map · ' + CLUSTERS.length + ' clusters · ' + total + ' skills';
      }

      if (reduced || !('IntersectionObserver' in window)) {
        svg.classList.add('is-live');
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.disconnect();
          svg.classList.add('is-live');
        });
      }, { threshold: 0.12 });
      io.observe(svg);
    }

    if (details.open) build();
    details.addEventListener('toggle', function () {
      if (details.open) build();
    });
  }

  // ─── Ambient background: sparse points drifting slowly behind the page.
  // Deliberately faint — a few dozen dots in the site's blue family at 3–12%
  // opacity, rising with a slight lateral wander. No connecting lines, no
  // cursor tracking. Skipped on phones, low-power machines, and
  // reduced-motion; paused while the tab is hidden.
  function initAmbientBackground() {
    var canvas = document.getElementById('ambient-bg');
    if (!canvas || !canvas.getContext) return;
    if (reduced || lowPower || MOBILE) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var DARK_COLORS = ['91, 130, 201', '147, 176, 224', '109, 154, 163'];
    var LIGHT_COLORS = ['63, 95, 168', '84, 113, 159', '47, 118, 128'];
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    new MutationObserver(function () {
      isLight = document.documentElement.getAttribute('data-theme') === 'light';
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    var dpr = 1;
    var w = 0;
    var h = 0;
    var motes = [];
    var rafId = 0;
    var running = false;
    var lastT = 0;
    var resizeTimer = 0;

    function spawn(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        vy: 3 + Math.random() * 5,           // px/s upward
        wander: 0.4 + Math.random() * 1.2,   // lateral sway amplitude, px/s
        phase: Math.random() * Math.PI * 2,
        freq: 0.1 + Math.random() * 0.25,    // sway cycles per second
        r: 0.8 + Math.random() * 1.1,
        alpha: 0.03 + Math.random() * 0.09,
        twinklePhase: Math.random() * Math.PI * 2,
        color: (Math.random() * 3) | 0
      };
    }

    function resize() {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = document.documentElement.clientWidth;
      h = document.documentElement.clientHeight;
      canvas.width = Math.ceil(w * dpr);
      canvas.height = Math.ceil(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.min(80, Math.round((w * h) / 26000));
      motes.length = 0;
      for (var i = 0; i < target; i++) motes.push(spawn(true));
    }

    function tick(now) {
      if (!running) return;
      var dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      var t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      var colors = isLight ? LIGHT_COLORS : DARK_COLORS;
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y -= m.vy * dt;
        m.x += Math.sin(t * m.freq * Math.PI * 2 + m.phase) * m.wander * dt;
        if (m.y < -10) motes[i] = m = spawn(false);
        var a = m.alpha * (0.7 + 0.3 * Math.sin(t * 0.5 + m.twinklePhase));
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + colors[m.color] + ', ' + a.toFixed(3) + ')';
        ctx.fill();
      }
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      lastT = performance.now();
      rafId = requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    }, { passive: true });

    resize();
    start();
    canvas.classList.add('is-live');
  }

  window.addEventListener('load', function () {
    /* Hero canvas (#hero-webgl) is owned by portfolio-3d.js, a self-booting ES module. */
    initAmbientBackground();
    initSkillsMap();
    initGithubHeatmap();
  });
})();
