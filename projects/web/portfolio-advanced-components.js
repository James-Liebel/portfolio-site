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
      eng: { base: '#3a5a96', mid: '#5b82c9', glow: '#7ea0d0' },
      sci: { base: '#54719f', mid: '#7593c9', glow: '#93b0e0' },
      ana: { base: '#356b73', mid: '#3a8a93', glow: '#5fa8b3' }
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
      ns('stop', { offset: '0%', 'stop-color': '#2a4757', 'stop-opacity': '1' }, gradFlow);
      ns('stop', { offset: '40%', 'stop-color': '#4f6fae', 'stop-opacity': '1' }, gradFlow);
      ns('stop', { offset: '100%', 'stop-color': '#5fa8b3', 'stop-opacity': '1' }, gradFlow);
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
      trunkBase.setAttribute('stroke', '#2f4a78');
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
      trunkFlow.setAttribute('stroke-dasharray', '10 22');
      trunkFlow.setAttribute('opacity', '0');

      var mergeNode = ns('circle', { class: 'skills-pipe-merge-node', cx: String(mx), cy: String(my), r: '6' }, svg);
      mergeNode.setAttribute('fill', '#5fa8b3');
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

    function startFlowLoops() {
      // Delegates to the shared coordinator so the pipeline + tether wires run
      // off one tween and pulse in unison.
      syncSkillsFlow();
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

  // ─── Shared flow coordinator: drives every skills wire (tether cords +
  //     pipeline spines/trunk) from ONE tween so they pulse together, and
  //     restarts all gradient flashes in phase. Called whenever either system
  //     (re)draws — the latest call re-syncs both. ───────────────────────────
  function syncSkillsFlow() {
    if (!window.gsap) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var tetherSvg = document.getElementById('skillsTetherSvg');
    var pipeSvg = document.getElementById('skillsPipelineSvg');
    var flows = [];
    if (tetherSvg) tetherSvg.querySelectorAll('.skills-tether-flow').forEach(function (p) { flows.push(p); });
    if (pipeSvg) pipeSvg.querySelectorAll('.skills-pipe-column-flow, .skills-pipe-trunk-flow').forEach(function (p) { flows.push(p); });
    if (flows.length) {
      window.gsap.killTweensOf(flows);
      window.gsap.set(flows, { strokeDashoffset: 0 });
      // -32 = one dash period (10 + 22), so the loop is seamless for every wire.
      window.gsap.to(flows, { strokeDashoffset: -32, duration: 1.6, ease: 'none', repeat: -1 });
    }
    // Restart both SVGs' gradient flashes together (separate inline-SVG SMIL
    // timelines otherwise drift apart).
    try {
      [tetherSvg, pipeSvg].forEach(function (root) {
        if (!root) return;
        root.querySelectorAll('linearGradient animate').forEach(function (a) { if (a.beginElement) a.beginElement(); });
      });
    } catch (e) { /* SMIL control unsupported */ }
  }

  // ─── Skills tether: wires drop from the compact band's three path titles
  //     into the opened map's columns. Empty (hidden) until the map opens. ─────
  function initSkillsTether() {
    var section = document.getElementById('skills');
    var details = document.getElementById('skillsAtlasDetails');
    var band = document.getElementById('skillsCompactBand');
    var svg = document.getElementById('skillsTetherSvg');
    if (!section || !details || !band || !svg) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var KEYS = ['eng', 'sci', 'ana'];
    // Same base/glow as the in-map pipeline so the tether reads as that same
    // pulsing wire continuing up to the title (see COL in initSkillsPipeline).
    var COL = {
      eng: { base: '#3a5a96', glow: '#7ea0d0' },
      sci: { base: '#4f3d82', glow: '#9b8fcf' },
      ana: { base: '#356b73', glow: '#5fa8b3' }
    };
    var openTimer = null;
    var resizeTimer = null;

    function svgEl(tag, attrs) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      return el;
    }

    function clear() {
      svg.innerHTML = '';
    }

    function build(animate) {
      if (!details.open) { clear(); return; }
      // Below the columns' breakpoint they stack vertically, so title→column
      // wires would become long diagonal tangles. Skip the tether there.
      if (window.matchMedia && window.matchMedia('(max-width: 1024px)').matches) { clear(); return; }
      var sr = svg.getBoundingClientRect();
      var W = Math.max(1, Math.round(sr.width));
      var H = Math.max(1, Math.round(sr.height));
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.innerHTML = '';

      // Measure each wire first: start at the title's top-left, end exactly where
      // the pipeline spine begins (column left + 3) so the two read as one wire.
      var specs = [];
      KEYS.forEach(function (key) {
        var title = band.querySelector('.skills-compact-group--' + key + ' .skills-compact-group-title');
        var col = section.querySelector('.skills-atlas-column--' + key);
        if (!title || !col) return;
        var tr = title.getBoundingClientRect();
        var cr = col.getBoundingClientRect();
        var x1 = Math.round(tr.left - sr.left - 24); // start in the margin left of the title words
        var y1 = Math.round(tr.top - sr.top);
        var x2 = Math.round(cr.left - sr.left + 3);
        var y2 = Math.round(cr.top - sr.top);
        if (y2 - y1 < 24) return; // map still collapsed/animating — nothing to draw yet
        specs.push({ key: key, x1: x1, y1: y1, x2: x2, y2: y2 });
      });
      if (!specs.length) { clear(); return; }

      // Match the pipeline gradient's exact coordinate mapping and motion so the
      // cords flash in lockstep with their spines (same position, speed, phase) —
      // not just the same colors. The pipeline maps y 0..H over the region with
      // H = bridge.top - region.top; we shift that into this section-level SVG by
      // the region's offset so a given page row gets the same gradient color.
      var pipeRegion = document.getElementById('skillsPipelineRegion');
      var pipeBridge = document.getElementById('skillsPipelineSummary');
      var offset = 0;
      var hPipe = Math.max(1, Math.max.apply(null, specs.map(function (s) { return s.y2; })) - Math.min.apply(null, specs.map(function (s) { return s.y1; })));
      if (pipeRegion && pipeBridge) {
        var rr = pipeRegion.getBoundingClientRect();
        var bb = pipeBridge.getBoundingClientRect();
        offset = Math.round(rr.top - sr.top);
        hPipe = Math.max(1, Math.round(bb.top - rr.top));
      }
      var defs = svgEl('defs', {});
      var grad = svgEl('linearGradient', { id: 'skillsTetherGrad', x1: '0', y1: String(offset), x2: '0', y2: String(offset + hPipe), gradientUnits: 'userSpaceOnUse' });
      grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#2a4757' }));
      grad.appendChild(svgEl('stop', { offset: '40%', 'stop-color': '#4f6fae' }));
      grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#5fa8b3' }));
      if (!reduced) {
        grad.appendChild(svgEl('animate', { attributeName: 'y1', values: (offset - hPipe) + ';' + (offset + hPipe) + ';' + (offset - hPipe), dur: '2.8s', repeatCount: 'indefinite' }));
        grad.appendChild(svgEl('animate', { attributeName: 'y2', values: offset + ';' + (offset + 2 * hPipe) + ';' + offset, dur: '2.8s', repeatCount: 'indefinite' }));
      }
      defs.appendChild(grad);
      svg.appendChild(defs);

      var reveal = [];
      specs.forEach(function (s) {
        var c1y = s.y1 + (s.y2 - s.y1) * 0.42;
        var c2y = s.y2 - (s.y2 - s.y1) * 0.30;
        var d = 'M ' + s.x1 + ' ' + s.y1 + ' C ' + s.x1 + ' ' + c1y + ', ' + s.x2 + ' ' + c2y + ', ' + s.x2 + ' ' + s.y2;
        var base = svgEl('path', { class: 'skills-tether-base', d: d, fill: 'none', stroke: COL[s.key].base, 'stroke-width': '3', 'stroke-linecap': 'round', opacity: '0.92' });
        var gline = svgEl('path', { class: 'skills-tether-grad', d: d, fill: 'none', stroke: 'url(#skillsTetherGrad)', 'stroke-width': '2', 'stroke-linecap': 'round' });
        var flow = svgEl('path', { class: 'skills-tether-flow', d: d, fill: 'none', stroke: COL[s.key].glow, 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-dasharray': '10 22', opacity: '0' });
        svg.appendChild(base);
        svg.appendChild(gline);
        svg.appendChild(flow);
        svg.appendChild(svgEl('circle', { cx: s.x1, cy: s.y1, r: '3.5', fill: COL[s.key].glow })); // tap at the title
        reveal.push(base, gline);
      });

      var flows = svg.querySelectorAll('.skills-tether-flow');
      if (reduced || !animate || !window.gsap) {
        reveal.forEach(function (p) { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; });
        flows.forEach(function (p) { p.setAttribute('opacity', '0.9'); });
        syncSkillsFlow();
        return;
      }
      // All cords fold down together (no stagger), then the glow dashes fade in
      // and start pulsing in unison.
      reveal.forEach(function (p) {
        var len = p.getTotalLength() || 1;
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        window.gsap.to(p, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.out' });
      });
      window.gsap.to(flows, { opacity: 0.9, duration: 0.3, delay: 0.5 });
      window.gsap.delayedCall(0.55, syncSkillsFlow);
    }

    function scheduleDraw() {
      if (openTimer) clearTimeout(openTimer);
      clear();
      // Let the disclosure finish its height transition before measuring columns.
      openTimer = setTimeout(function () { build(true); }, reduced ? 60 : 560);
    }

    details.addEventListener('toggle', function () {
      if (details.open) scheduleDraw();
      else { if (openTimer) clearTimeout(openTimer); clear(); }
    });

    if (details.open) scheduleDraw();

    window.addEventListener('resize', function () {
      if (!details.open) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { build(false); }, 160);
    }, { passive: true });
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
    /* Hero canvas (#hero-webgl) is owned by portfolio-3d.js, a self-booting ES module. */
    initSkillsPipeline();
    initSkillsTether();
    initGithubHeatmap();
  });
})();
