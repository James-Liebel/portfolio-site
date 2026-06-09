/* Premium page interactions — cinematic intro, skills graph, optional legacy timelines, parallax, etc. */
(function () {
  "use strict";

  var MOBILE = window.matchMedia("(max-width: 767px)").matches;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function waitGsap(cb) {
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
      } else if (n > 160) clearInterval(t);
    }, 40);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function finishIntro() {
    window.__portfolioIntroExitHandled = true;
    document.body.classList.add("hero-live");
    document.body.style.opacity = "";
    document.body.style.transform = "";
    document.body.style.transition = "";
    window.dispatchEvent(new Event("intro-complete"));
  }

  function splitTitleToChars(container) {
    var saved = container.innerHTML;
    var walk = function (node) {
      if (node.nodeType === 3) {
        var text = node.textContent;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (ch === " ") {
            frag.appendChild(document.createTextNode("\u00A0"));
          } else {
            var s = document.createElement("span");
            s.className = "cinematic-char";
            s.textContent = ch;
            frag.appendChild(s);
          }
        }
        node.parentNode.replaceChild(frag, node);
        return;
      }
      if (node.nodeType === 1) {
        if (node.classList && node.classList.contains("hero-rotator")) return;
        var children = [].slice.call(node.childNodes);
        children.forEach(walk);
      }
    };
    walk(container);
    return saved;
  }

  function restoreTitle(container, html) {
    container.innerHTML = html;
  }

  function runCinematicIntro() {
    if (document.getElementById("siteIntro")) {
      return;
    }
    var noIntroFlag = typeof window !== 'undefined'
      && window.location
      && /[?&]nointro\b/.test(window.location.search);
    if (reduced || noIntroFlag) {
      document.body.style.opacity = "1";
      document.body.style.transform = "none";
      finishIntro();
      return;
    }

    document.body.classList.add("cinematic-intro-active");

    var nav = document.getElementById("siteNav");
    var heroTitle = document.getElementById("heroTitle");
    var summary = document.querySelector(".hero-section .summary");
    var terminal = document.getElementById("heroTerminal");
    var rows = document.querySelectorAll(".hero-creation-row");

    var savedTitle = heroTitle ? splitTitleToChars(heroTitle) : "";
    var introDone = false;
    function safeFinishIntro() {
      if (introDone) return;
      introDone = true;
      finishIntro();
    }

    document.body.style.opacity = "0";
    document.body.style.transform = "translateY(12px)";
    document.body.style.transition = "none";

    if (nav) {
      nav.style.transform = "translateY(-100%)";
      nav.style.transition = "none";
    }

    window.setTimeout(function () {
      document.body.style.transition =
        "opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1)";
      document.body.style.opacity = "1";
      document.body.style.transform = "translateY(0)";

      if (nav) {
        window.setTimeout(function () {
          nav.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
          nav.style.transform = "translateY(0)";
        }, 200);
      }

      waitGsap(function () {
        var gsap = window.gsap;
        if (!gsap) return;
        var chars = document.querySelectorAll(".cinematic-char");
        var tl = gsap.timeline({
          onComplete: function () {
            if (heroTitle && savedTitle) restoreTitle(heroTitle, savedTitle);
            document.body.classList.remove("cinematic-intro-active");
            safeFinishIntro();
          }
        });

        if (chars.length) {
          tl.fromTo(
            chars,
            { y: 60, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.022,
              duration: 0.7,
              ease: "power3.out"
            },
            0.3
          );
        }

        var headlineEnd = 0.3 + 0.022 * Math.max(0, chars.length - 1) + 0.7;
        if (summary) {
          tl.fromTo(
            summary,
            { y: 28, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" },
            headlineEnd + 0.15
          );
        }

        if (terminal) {
          tl.fromTo(
            terminal,
            { x: 40, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
            Math.max(headlineEnd + 0.15, 0.35)
          );
        }

        var rowT = Math.max(headlineEnd + 0.2, 0.5);
        rows.forEach(function (row, i) {
          tl.fromTo(
            row,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
            rowT + i * 0.12
          );
        });

        if (!chars.length && !summary && !terminal && !rows.length) {
          safeFinishIntro();
        }
      });
    }, 120);

    window.setTimeout(function () {
      if (!introDone && !window.gsap) safeFinishIntro();
    }, 4000);
  }

  function initJourneyTimeline() {
    var root = document.getElementById("journey-timeline");
    if (!root) return;

    var stack = root.classList.contains("jt-layout-stack");
    var strip = root.querySelector(".jt-strip");
    var panels = [].slice.call(root.querySelectorAll(".jt-panel"));
    var dots = [].slice.call(root.querySelectorAll(".jt-dot"));
    var fill = root.querySelector(".jt-bar-fill");
    var prev = root.querySelector(".jt-prev");
    var next = root.querySelector(".jt-next");
    if (!strip || !panels.length) return;

    var idx = 0;
    var scrollRaf = 0;

    function syncJourneyRailLinks() {
      var key = panels[idx] ? panels[idx].dataset.panel : "";
      if (!key) return;
      document.querySelectorAll(".rail a[data-journey]").forEach(function (a) {
        a.classList.toggle("active", a.dataset.journey === key);
      });
    }

    function panelSpan() {
      if (MOBILE) {
        return panels[0] ? panels[0].offsetHeight : strip.clientHeight;
      }
      return strip.clientWidth || window.innerWidth;
    }

    function scrollPanelToIndex(i) {
      i = Math.max(0, Math.min(panels.length - 1, i));
      var el = panels[i];
      if (!el) return;
      if (stack) {
        el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      } else if (MOBILE) {
        var top = 0;
        for (var k = 0; k < i; k++) top += panels[k] ? panels[k].offsetHeight : 0;
        if (strip.scrollTo) strip.scrollTo({ top: top, behavior: "smooth" });
        else strip.scrollTop = top;
      } else {
        var dest = i * panelSpan();
        if (strip.scrollTo) strip.scrollTo({ left: dest, behavior: "smooth" });
        else strip.scrollLeft = dest;
      }
    }

    function readScrollIndex() {
      if (stack) {
        var navOff = 96;
        var best = 0;
        var bestVis = -1;
        for (var k = 0; k < panels.length; k++) {
          var r = panels[k].getBoundingClientRect();
          if (r.bottom < navOff + 32) continue;
          if (r.top > window.innerHeight * 0.92) continue;
          var vis = Math.min(r.bottom, window.innerHeight * 0.72) - Math.max(r.top, navOff);
          if (vis > bestVis) {
            bestVis = vis;
            best = k;
          }
        }
        return best;
      }
      if (MOBILE) {
        var mid = strip.scrollTop + strip.clientHeight * 0.25;
        var acc = 0;
        for (var k = 0; k < panels.length; k++) {
          var h = panels[k].offsetHeight;
          if (mid >= acc && mid < acc + h) return k;
          acc += h;
        }
        return Math.max(0, panels.length - 1);
      }
      var pw = Math.max(1, panelSpan());
      return Math.round(strip.scrollLeft / pw);
    }

    function applyUiFromIndex(i, scrollToo) {
      idx = Math.max(0, Math.min(panels.length - 1, i));
      if (scrollToo) scrollPanelToIndex(idx);
      dots.forEach(function (d, j) {
        d.classList.toggle("is-active", j === idx);
        d.setAttribute("aria-current", j === idx ? "true" : "false");
      });
      if (fill) fill.style.width = ((idx + 1) / panels.length) * 100 + "%";
      syncJourneyRailLinks();
      animatePanel(panels[idx]);
    }

    function setIndex(i) {
      applyUiFromIndex(i, true);
    }

    function animatePanel(panel) {
      if (!window.gsap || !panel || panel.dataset.gsapDone === "1") return;
      panel.dataset.gsapDone = "1";
      var h = panel.querySelector("h3");
      var p = panel.querySelector("p");
      var items = panel.querySelectorAll(".timeline li");
      var tl = window.gsap.timeline();
      if (h) tl.fromTo(h, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" });
      if (p) tl.fromTo(p, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.25");
      if (items.length)
        tl.fromTo(
          items,
          { opacity: 0, x: -12 },
          { opacity: 1, x: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" },
          "-=0.2"
        );
    }

    function onStripScroll() {
      var i = readScrollIndex();
      if (i !== idx) {
        idx = i;
        dots.forEach(function (d, j) {
          d.classList.toggle("is-active", j === idx);
          d.setAttribute("aria-current", j === idx ? "true" : "false");
        });
        if (fill) fill.style.width = ((idx + 1) / panels.length) * 100 + "%";
        syncJourneyRailLinks();
        animatePanel(panels[idx]);
      }
    }

    if (stack) {
      window.addEventListener(
        "scroll",
        function () {
          if (scrollRaf) return;
          scrollRaf = requestAnimationFrame(function () {
            scrollRaf = 0;
            var r = root.getBoundingClientRect();
            if (r.bottom < 40 || r.top > window.innerHeight) return;
            onStripScroll();
          });
        },
        { passive: true }
      );
    } else {
      strip.addEventListener("scroll", onStripScroll, { passive: true });
    }

    if (prev)
      prev.addEventListener("click", function () {
        setIndex(idx - 1);
      });
    if (next)
      next.addEventListener("click", function () {
        setIndex(idx + 1);
      });

    dots.forEach(function (d, j) {
      d.addEventListener("click", function () {
        setIndex(j);
      });
    });

    document.addEventListener("keydown", function (e) {
      var r = root.getBoundingClientRect();
      var inView = r.top < window.innerHeight * 0.92 && r.bottom > window.innerHeight * 0.08;
      if (!inView) return;
      if (stack) {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        if (e.key === "ArrowUp") setIndex(idx - 1);
        else setIndex(idx + 1);
      } else {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        if (e.key === "ArrowLeft") setIndex(idx - 1);
        else setIndex(idx + 1);
      }
    });

    document.querySelectorAll('.rail a[href^="#journey-"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href").slice(1);
        var p = document.getElementById(id);
        if (p && strip.contains(p)) {
          e.preventDefault();
          e.stopPropagation();
          var j = panels.indexOf(p);
          if (j >= 0) setIndex(j);
        }
      });
    });

    if (!stack) {
      window.addEventListener(
        "resize",
        function () {
          scrollPanelToIndex(idx);
        },
        { passive: true }
      );
    }

    applyUiFromIndex(readScrollIndex(), false);
  }

  function initVizParallax() {
    var section = document.getElementById("visualizations");
    if (!section) return;
    var layers = section.querySelector(".viz-parallax-layers");
    if (!layers) return;
    var l1 = layers.querySelector(".viz-pl-1");
    var l2 = layers.querySelector(".viz-pl-2");
    var l3 = layers.querySelector(".viz-pl-3");

    function onScroll() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      if (rect.bottom <= 0 || rect.top >= vh) return;
      var prog = 1 - (rect.top + rect.height) / (vh + rect.height);
      var y = prog * 200;
      if (l1) l1.style.transform = "translate3d(0," + y * 0.1 + "px,0)";
      if (l2) l2.style.transform = "translate3d(0," + y * 0.25 + "px,0)";
      if (l3) l3.style.transform = "translate3d(0," + y * 0.15 + "px,0)";
    }

    var lenis = window.portfolioLenis;
    if (lenis && lenis.on) {
      lenis.on("scroll", onScroll);
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    onScroll();
  }

  function initMagnetic() {
    if (MOBILE || reduced) return;
    var sel = ".btn, .project-open, .resume-link";
    document.querySelectorAll(sel).forEach(function (btn) {
      if (btn.closest(".site-nav") || btn.closest(".mobile-nav")) return;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 80) return;
        var mx = (dx / 80) * 12;
        var my = (dy / 80) * 12;
        var skx = Math.max(-3, Math.min(3, (dy / 80) * 3));
        var sky = Math.max(-3, Math.min(3, (dx / 80) * -3));
        btn.style.transform = "translate(" + mx + "px," + my + "px) skewX(" + skx + "deg) skewY(" + sky + "deg)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  function initScrollSidebar() {
    if (MOBILE) return;
    var el = document.getElementById("scroll-section-rail");
    if (!el) return;
    var dots = [].slice.call(el.querySelectorAll(".ss-dot"));
    var fill = el.querySelector(".ss-line-fill");
    var sections = ["hero", "skills", "projects", "visualizations", "experience", "resume"].map(function (id) {
      return document.getElementById(id);
    });

    function update() {
      var y = window.scrollY + window.innerHeight * 0.42;
      var active = 0;
      sections.forEach(function (s, i) {
        if (!s) return;
        var top = s.getBoundingClientRect().top + window.scrollY;
        if (y >= top) active = i;
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === active);
      });
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      if (fill) fill.style.height = p * 100 + "%";
    }

    var railPending = false;
    function scheduleRailUpdate() {
      if (railPending) return;
      railPending = true;
      requestAnimationFrame(function () {
        railPending = false;
        update();
      });
    }

    window.addEventListener(
      "intro-complete",
      function () {
        requestAnimationFrame(update);
      },
      { once: true }
    );

    var lenis = window.portfolioLenis;
    if (lenis && lenis.on) lenis.on("scroll", scheduleRailUpdate);
    else window.addEventListener("scroll", scheduleRailUpdate, { passive: true });
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () {
        var s = sections[i];
        if (s) s.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    update();
  }

  function initProjectStack() {
    // Sticky-stacked project cards: while the next card scrolls in, the
    // previous one holds below the nav and recedes (scale + dim only, so it
    // stays on the compositor). Progress is recomputed from live geometry
    // every frame instead of ScrollTrigger because <details> expansion changes
    // card heights at any time, and portfolio-site.js documents that
    // refreshing ScrollTrigger on toggle makes the viewport jump.
    if (MOBILE || reduced) return;
    if (document.documentElement.classList.contains("perf-lite")) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    var sections = [].slice.call(document.querySelectorAll("#projects .project-section"));
    if (sections.length < 2) return;

    document.documentElement.classList.add("project-stack-live");

    sections.forEach(function (section) {
      var det = section.querySelector(".project-disclosure");
      if (!det) return;
      // an expanded card can be taller than the viewport, where sticky would
      // trap its lower content off-screen; open cards flow normally instead
      var sync = function () {
        section.classList.toggle("is-open", det.open);
      };
      det.addEventListener("toggle", sync);
      sync();
    });

    var pending = false;
    function update() {
      pending = false;
      var vh = window.innerHeight || 1;
      for (var i = 0; i < sections.length - 1; i++) {
        var section = sections[i];
        var nextTop = sections[i + 1].getBoundingClientRect().top;
        // 0 while the next card is below the fold, 1 once its top passes 38%
        // of the viewport, just before it covers the held card
        var p = Math.max(0, Math.min(1, (vh - nextTop) / (vh * 0.62)));
        if (p === 0) {
          if (section.style.transform) {
            section.style.transform = "";
            section.style.opacity = "";
          }
          continue;
        }
        var e = p * p * (3 - 2 * p);
        section.style.transform = "scale(" + (1 - 0.055 * e).toFixed(4) + ")";
        section.style.opacity = (1 - 0.48 * e).toFixed(3);
      }
    }
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    }

    var lenis = window.portfolioLenis;
    if (lenis && lenis.on) lenis.on("scroll", schedule);
    else window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
  }

  function initSectionReveals() {
    // Scrubbed head choreography: kicker, title, lede and the title underline
    // track scroll through each section's entry window, so the reveal plays
    // forward and backward with the reader instead of firing once.
    // immediateRender:false keeps headings visible if ScrollTrigger never
    // runs, the failure mode the footer reveal previously hit.
    if (reduced) return;
    if (document.documentElement.classList.contains("perf-lite")) return;
    if (!window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    document.querySelectorAll("main section[id]").forEach(function (sec) {
      if (sec.id === "hero") return;
      var head = sec.querySelector(".section-head, .journey-head");
      if (!head) return;
      var title = head.querySelector("h2");
      var kicker = head.querySelector(".section-kicker");
      var ledes = [].slice.call(head.querySelectorAll("p")).filter(function (p) {
        return p !== kicker;
      });

      function scrubVars() {
        return {
          trigger: head,
          start: "top 94%",
          end: "top 58%",
          scrub: 0.55
        };
      }

      if (title) {
        gsap.fromTo(
          title,
          { y: 48, opacity: 0 },
          { y: 0, opacity: 1, ease: "none", immediateRender: false, scrollTrigger: scrubVars() }
        );
        // sweeps the existing gradient underline; the bar trails the title
        gsap.fromTo(
          title,
          { "--head-line": 0 },
          {
            "--head-line": 1,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: head, start: "top 84%", end: "top 48%", scrub: 0.55 }
          }
        );
      }
      if (kicker) {
        gsap.fromTo(
          kicker,
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, ease: "none", immediateRender: false, scrollTrigger: scrubVars() }
        );
      }
      if (ledes.length) {
        gsap.fromTo(
          ledes,
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, ease: "none", immediateRender: false, scrollTrigger: scrubVars() }
        );
      }
    });
  }

  function initCountUp() {
    document.querySelectorAll(".count-up-premium").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-target") || "0");
      var suffix = el.getAttribute("data-suffix") || "";
      var fmt = el.getAttribute("data-format") || "";
      var io = new IntersectionObserver(
        function (ents) {
          ents.forEach(function (e) {
            if (!e.isIntersecting) return;
            io.disconnect();
            var t0 = performance.now();
            function frame(now) {
              var u = easeOutExpo(Math.min(1, (now - t0) / 1800));
              var v = Math.round(end * u);
              var core = fmt === "comma" ? v.toLocaleString("en-US") : String(v);
              el.textContent = core + suffix;
              if (u < 1) requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
          });
        },
        { threshold: 0.4 }
      );
      io.observe(el);
    });
  }

  function initCardTilt() {
    // Pointer tilt: the hovered edge rises toward the viewer and the cursor
    // glow doubles as the moving glare. The shared card-lift rule transitions
    // transform, which would ease every per-frame write, so the inline
    // transition is suspended while tilting and restored once the card has
    // sprung flat and its inline transform is cleared.
    if (MOBILE || reduced) return;
    if (document.documentElement.classList.contains("perf-lite")) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    var MAX_DEG = 6;
    var sel = ".hero-edu-card, .hero-metric, .visual-card, .work-visual-card, .skills-branch, .bento-card";
    document.querySelectorAll(sel).forEach(function (card) {
      var raf = null;
      var tRX = 0, tRY = 0, tZ = 0;
      var rx = 0, ry = 0, z = 0;
      function frame() {
        rx = lerp(rx, tRX, 0.16);
        ry = lerp(ry, tRY, 0.16);
        z = lerp(z, tZ, 0.16);
        var resting = tRX === 0 && tRY === 0 && tZ === 0;
        var settled =
          Math.abs(tRX - rx) < 0.02 && Math.abs(tRY - ry) < 0.02 && Math.abs(tZ - z) < 0.1;
        if (resting && settled) {
          card.style.transform = "";
          card.style.transition = "";
          raf = null;
          return;
        }
        card.style.transform =
          "perspective(900px) rotateX(" + rx.toFixed(3) + "deg) rotateY(" + ry.toFixed(3) +
          "deg) translateZ(" + z.toFixed(2) + "px)";
        if (settled) {
          raf = null;
          return;
        }
        raf = requestAnimationFrame(frame);
      }
      function kick() {
        if (raf === null) raf = requestAnimationFrame(frame);
      }
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        tRX = ny * MAX_DEG;
        tRY = -nx * MAX_DEG;
        tZ = 7;
        card.style.transition = "none";
        kick();
      });
      card.addEventListener("pointerleave", function () {
        tRX = 0;
        tRY = 0;
        tZ = 0;
        kick();
      });
    });
  }

  function initCardGlow() {
    if (MOBILE) return;
    var cards = document.querySelectorAll(
      ".bento-card, .visual-card, .journey-stop, .work-visual-card, .skills-branch, .hero-edu-card, .hero-metric"
    );
    cards.forEach(function (card) {
      // Ease the glow toward the cursor instead of snapping 1:1, so it feels
      // smooth and soft. The rAF loop runs only while the glow is catching up,
      // then stops, so an idle card costs nothing.
      var curX = 50, curY = 50, tgtX = 50, tgtY = 50;
      var raf = null;
      function tick() {
        curX += (tgtX - curX) * 0.12;
        curY += (tgtY - curY) * 0.12;
        card.style.setProperty("--mouse-x", curX.toFixed(2) + "%");
        card.style.setProperty("--mouse-y", curY.toFixed(2) + "%");
        if (Math.abs(tgtX - curX) > 0.1 || Math.abs(tgtY - curY) > 0.1) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = null;
        }
      }
      function kick() { if (raf === null) raf = requestAnimationFrame(tick); }
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        tgtX = ((e.clientX - r.left) / r.width) * 100;
        tgtY = ((e.clientY - r.top) / r.height) * 100;
        kick();
      });
      card.addEventListener("mouseleave", function () {
        tgtX = 50;
        tgtY = 50;
        kick();
      });
    });
  }

  function boot() {
    runCinematicIntro();
    window.addEventListener("load", function () {
      initJourneyTimeline();
      initVizParallax();
      initMagnetic();
      initScrollSidebar();
      initProjectStack();
      waitGsap(function () {
        initSectionReveals();
      });
      initCountUp();
      initCardGlow();
      initCardTilt();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
