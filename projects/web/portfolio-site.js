(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    document.getElementById("intro-canvas")?.remove();
    document.getElementById("introSkip")?.remove();
    document.getElementById("intro-poster")?.remove();
  }
  const siteNav = document.getElementById("siteNav");
  const scrollProgress = document.getElementById("scroll-progress");
  const brandBadges = [...document.querySelectorAll(".brand-badge")];
  const navLinks = [...document.querySelectorAll('.nav-link[href^="#"]')];
  const sectionTargets = [...document.querySelectorAll("main section[id]")];
  const navIndicator = document.getElementById("navIndicator");
  const navToggle = document.getElementById("navToggle");
  const navClose = document.getElementById("navClose");
  const mobileNav = document.getElementById("mobileNav");
  const customCursor = document.getElementById("customCursor");
  const customCursorDot = document.getElementById("customCursorDot");
  const hero = document.getElementById("hero");
  const heroTitle = document.getElementById("heroTitle");
  const heroTerminal = document.getElementById("heroTerminal");
  const heroPills = document.getElementById("heroPills");
  const heroGrain = hero?.querySelector(".hero-grain") ?? null;
  const heroWord = document.getElementById("heroWord");
  const modeButtons = [...document.querySelectorAll(".switch button[data-mode]")];
  const modeIndicator = document.getElementById("modeIndicator");
  const signalTags = document.getElementById("signalTags");
  const signalTitle = document.getElementById("signalTitle");
  const signalBadge = document.getElementById("signalBadge");
  const signalBody = document.getElementById("signalBody");
  const s1l = document.getElementById("s1l");
  const s1v = document.getElementById("s1v");
  const s1n = document.getElementById("s1n");
  const s2l = document.getElementById("s2l");
  const s2v = document.getElementById("s2v");
  const s2n = document.getElementById("s2n");
  const s3l = document.getElementById("s3l");
  const s3v = document.getElementById("s3v");
  const s3n = document.getElementById("s3n");
  const projectLinks = [...document.querySelectorAll(".project-rail a[href^='#project-']")];
  const projectSections = [...document.querySelectorAll(".project-section[data-project-section]")];
  const projectRailPreview = document.getElementById("projectRailPreview");
  const projectRailPreviewTitle = projectRailPreview?.querySelector(".project-rail-preview-title") ?? null;
  const projectRailPreviewSummary = projectRailPreview?.querySelector(".project-rail-preview-summary") ?? null;
  const projectRailPreviewMetrics = projectRailPreview?.querySelector(".project-rail-preview-metrics") ?? null;
  const journey = document.getElementById("journey");
  const journeyTrack = document.getElementById("journey-track");
  const journeyLinks = [...document.querySelectorAll(".rail a[data-journey]")];
  const journeyStops = [...document.querySelectorAll(".journey-stop[data-panel]")];
  const resumePanel = document.querySelector(".resume-panel");
  const footer = document.querySelector(".site-footer");
  const pdfButtons = [document.getElementById("pdfBtn")].filter(Boolean);
  const themeToggle = document.getElementById("themeToggle");

  function applyStoredTheme() {
    try {
      const stored = localStorage.getItem("portfolio-theme");
      if (stored === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", stored === "light" ? "true" : "false");
      }
    } catch {
      /* ignore */
    }
  }

  applyStoredTheme();
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      if (isLight) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("portfolio-theme", "dark");
        themeToggle.setAttribute("aria-pressed", "false");
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("portfolio-theme", "light");
        themeToggle.setAttribute("aria-pressed", "true");
      }
    });
  }

  const modeData = {
    builder: {
      angle: 300,
      word: "Data Engineering",
      label: "",
      title: "Best evidence for data engineering work",
      badge: "Pipelines + delivery",
      body: "This view highlights transformation work, SQL structure, application plumbing, and moving data into usable outputs.",
      s1: ["Core tools", "Python / SQL / FastAPI", "Main stack for data movement, workflow logic, and lightweight back-end delivery."],
      s2: ["Workflow focus", "ETL + modeling + APIs", "Projects show preparation, structuring, and exposing data in recruiter-readable formats."],
      s3: ["What stands out", "Usable systems", "The work connects raw inputs to dashboards, tools, maps, and interactive outputs."],
      foot: "Best fit for data engineering, analytics engineering, and platform-adjacent internships.",
      tags: ["SQL", "ETL", "FastAPI", "Power Query"]
    },
    analyst: {
      angle: 210,
      word: "Data Science",
      label: "",
      title: "Best evidence for data science work",
      badge: "Modeling + evaluation",
      body: "This view highlights supervised learning, NLP, EDA, feature work, and recruiter-readable evaluation.",
      s1: ["Model work", "Fraud + sentiment", "Classification and text analysis projects show applied modeling experience."],
      s2: ["Evaluation", "Validation / benchmarks / tradeoffs", "Results are framed with metrics, comparisons, and tradeoffs."],
      s3: ["Communication", "Charts + writeups", "Visuals and plain-language explanations support the technical work."],
      foot: "Best fit for data science, analytics, and research-oriented internships.",
      tags: ["Scikit-learn", "XGBoost", "EDA", "TF-IDF"]
    },
    operator: {
      angle: 120,
      word: "Data Analysis",
      label: "",
      title: "Best evidence for data analysis work",
      badge: "Dashboards + reporting",
      body: "This view highlights exploratory analysis, clear visual explanation, BI delivery, and turning findings into readable outputs.",
      s1: ["Analysis stack", "SQL / Power BI / D3", "The portfolio emphasizes reporting, visual framing, and digging into structured data."],
      s2: ["Output style", "Dashboards + stories", "Projects are packaged as charts, maps, and panels another person can review quickly."],
      s3: ["What stands out", "Readable decisions", "The work focuses on making results understandable, comparable, and useful."],
      foot: "Best fit for data analysis, BI, and decision-support internships.",
      tags: ["Power BI", "DAX", "D3.js", "Reporting"]
    }
  };

  const heroWords = ["data science", "machine learning", "visualization", "AI prototyping"];
  let heroWordIndex = 0;
  let lenis = null;
  let gsapScrollProgress = false;
  let heroWordTimer = null;
  let heroTypeTimer = null;
  let heroMotionStarted = false;
  let heroWordCycleStarted = false;
  let journeyScrollTrigger = null;

  function animateCountUpItem(item, duration = 1.4) {
    if (!item || item.dataset.counted === "true" || !window.gsap) return;
    const { gsap } = window;
    const target = Number(item.dataset.value || "0");
    const suffix = item.dataset.suffix || "";
    const state = { value: 0 };
    const formatValue = value => `${Math.round(value).toLocaleString()}${suffix}`;
    item.dataset.counted = "true";
    item.textContent = formatValue(0);
    gsap.to(state, {
      value: target,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        item.textContent = formatValue(state.value);
      }
    });
  }

  function movePillIndicator(indicator, target, animate = false) {
    if (!indicator || !target || !target.parentElement) return;
    const parentRect = target.parentElement.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const x = rect.left - parentRect.left;
    const width = rect.width;
    if (animate && window.gsap) {
      window.gsap.to(indicator, {
        x: x,
        width,
        duration: 0.28,
        ease: "power2.inOut",
        overwrite: true
      });
    } else {
      if (window.gsap) {
        window.gsap.set(indicator, { x, width });
      } else {
        indicator.style.width = `${width}px`;
        indicator.style.transform = `translate(${x}px, 0)`;
      }
    }
  }

  function moveNavIndicator(activeLink) {
    if (!navIndicator || !activeLink || !activeLink.parentElement || window.innerWidth <= 920) return;
    const parentRect = activeLink.parentElement.getBoundingClientRect();
    const rect = activeLink.getBoundingClientRect();
    navIndicator.classList.add("ready");
    if (window.gsap) {
      window.gsap.to(navIndicator, {
        x: rect.left - parentRect.left,
        width: rect.width,
        duration: 0.42,
        ease: "power3.out",
        overwrite: true
      });
    } else {
      navIndicator.style.width = `${rect.width}px`;
      navIndicator.style.transform = `translate(${rect.left - parentRect.left}px, 0)`;
    }
  }

  function getNavLinkBaseColor(link) {
    if (!link) return "";
    const scrolled = siteNav?.classList.contains("scrolled");
    if (scrolled) {
      return link.classList.contains("active") ? "var(--dark)" : "rgba(26, 30, 46, 0.64)";
    }
    return link.classList.contains("active") ? "#e8e9f0" : "rgba(232, 233, 240, 0.92)";
  }

  function applyNavLinkState(link) {
    if (!link) return;
    link.style.color = getNavLinkBaseColor(link);
    link.style.transform = link.classList.contains("active") ? "translateY(-2px)" : "translateY(0)";
  }

  function syncNavLinkStyles() {
    navLinks.forEach(applyNavLinkState);
  }

  function markActiveNav(id) {
    let activeLink = null;
    navLinks.forEach(link => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", isActive);
      if (isActive) activeLink = link;
    });
    syncNavLinkStyles();
    moveNavIndicator(activeLink);
  }

  function closeMobileNav() {
    if (!mobileNav || mobileNav.hidden) return;
    if (!window.gsap || reduced) {
      mobileNav.hidden = true;
      document.body.classList.remove("menu-open");
      if (navToggle) {
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
      return;
    }
    const { gsap } = window;
    gsap.to("#mobileNav", {
      x: "100%",
      opacity: 0,
      duration: 0.4,
      ease: "power3.in",
      onComplete: () => {
        mobileNav.hidden = true;
        document.body.classList.remove("menu-open");
        if (navToggle) {
          navToggle.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  function openMobileNav() {
    if (!mobileNav) return;
    if (!window.gsap || reduced) {
      mobileNav.hidden = false;
      document.body.classList.add("menu-open");
      if (navToggle) {
        navToggle.classList.add("is-open");
        navToggle.setAttribute("aria-expanded", "true");
      }
      return;
    }
    const { gsap } = window;
    mobileNav.hidden = false;
    document.body.classList.add("menu-open");
    if (navToggle) {
      navToggle.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "true");
    }
    const links = mobileNav.querySelectorAll(".mobile-nav-links a");
    gsap.fromTo("#mobileNav", { x: "100%", opacity: 0 }, {
      x: "0%",
      opacity: 1,
      duration: 0.5,
      ease: "power3.out"
    });
    if (links.length) {
      gsap.from(links, {
        x: 40,
        opacity: 0,
        stagger: 0.07,
        duration: 0.4,
        ease: "power2.out",
        delay: 0.2
      });
    }
  }

  function scrollToTarget(target) {
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: -92, duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }

  function updateProgress() {
    if (gsapScrollProgress) return;
    if (!scrollProgress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    scrollProgress.style.width = `${progress}%`;
  }

  function updateNavState() {
    if (!siteNav || !hero) return;
    const heroBottom = hero.getBoundingClientRect().bottom;
    siteNav.classList.toggle("scrolled", heroBottom <= 140);
    syncNavLinkStyles();
  }

  function splitHeadlineWords() {
    if (!heroTitle || heroTitle.dataset.split === "true") {
      return heroTitle ? [...heroTitle.querySelectorAll(".hw")] : [];
    }
    const lineNodes = [...heroTitle.querySelectorAll(".hero-name, .hero-line")].filter(node => !node.classList.contains("hero-rotator"));
    lineNodes.forEach(line => {
      const text = line.textContent || "";
      const words = text.trim().split(/\s+/).filter(Boolean);
      if (!words.length) return;
      line.textContent = "";
      words.forEach((word, index) => {
        const outer = document.createElement("span");
        const inner = document.createElement("span");
        outer.style.display = "inline-block";
        outer.style.overflow = "hidden";
        inner.className = "hw";
        inner.style.display = "inline-block";
        inner.textContent = word;
        outer.appendChild(inner);
        line.appendChild(outer);
        if (index < words.length - 1) {
          line.appendChild(document.createTextNode(" "));
        }
      });
    });
    heroTitle.dataset.split = "true";
    return [...heroTitle.querySelectorAll(".hw")];
  }

  function renderMode(key) {
    const next = modeData[key];
    if (!next) return;
    const activeButton = modeButtons.find(button => button.dataset.mode === key);
    modeButtons.forEach(button => button.classList.toggle("active", button === activeButton));
    movePillIndicator(modeIndicator, activeButton, true);
    if (signalTitle) signalTitle.textContent = next.title;
    if (signalBadge) signalBadge.textContent = next.badge;
    if (signalBody) signalBody.textContent = next.body;
    [[s1l, s1v, s1n, next.s1], [s2l, s2v, s2n, next.s2], [s3l, s3v, s3n, next.s3]].forEach(([a, b, c, values]) => {
      if (a) a.textContent = values[0];
      if (b) b.textContent = values[1];
      if (c) c.textContent = values[2];
    });
    if (signalTags) {
      signalTags.innerHTML = next.tags.map(tag => `<span class="tag">${tag}</span>`).join("");
    }
  }

  function updateProjectRail(activeId) {
    projectLinks.forEach(link => {
      const isActive = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("active", isActive);
    });

    if (!projectRailPreview || !activeId) return;

    const activeSection = document.getElementById(activeId);
    const titleEl = activeSection?.querySelector(".project-copy h3") ?? null;
    const summaryEl = activeSection?.querySelector(".project-copy > p") ?? null;
    const metricEls = activeSection ? [...activeSection.querySelectorAll(".project-metrics .metric-pill")] : [];

    projectRailPreviewTitle && (projectRailPreviewTitle.textContent = titleEl?.textContent?.trim() ?? "");
    projectRailPreviewSummary && (projectRailPreviewSummary.textContent = summaryEl?.textContent?.trim() ?? "");
    if (projectRailPreviewMetrics) {
      projectRailPreviewMetrics.innerHTML = metricEls
        .map(el => `<span class="metric-pill">${(el.textContent || "").trim()}</span>`)
        .join("");
    }

    projectRailPreview.classList.toggle("is-visible", Boolean(titleEl));
  }

  function updateJourneyRail(activePanel) {
    journeyLinks.forEach(link => {
      const isActive = link.dataset.journey === activePanel;
      link.classList.toggle("active", isActive);
    });
  }

  function setupObservers() {
    const navObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;

      // Choose the most visible section so the nav indicator reliably follows
      // the user's scroll position (e.g. Home -> Skills).
      visible.sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
      markActiveNav(visible[0].target.id);
    }, {
      rootMargin: "-20% 0px -65% 0px",
      threshold: [0.01, 0.08, 0.15, 0.25, 0.4, 0.6, 0.8]
    });

    sectionTargets.forEach(section => navObserver.observe(section));

    const projectObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        updateProjectRail(entry.target.id);
      });
    }, { threshold: 0.45 });

    projectSections.forEach(section => projectObserver.observe(section));

    if (reduced) {
      const journeyObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          updateJourneyRail(entry.target.dataset.panel || "");
        });
      }, { root: document.querySelector(".journey-track-shell"), threshold: 0.55 });

      journeyStops.forEach(stop => journeyObserver.observe(stop));
    }
  }

  function setupCountUps() {
    const items = [...document.querySelectorAll(".count-up")];
    if (!items.length || reduced || !window.gsap || !window.ScrollTrigger) return;
    const { ScrollTrigger } = window;

    items.forEach(item => {
      ScrollTrigger.create({
        trigger: item,
        start: "top 82%",
        once: true,
        onEnter: () => {
          animateCountUpItem(item);
        }
      });
    });
  }

  function setupSkillsTransition() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap } = window;
    const bridge = document.getElementById("skillsTransition");
    const stage = bridge?.querySelector(".skills-transition-stage") ?? null;
    const curtain = bridge?.querySelector(".skills-transition-curtain") ?? null;
    const wash = bridge?.querySelector(".skills-transition-wash") ?? null;

    if (!bridge || !stage || !curtain || !wash) return;

    gsap.set(stage, { y: 0 });
    gsap.set(curtain, { opacity: 0.92 });
    gsap.set(wash, {
      y: 34,
      scale: 0.92,
      opacity: 0.58,
      transformOrigin: "50% 50%"
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: bridge,
        start: "top 88%",
        end: "bottom 52%",
        scrub: 1
      }
    })
      .to(curtain, {
        opacity: 0.72,
        duration: 1,
        ease: "none"
      }, 0)
      .to(wash, {
        y: 0,
        scale: 1,
        opacity: 0.94,
        duration: 1,
        ease: "none"
      }, 0)
      .to(stage, {
        y: -18,
        duration: 1,
        ease: "none"
      }, 0);

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      bridge.addEventListener("mousemove", event => {
        const rect = bridge.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;

        gsap.to(wash, {
          x: px * 18,
          y: py * 12,
          rotateZ: px * 1.4,
          duration: 0.7,
          ease: "power2.out"
        });
      });

      bridge.addEventListener("mouseleave", () => {
        gsap.to(wash, {
          x: 0,
          y: 0,
          rotateZ: 0,
          duration: 0.9,
          ease: "power3.out"
        });
      });
    }
  }

  function setupBentoMotion() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap } = window;
    const grid = document.querySelector(".skills-grid");
    const cards = grid ? [...grid.querySelectorAll(".bento-card")] : [];
    if (!grid || !cards.length) return;

    gsap.from(cards, {
      y: 60,
      opacity: 0,
      stagger: 0.09,
      duration: 0.65,
      ease: "power3.out",
      scrollTrigger: {
        trigger: grid,
        start: "top 80%",
        once: true
      }
    });

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    cards.forEach(card => {
      const state = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        raf: 0
      };

      const render = () => {
        state.x += (state.targetX - state.x) * 0.1;
        state.y += (state.targetY - state.y) * 0.1;
        card.style.setProperty("--magnetic-x", `${state.x.toFixed(2)}px`);
        card.style.setProperty("--magnetic-y", `${state.y.toFixed(2)}px`);

        const settled = Math.abs(state.targetX - state.x) < 0.08 && Math.abs(state.targetY - state.y) < 0.08;
        if (settled && state.targetX === 0 && state.targetY === 0) {
          state.raf = 0;
          return;
        }
        state.raf = requestAnimationFrame(render);
      };

      const startRender = () => {
        if (!state.raf) state.raf = requestAnimationFrame(render);
      };

      card.addEventListener("mousemove", event => {
        gsap.killTweensOf(state);
        const rect = card.getBoundingClientRect();
        const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
        const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
        state.targetX = Math.max(-8, Math.min(8, offsetX));
        state.targetY = Math.max(-8, Math.min(8, offsetY));
        startRender();
      });

      card.addEventListener("mouseleave", () => {
        if (state.raf) {
          cancelAnimationFrame(state.raf);
          state.raf = 0;
        }
        gsap.to(state, {
          x: 0,
          y: 0,
          targetX: 0,
          targetY: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.45)",
          overwrite: true,
          onUpdate: () => {
            card.style.setProperty("--magnetic-x", `${state.x.toFixed(2)}px`);
            card.style.setProperty("--magnetic-y", `${state.y.toFixed(2)}px`);
          }
        });
      });
    });
  }

  function setupSkillShowcases() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;
    const showcases = [...document.querySelectorAll(".skills-showcase")];
    if (!showcases.length) return;

    showcases.forEach(showcase => {
      const revealTargets = [
        ...showcase.querySelectorAll(".skills-pipeline-node"),
        ...showcase.querySelectorAll(".skills-inline-chips span"),
        ...showcase.querySelectorAll(".skills-lab-core, .skills-lab-node, .skills-lab-meter"),
        ...showcase.querySelectorAll(".skills-insight-card, .skills-insight-callout, .skills-insight-bar")
      ];

      if (revealTargets.length) {
        gsap.from(revealTargets, {
          opacity: 0,
          y: 28,
          scale: 0.96,
          duration: 0.58,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: showcase,
            start: "top 82%",
            once: true
          }
        });
      }

      const heroElement = showcase.querySelector(".skills-pipeline-grid, .skills-lab-field, .skills-insight-screen");
      if (heroElement) {
        gsap.from(heroElement, {
          opacity: 0,
          scale: 0.94,
          duration: 0.72,
          ease: "power3.out",
          scrollTrigger: {
            trigger: showcase,
            start: "top 84%",
            once: true
          }
        });
      }

      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

      const parallaxTargets = [
        ...showcase.querySelectorAll(".skills-pipeline-node, .skills-pipeline-packet"),
        ...showcase.querySelectorAll(".skills-lab-core, .skills-lab-node, .skills-lab-meter"),
        ...showcase.querySelectorAll(".skills-insight-card, .skills-insight-callout")
      ];

      showcase.addEventListener("mousemove", event => {
        const rect = showcase.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;

        parallaxTargets.forEach((target, index) => {
          const depth = (index % 4) + 1;
          gsap.to(target, {
            x: px * depth * 8,
            y: py * depth * 6,
            duration: 0.6,
            ease: "power2.out",
            overwrite: true
          });
        });
      });

      showcase.addEventListener("mouseleave", () => {
        gsap.to(parallaxTargets, {
          x: 0,
          y: 0,
          duration: 0.75,
          ease: "power3.out",
          overwrite: true
        });
      });
    });
  }

  function setupSkillsAtlasScreen() {
    const atlas = document.querySelector(".skills-atlas");
    const scene = document.getElementById("laptopScene");

    // Populate the three Root boxes on the laptop screen.
    const screenCards = atlas ? [...atlas.querySelectorAll(".skills-screen-grid .skills-screen-card")] : [];
    const branchesForContent = atlas ? [...atlas.querySelectorAll(".skills-atlas-branches .skills-branch")] : [];

    if (atlas && screenCards.length >= 3 && branchesForContent.length >= 3) {
      screenCards.slice(0, 3).forEach((card, index) => {
        const content = card.querySelector(".skills-screen-root-content");
        if (!content) return;

        const branch = branchesForContent[index];
        if (!branch) return;

        const fullDescEl = branch.querySelector("h3")?.nextElementSibling ?? null;
        const orbitNodes = branch ? [...branch.querySelectorAll(".skills-branch-orbit .skills-branch-node")] : [];

        content.innerHTML = "";

        const full = document.createElement("p");
        full.className = "skills-screen-root-full";
        full.textContent = fullDescEl?.textContent?.trim() ?? "";
        content.appendChild(full);

        const chips = document.createElement("div");
        chips.className = "skills-screen-root-chips";

        orbitNodes.forEach(node => {
          const t = (node.textContent || "").trim();
          if (!t) return;
          const chip = document.createElement("span");
          chip.className = "skills-screen-root-chip";
          chip.textContent = t;
          chips.appendChild(chip);
        });

        content.appendChild(chips);
      });
    }

    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;

    const laptop = document.getElementById("skillsLaptop");
    const lid = document.getElementById("laptopLid");
    const rear = scene?.querySelector(".skills-computer-rear") ?? null;
    const base = scene?.querySelector(".skills-computer-base") ?? null;
    const screen = scene?.querySelector(".skills-computer-screen") ?? null;
    const cables = atlas?.querySelector(".skills-atlas-cables") ?? null;
    const shadow = scene?.querySelector(".skills-laptop-shadow") ?? null;
    const glow = scene?.querySelector(".skills-machine-glow") ?? null;
    const sockets = atlas ? [...atlas.querySelectorAll(".skills-screen-grid .skills-card-socket")] : [];
    const branches = screenCards;
    const cableShells = cables ? [...cables.querySelectorAll(".skills-cable-shell")] : [];
    const cableCores = cables ? [...cables.querySelectorAll(".skills-cable-core")] : [];
    const cablePlugs = cables ? [...cables.querySelectorAll(".skills-cable-plug")] : [];
    const prefersCompact = window.matchMedia("(max-width: 720px)").matches;
    // Apple-style opening: swing the lid further open and feel more “alive”
    // while remaining scroll-scrubbed.
    const CLOSED_DEG = prefersCompact ? -158 : -170;
    const OPEN_DEG = 12;

    if (!atlas || !scene || !lid || !laptop) return;

    const clamp = value => Math.min(1, Math.max(0, value));
    const easeOutCubic = value => 1 - Math.pow(1 - value, 3);
    const easeInOutCubic = value => (
      value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2
    );

    // Re-map cable geometry so the cords visually originate from the laptop rear
    // and end at each root socket (more “real cords” feel).
    if (rear && cables && sockets.length >= 3 && cableShells.length >= 3 && cableCores.length >= 3 && cablePlugs.length >= 3) {
      const svgRect = cables.getBoundingClientRect();
      const vb = cables.viewBox?.baseVal;
      const vbW = vb?.width || 1000;
      const vbH = vb?.height || 560;

      const toViewBox = (x, y) => ({
        x: ((x - svgRect.left) / svgRect.width) * vbW,
        y: ((y - svgRect.top) / svgRect.height) * vbH
      });

      const rearRect = rear.getBoundingClientRect();
      const start = toViewBox(rearRect.left + rearRect.width / 2, rearRect.top + rearRect.height / 2);

      const side = [-1, 0, 1];
      const makePathD = (end, sideDir) => {
        const deltaY = Math.max(40, end.y - start.y);
        const bendY = deltaY * 0.34;
        const bendX = 120 * sideDir;
        const cp1x = start.x + bendX;
        const cp1y = start.y + bendY;
        const cp2x = end.x - bendX;
        const cp2y = end.y - bendY;
        return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
      };

      for (let i = 0; i < 3; i += 1) {
        const sRect = sockets[i].getBoundingClientRect();
        const end = toViewBox(sRect.left + sRect.width / 2, sRect.top + sRect.height / 2);
        const d = makePathD(end, side[i]);
        cableShells[i].setAttribute("d", d);
        cableCores[i].setAttribute("d", d);
        cablePlugs[i].setAttribute("cx", `${end.x}`);
        cablePlugs[i].setAttribute("cy", `${end.y}`);
      }
    }

    const shellLengths = cableShells.map(path => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      return length;
    });

    cableCores.forEach(path => {
      path.style.opacity = "0";
    });

    cablePlugs.forEach(plug => {
      plug.style.opacity = "0";
      plug.style.transformOrigin = "center center";
      plug.style.transformBox = "fill-box";
      plug.style.transform = "scale(0.6)";
    });

    const setAngle = deg => {
      scene.style.setProperty("--lid-angle", `${deg}deg`);
      // Activate screen content slightly earlier so the chamber text/chips
      // appear together with the opening motion.
      atlas.classList.toggle("screen-live", deg > -104);
    };

    const applyProgress = rawProgress => {
      const progress = clamp(rawProgress);
      const lidProgress = easeInOutCubic(clamp(progress * 1.06));
      const chassisProgress = easeOutCubic(clamp((progress - 0.04) / 0.96));
      // Start the cord energizing earlier so it visually “extends down”.
      const cableProgress = easeOutCubic(clamp((progress - 0.14) / 0.62));
      const socketProgress = easeOutCubic(clamp((progress - 0.34) / 0.38));

      const angle = CLOSED_DEG + (OPEN_DEG - CLOSED_DEG) * lidProgress;
      setAngle(angle);

      scene.style.setProperty("--laptop-rotate-x", `${18 - 15 * chassisProgress}deg`);
      scene.style.setProperty("--laptop-rotate-y", `${-8 + 7 * chassisProgress}deg`);
      scene.style.setProperty("--laptop-rotate-z", `${-1.5 + 1.5 * chassisProgress}deg`);
      scene.style.setProperty("--laptop-shift-y", `${82 - 82 * chassisProgress}px`);
      scene.style.setProperty("--laptop-scale", `${0.9 + 0.1 * chassisProgress}`);

      if (rear) {
        scene.style.setProperty("--rear-rise", `${-34 + 34 * chassisProgress}px`);
        scene.style.setProperty("--rear-opacity", `${0.18 + 0.82 * cableProgress}`);
      }

      if (base) {
        scene.style.setProperty("--base-rise", `${26 - 26 * chassisProgress}px`);
      }

      if (screen) {
        scene.style.setProperty("--screen-lift", `${16 - 16 * chassisProgress}px`);
        scene.style.setProperty("--screen-brightness", `${0.76 + 0.3 * chassisProgress}`);
      }

      if (cables) {
        atlas.style.setProperty("--cables-opacity", `${0.28 + 0.72 * cableProgress}`);
        atlas.style.setProperty("--cables-rise", "0px");
        atlas.style.setProperty("--cables-scale", "1");
      }

      if (shadow) {
        scene.style.setProperty("--shadow-opacity", `${0.08 + 0.22 * chassisProgress}`);
        scene.style.setProperty("--shadow-scale-x", `${0.66 + 0.38 * chassisProgress}`);
        scene.style.setProperty("--shadow-scale-y", `${0.56 + 0.44 * chassisProgress}`);
      }

      sockets.forEach(socket => {
        socket.style.setProperty("--socket-scale", `${0.88 + 0.12 * socketProgress}`);
        socket.style.setProperty("--socket-opacity", `${0.36 + 0.64 * socketProgress}`);
      });

      cableShells.forEach((path, index) => {
        const delay = index === 1 ? 0.045 : index === 2 ? 0.09 : 0;
        const local = easeOutCubic(clamp((cableProgress - delay) / (1 - delay)));
        // Earlier thresholds so the cords/plugs feel engaged sooner.
        const energized = clamp((local - 0.46) / 0.46);
        const connected = clamp((local - 0.66) / 0.28);

        if (shellLengths[index]) {
          path.style.strokeDashoffset = `${shellLengths[index] * (1 - local)}`;
          path.style.opacity = `${0.26 + 0.68 * local}`;
        }

        if (cableCores[index]) {
          cableCores[index].style.opacity = `${energized}`;
        }

        if (cablePlugs[index]) {
          cablePlugs[index].style.opacity = `${connected}`;

          // Slide the plug along the cable as it draws.
          // `local=0` => start (rear). `local=1` => end (socket).
          const travel = shellLengths[index] ? shellLengths[index] * local : 0;
          const pt = path.getPointAtLength(travel);
          cablePlugs[index].setAttribute("cx", `${pt.x}`);
          cablePlugs[index].setAttribute("cy", `${pt.y}`);

          cablePlugs[index].style.transform = `scale(${0.6 + 0.4 * connected})`;
        }

        if (screenCards[index]) {
          screenCards[index].classList.toggle("is-connected", connected > 0.78);
        }
      });

      atlas.classList.toggle("screen-live", progress > 0.44);
      if (glow) {
        glow.style.opacity = `${0.58 + 0.38 * cableProgress}`;
        glow.style.transform = `translateY(${-10 * cableProgress}px) scale(${0.9 + 0.18 * chassisProgress})`;
      }
    };

    applyProgress(0);

    const state = { progress: 0 };
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: scene,
        // Open earlier as soon as the laptop enters the viewport.
        start: prefersCompact ? "top 98%" : "top 96%",
        end: prefersCompact ? "bottom 56%" : "bottom 38%",
        scrub: 0.82
      }
    }).to(state, {
      progress: 1,
      onUpdate: () => applyProgress(state.progress)
    });

    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    scene.addEventListener("mousemove", event => {
      const rect = scene.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const currentProgress = state.progress;

      gsap.to(scene, {
        "--laptop-rotate-y": `${-8 + 7 * easeOutCubic(currentProgress) + px * 6}deg`,
        "--laptop-rotate-x": `${18 - 15 * easeOutCubic(currentProgress) - py * 4}deg`,
        duration: 0.45,
        overwrite: true,
        ease: "power2.out"
      });

      if (glow) {
        gsap.to(glow, {
          x: px * 28,
          y: py * 18,
          duration: 0.5,
          overwrite: true,
          ease: "power2.out"
        });
      }
    });

    scene.addEventListener("mouseleave", () => {
      const currentProgress = easeOutCubic(state.progress);
      gsap.to(scene, {
        "--laptop-rotate-y": `${-8 + 7 * currentProgress}deg`,
        "--laptop-rotate-x": `${18 - 15 * currentProgress}deg`,
        duration: 0.65,
        overwrite: true,
        ease: "power3.out"
      });

      if (glow) {
        gsap.to(glow, {
          x: 0,
          y: 0,
          duration: 0.7,
          overwrite: true,
          ease: "power3.out"
        });
      }
    });
  }

  function setupSkillsConnectors() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;
    const grid = document.querySelector(".skills-grid");
    const svg = grid?.querySelector(".skills-grid-network-svg") ?? null;
    const rootCards = grid ? [...grid.querySelectorAll(".skills-root-card")] : [];
    const supportCards = grid ? [...grid.querySelectorAll(".skills-support-card")] : [];
    const bridgeCard = grid?.querySelector(".skills-bridge-card") ?? null;

    // If the grid is hidden (we're in “laptop-only roots” mode), skip building
    // connector geometry to avoid 0-sized bounding rect math.
    if (!grid) return;
    const r = grid.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;

    if (!svg || rootCards.length < 3 || supportCards.length < 3 || !bridgeCard) return;

    let connectorAnimated = false;

    const relativePoint = (element, vertical = "center") => {
      const gridRect = grid.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      const yMap = {
        top: rect.top - gridRect.top,
        center: rect.top - gridRect.top + rect.height / 2,
        bottom: rect.bottom - gridRect.top
      };
      return {
        x: rect.left - gridRect.left + rect.width / 2,
        y: yMap[vertical] ?? yMap.center
      };
    };

    const cubicPath = (start, end, bend = 42) => {
      const cp1y = start.y + bend;
      const cp2y = end.y - bend;
      return `M ${start.x} ${start.y} C ${start.x} ${cp1y}, ${end.x} ${cp2y}, ${end.x} ${end.y}`;
    };

    const setLineState = () => {
      const paths = [...svg.querySelectorAll(".skills-grid-path")];
      const flows = [...svg.querySelectorAll(".skills-grid-flowline")];
      const nodes = [...svg.querySelectorAll(".skills-grid-node, .skills-grid-pulse")];
      paths.forEach(path => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = connectorAnimated ? "0" : `${length}`;
      });
      flows.forEach(flow => {
        flow.style.opacity = connectorAnimated ? "1" : "0";
      });
      nodes.forEach(node => {
        node.style.opacity = connectorAnimated ? "1" : "0";
        node.style.transform = connectorAnimated ? "scale(1)" : "scale(0.7)";
        node.style.transformBox = "fill-box";
        node.style.transformOrigin = "center";
      });

      if (connectorAnimated) {
        const secondary = svg.querySelectorAll(".skills-grid-path.is-secondary");
        if (secondary.length) {
          gsap.to(secondary, {
            strokeDashoffset: -28,
            duration: 2.6,
            repeat: -1,
            ease: "none",
            overwrite: true
          });
        }
      }
    };

    const buildNetwork = () => {
      if (window.innerWidth <= 1160) {
        grid.classList.remove("network-active");
        svg.innerHTML = "";
        return;
      }

      grid.classList.add("network-active");
      const width = grid.clientWidth;
      const height = grid.clientHeight;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const roots = rootCards.map(card => relativePoint(card, "bottom"));
      const supports = supportCards.map(card => relativePoint(card, "top"));
      const bridgeTop = relativePoint(bridgeCard, "top");
      const busY = Math.min(...supports.map(point => point.y)) - 26;
      const lowerHub = { x: bridgeTop.x, y: bridgeTop.y - 24 };
      const centerHub = { x: roots[1].x, y: busY };

      const branchPaths = roots.map(root => cubicPath(root, { x: root.x, y: busY }, 22));
      const supportPaths = supports.map(support => cubicPath({ x: support.x, y: busY }, support, 22));
      const topBus = `M ${roots[0].x} ${busY} C ${roots[0].x + 110} ${busY}, ${roots[2].x - 110} ${busY}, ${roots[2].x} ${busY}`;
      const trunk = cubicPath(centerHub, lowerHub, 50);
      const bridgeFeed = cubicPath(lowerHub, bridgeTop, 22);

      svg.innerHTML = `
        <path class="skills-grid-path is-secondary" d="${topBus}"></path>
        ${branchPaths.map(path => `<path class="skills-grid-path" d="${path}"></path>`).join("")}
        ${supportPaths.map(path => `<path class="skills-grid-path" d="${path}"></path>`).join("")}
        <path class="skills-grid-path" d="${trunk}"></path>
        <path class="skills-grid-path is-secondary" d="${bridgeFeed}"></path>
        <path class="skills-grid-flowline" d="${topBus}"></path>
        <path class="skills-grid-flowline flow-delay-a" d="${trunk}"></path>
        <path class="skills-grid-flowline flow-delay-b" d="${bridgeFeed}"></path>
        ${roots.map(point => `<circle class="skills-grid-node" cx="${point.x}" cy="${point.y}" r="5"></circle>`).join("")}
        ${supports.map(point => `<circle class="skills-grid-node" cx="${point.x}" cy="${point.y}" r="5"></circle>`).join("")}
        <circle class="skills-grid-node is-hub" cx="${centerHub.x}" cy="${centerHub.y}" r="6.5"></circle>
        <circle class="skills-grid-pulse" cx="${centerHub.x}" cy="${centerHub.y}" r="13"></circle>
        <circle class="skills-grid-node is-hub" cx="${lowerHub.x}" cy="${lowerHub.y}" r="6"></circle>
        <circle class="skills-grid-pulse" cx="${lowerHub.x}" cy="${lowerHub.y}" r="12"></circle>
        <circle class="skills-grid-node" cx="${bridgeTop.x}" cy="${bridgeTop.y}" r="5"></circle>
      `;

      setLineState();
    };

    const animateNetwork = () => {
      if (connectorAnimated) return;
      connectorAnimated = true;
      const paths = [...svg.querySelectorAll(".skills-grid-path")];
      const flows = [...svg.querySelectorAll(".skills-grid-flowline")];
      const nodes = [...svg.querySelectorAll(".skills-grid-node, .skills-grid-pulse")];

      paths.forEach(path => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
      });

      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 1.05,
        stagger: 0.06,
        ease: "power3.out"
      });

      gsap.to(nodes, {
        opacity: 1,
        scale: 1,
        duration: 0.42,
        stagger: 0.04,
        ease: "back.out(1.8)"
      });

      gsap.to(flows, {
        opacity: 1,
        duration: 0.35,
        stagger: 0.08,
        ease: "power2.out"
      });

      const secondary = svg.querySelectorAll(".skills-grid-path.is-secondary");
      if (secondary.length) {
        gsap.to(secondary, {
          strokeDashoffset: -28,
          duration: 2.6,
          repeat: -1,
          ease: "none"
        });
      }
    };

    buildNetwork();

    ScrollTrigger.create({
      trigger: grid,
      start: "top 74%",
      once: true,
      onEnter: animateNetwork
    });

    window.addEventListener("resize", () => {
      requestAnimationFrame(buildNetwork);
    });
  }

  function setupProjectShowcase() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;

    const fraudGrid = document.querySelector(".fraud-grid");
    if (fraudGrid) {
      fraudGrid.innerHTML = "";
      const cells = [];
      for (let index = 0; index < 240; index += 1) {
        const cell = document.createElement("span");
        cell.className = "fraud-cell";
        fraudGrid.appendChild(cell);
        cells.push(cell);
      }

      const flashFraudCells = () => {
        const flashes = 3 + Math.floor(Math.random() * 3);
        const activeIndexes = new Set();
        while (activeIndexes.size < flashes) {
          activeIndexes.add(Math.floor(Math.random() * cells.length));
        }

        activeIndexes.forEach(index => {
          const cell = cells[index];
          if (!cell) return;
          cell.classList.add("is-hot");
          window.setTimeout(() => cell.classList.remove("is-hot"), 260 + Math.random() * 180);
        });
      };

      flashFraudCells();
      window.setInterval(flashFraudCells, 200);
    }

    const chatMessages = document.querySelector(".chat-messages");
    if (chatMessages) {
      const chatLines = [
        { text: "Running fraud model...", alt: false },
        { text: "Benchmark check complete ✓", alt: true },
        { text: "Anomalies flagged: 1,247", alt: false }
      ];
      const chatTimers = [];
      let chatStarted = false;

      const clearChatTimers = () => {
        while (chatTimers.length) {
          window.clearTimeout(chatTimers.pop());
        }
      };

      const createTypingIndicator = isAlt => {
        const typing = document.createElement("div");
        typing.className = `chat-typing${isAlt ? " alt" : ""}`;
        typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        return typing;
      };

      const runChatLoop = () => {
        clearChatTimers();
        chatMessages.innerHTML = "";
        let cursor = 0;

        chatLines.forEach(line => {
          const typing = createTypingIndicator(line.alt);

          chatTimers.push(window.setTimeout(() => {
            chatMessages.appendChild(typing);
            gsap.fromTo(typing, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" });
          }, cursor));

          chatTimers.push(window.setTimeout(() => {
            const message = document.createElement("div");
            message.className = `chat-message${line.alt ? " alt" : ""}`;
            message.textContent = line.text;
            typing.replaceWith(message);
            gsap.fromTo(message, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
          }, cursor + 560));

          cursor += 1040;
        });

        chatTimers.push(window.setTimeout(runChatLoop, cursor + 4000));
      };

      ScrollTrigger.create({
        trigger: chatMessages.closest(".project-section"),
        start: "top 68%",
        once: true,
        onEnter: () => {
          if (chatStarted) return;
          chatStarted = true;
          runChatLoop();
        }
      });
    }

    const newsTrack = document.querySelector(".news-track");
    if (newsTrack && newsTrack.dataset.duplicated !== "true") {
      [...newsTrack.children].forEach(item => {
        newsTrack.appendChild(item.cloneNode(true));
      });
      newsTrack.dataset.duplicated = "true";
    }

    projectSections.forEach(section => {
      const inner = section.querySelector(".project-inner");
      const copy = section.querySelector(".project-copy");
      const visual = section.querySelector(".work-visual-card");
      if (!copy || !visual) return;

      const isReverse = inner?.classList.contains("reverse");
      const copyOffset = isReverse ? 60 : -60;
      const visualOffset = isReverse ? -60 : 60;

      gsap.set(copy, { x: copyOffset, opacity: 0 });
      gsap.set(visual, { x: visualOffset, opacity: 0 });

      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 74%",
          once: true
        }
      })
        .to(copy, {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out"
        })
        .to(visual, {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out"
        }, 0.08);

      gsap.to(visual, {
        "--float-y": "-12px",
        duration: 4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onEnter: () => updateProjectRail(section.id),
        onEnterBack: () => updateProjectRail(section.id)
      });
    });
  }

  function setupVisualizationGallery() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap } = window;
    const section = document.getElementById("visualizations");
    const heading = section?.querySelector(".section-head h2") ?? null;
    const grid = section?.querySelector(".visual-grid") ?? null;
    const cards = grid ? [...grid.querySelectorAll(".visual-card")] : [];
    if (!section || !heading || !grid || !cards.length) return;

    if (heading.dataset.split !== "true") {
      const chars = [...(heading.textContent || "")];
      heading.textContent = "";
      chars.forEach(char => {
        const span = document.createElement("span");
        span.className = "visual-heading-char";
        span.textContent = char === " " ? "\u00A0" : char;
        heading.appendChild(span);
      });
      heading.dataset.split = "true";
    }

    const headingChars = [...heading.querySelectorAll(".visual-heading-char")];
    gsap.from(headingChars, {
      y: 30,
      opacity: 0,
      stagger: 0.025,
      duration: 0.45,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 74%",
        once: true
      }
    });

    cards.forEach(card => {
      const frame = card.querySelector(".visual-frame");
      if (frame && !frame.querySelector(".visual-overlay")) {
        const titleSource = card.querySelector("h3, .visual-label, .powerbi-embed-meta strong");
        const actionSource = card.querySelector(".visual-actions a");
        const overlay = document.createElement("div");
        const copy = document.createElement("div");
        const title = document.createElement("strong");
        const action = document.createElement("span");
        overlay.className = "visual-overlay";
        overlay.setAttribute("aria-hidden", "true");
        copy.className = "visual-overlay-copy";
        title.textContent = titleSource ? titleSource.textContent.trim() : "";
        action.textContent = actionSource ? actionSource.textContent.trim() : "";
        copy.append(title, action);
        overlay.appendChild(copy);
        frame.appendChild(overlay);
      }
    });

    gsap.from(cards, {
      y: 55,
      opacity: 0,
      stagger: 0.09,
      duration: 0.65,
      ease: "power3.out",
      scrollTrigger: {
        trigger: grid,
        start: "top 82%",
        once: true
      }
    });

    cards.forEach(card => {
      const line = card.querySelector(".visual-line");
      if (!line) return;
      gsap.set(line, { scaleX: 0 });
      gsap.to(line, {
        scaleX: 1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
          once: true
        }
      });
    });

    // D3 gallery cards extra motion
    const d3Cards = grid ? [...grid.querySelectorAll(".d3-card")] : [];
    if (d3Cards.length) {
      gsap.from(d3Cards, {
        opacity: 0,
        y: 55,
        stagger: 0.09,
        duration: 0.65,
        ease: "power3.out",
        scrollTrigger: {
          trigger: d3Cards[0],
          start: "top 82%",
          once: true
        }
      });

      d3Cards.forEach(card => {
        const line = card.querySelector(".visual-line");
        if (!line) return;
        gsap.from(line, {
          scaleX: 0,
          transformOrigin: "left",
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: line,
            start: "top 86%",
            once: true
          }
        });
      });
    }
  }

  function setupLazyD3Iframes() {
    if (reduced) return;
    if (!("IntersectionObserver" in window)) return;
    const iframes = [...document.querySelectorAll("#visualizations iframe.viz-iframe[data-src]")];
    if (!iframes.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const iframe = entry.target;
        const src = iframe.getAttribute("data-src");
        if (!src) return;
        iframe.setAttribute("src", src);
        io.unobserve(iframe);
      });
    }, { rootMargin: "220px 0px", threshold: 0.01 });

    iframes.forEach(iframe => io.observe(iframe));
  }

  function scrollToJourneyStop(target) {
    if (!target || !journeyScrollTrigger || !journeyTrack) {
      scrollToTarget(target);
      return;
    }

    const maxX = Math.max(1, journeyTrack.scrollWidth - window.innerWidth);
    const ratio = Math.min(1, Math.max(0, target.offsetLeft / maxX));
    const destination = journeyScrollTrigger.start + (journeyScrollTrigger.end - journeyScrollTrigger.start) * ratio;

    if (lenis) {
      lenis.scrollTo(destination, { duration: 1.2 });
    } else {
      window.scrollTo({ top: destination, behavior: reduced ? "auto" : "smooth" });
    }
  }

  function setupJourneyMotion() {
    if (reduced || !window.gsap || !window.ScrollTrigger || !journey || !journeyTrack || !journeyStops.length) return;
    // Rebuilt site: rocket canvas scrub zone handles journey intro; avoid conflicting pin.
    if (document.getElementById("journey-rocket-zone")) return;
    if (window.innerWidth <= 768) {
      journey.classList.remove("journey-motion-active");
      journeyScrollTrigger = null;
      return;
    }
    const { gsap, ScrollTrigger } = window;
    journey.classList.add("journey-motion-active");
    const shell = journey.querySelector(".journey-track-shell");
    if (shell) shell.style.overflow = "hidden";

    const maxOffset = () => Math.max(0, journeyTrack.scrollWidth - window.innerWidth);

    // Journey spaceship orbit + "beam" that briefly locks-on when a panel becomes active.
    // Driven off the existing pinned scroll progress for the Journey rail.
    let updateSpaceshipOrbit = () => {};
    let activateJourneyStop = () => {};

    const planet = journey.querySelector(".journey-planet");
    const orbitRing = journey.querySelector(".journey-satellite-orbit");
    const satellite = journey.querySelector(".journey-satellite");
    const beamSvg = journey.querySelector(".journey-beam-svg");
    const beamLine = journey.querySelector(".journey-beam-line");
    const cordSvg = journey.querySelector(".journey-cord-svg");
    const cordPath = journey.querySelector(".journey-cord-path");
    const cordPlug = journey.querySelector(".journey-cord-plug");
    const ambient = journey.querySelector(".journey-ambient");

    if (planet && orbitRing && satellite && beamSvg && beamLine && cordSvg && cordPath && cordPlug && ambient) {
      const clamp01 = v => Math.min(1, Math.max(0, v));
      const startAngle = -Math.PI / 2;
      const rotations = 1.6;

      const geom = {
        ambientW: 1,
        ambientH: 1,
        cxPct: 50,
        cyPct: 50,
        rxPx: 170,
        ryPx: 110
      };

      const recalcOrbitGeometry = () => {
        const ambientRect = ambient.getBoundingClientRect();
        const planetRect = planet.getBoundingClientRect();
        if (!ambientRect.width || !ambientRect.height) return;

        geom.ambientW = ambientRect.width;
        geom.ambientH = ambientRect.height;

        geom.cxPct = ((planetRect.left + planetRect.width / 2 - ambientRect.left) / ambientRect.width) * 100;
        geom.cyPct = ((planetRect.top + planetRect.height / 2 - ambientRect.top) / ambientRect.height) * 100;

        const base = Math.min(ambientRect.width, ambientRect.height);
        geom.rxPx = base * 0.22;
        geom.ryPx = base * 0.13;
      };

      recalcOrbitGeometry();
      window.addEventListener("resize", recalcOrbitGeometry, { passive: true });

      const stopCount = journeyStops.length;
      const segmentSize = stopCount > 1 ? 1 / (stopCount - 1) : 1;
      let lastActiveIndex = -1;

      const cableState = {
        length: 0,
        tStart: 0,
        tEnd: 0
      };

      updateSpaceshipOrbit = rawProgress => {
        const progress = clamp01(rawProgress);
        const angle = startAngle + progress * (Math.PI * 2 * rotations);
        const angleDeg = angle * (180 / Math.PI);

        // Rotate the orbit ring (CodePen-style orbit) to drive the satellite path.
        orbitRing.style.setProperty("--orbit-deg", `${angleDeg}deg`);

        // Squashed Y orbit for beam/cord calculations.
        const xPx = Math.cos(angle) * geom.rxPx;
        const yPx = Math.sin(angle) * geom.ryPx;

        const xPct = geom.cxPct + (xPx / geom.ambientW) * 100;
        const yPct = geom.cyPct + (yPx / geom.ambientH) * 100;

        beamLine.setAttribute("x1", `${geom.cxPct}`);
        beamLine.setAttribute("y1", `${geom.cyPct}`);
        beamLine.setAttribute("x2", `${xPct}`);
        beamLine.setAttribute("y2", `${yPct}`);

        // Map progress to [0..stopCount-1] so every Journey panel gets time,
        // not just the last one at progress === 1.
        const activeIndex = Math.min(stopCount - 1, Math.max(0, Math.round(progress * (stopCount - 1))));
        if (activeIndex !== lastActiveIndex) {
          lastActiveIndex = activeIndex;
          const stop = journeyStops[activeIndex];
          activateJourneyStop(stop, activeIndex, progress);
        }

        if (cableState.length > 0) {
          const denom = cableState.tEnd - cableState.tStart || 1;
          const t = clamp01((progress - cableState.tStart) / denom);
          const remaining = cableState.length * (1 - t);
          cordPath.style.strokeDashoffset = String(remaining);
          const pt = cordPath.getPointAtLength(Math.max(0, cableState.length - remaining));
          cordPlug.setAttribute("cx", String(pt.x));
          cordPlug.setAttribute("cy", String(pt.y));

          // Fade cord once it finishes the current segment.
          cordSvg.style.opacity = t >= 1 ? "0" : "1";
        }
      };

      const setupCordToStop = (stop, progress) => {
        if (!stop || stopCount < 2) return;

        // Skip cords for the first "Overview" so the effect feels intentional.
        const idx = journeyStops.indexOf(stop);
        if (idx <= 0) {
          cordSvg.style.opacity = "0";
          cableState.length = 0;
          cordPath.style.strokeDashoffset = "1";
          return;
        }

        const ambientRect = ambient.getBoundingClientRect();
        const stopRect = stop.getBoundingClientRect();

        if (!ambientRect.width || !ambientRect.height || !stopRect.width || !stopRect.height) return;

        const startX = geom.cxPct;
        const startY = geom.cyPct;

        const endX = ((stopRect.left + stopRect.width / 2 - ambientRect.left) / ambientRect.width) * 100;
        const endY = ((stopRect.top + stopRect.height / 2 - ambientRect.top) / ambientRect.height) * 100;

        const cpX = (startX + endX) / 2;
        const cpY = Math.min(startY, endY) - 18;

        cordPath.setAttribute("d", `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`);

        // Prepare dash + plug at the start point.
        const length = cordPath.getTotalLength();
        cableState.length = length;
        cableState.tStart = progress;
        cableState.tEnd = Math.min(1, progress + segmentSize * 0.9);

        cordPath.style.strokeDasharray = String(length);
        cordPath.style.strokeDashoffset = String(length);

        const pt0 = cordPath.getPointAtLength(0);
        cordPlug.setAttribute("cx", String(pt0.x));
        cordPlug.setAttribute("cy", String(pt0.y));
        cordSvg.style.opacity = "1";
      };

      activateJourneyStop = (stop, activeIndex, progress) => {
        if (!stop) return;

        journeyStops.forEach(s => s.classList.remove("journey-ship-active"));
        stop.classList.add("journey-ship-active");

        satellite.classList.add("is-engaged");

        // Brief "pop" on the panel when the ship locks on.
        gsap.killTweensOf(stop);
        gsap.fromTo(
          stop,
          { y: 0 },
          {
            y: -12,
            duration: 0.24,
            ease: "power2.out",
            overwrite: true,
            onComplete: () => gsap.to(stop, { y: 0, duration: 0.42, ease: "power3.out", overwrite: true })
          }
        );

        // Keep the beam as a subtle visual lock, but the thick cord is the main "connecting" element.
        gsap.killTweensOf(beamSvg);
        gsap.killTweensOf(beamLine);
        beamSvg.style.opacity = "1";
        gsap.fromTo(
          beamLine,
          { strokeWidth: 1.6 },
          { strokeWidth: 3.2, duration: 0.28, ease: "power2.out", overwrite: true }
        );
        gsap.to(beamSvg, { opacity: 0, duration: 0.7, ease: "power3.out", overwrite: true });

        setupCordToStop(stop, progress);

        gsap.delayedCall(0.7, () => satellite.classList.remove("is-engaged"));
      };
    }

    const journeyTween = gsap.to(journeyTrack, {
      x: () => -maxOffset(),
      ease: "none",
      scrollTrigger: {
        trigger: "#journey",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        end: () => `+=${Math.max(maxOffset(), window.innerWidth)}`
      },
      onUpdate: function () {
        // `this.progress()` is 0..1 across the pinned scroll span.
        updateSpaceshipOrbit(this.progress());
      }
    });

    journeyScrollTrigger = journeyTween.scrollTrigger;

    updateSpaceshipOrbit(0);

    journeyStops.forEach(stop => {
      ScrollTrigger.create({
        trigger: stop,
        containerAnimation: journeyTween,
        start: "left center",
        end: "right center",
        onEnter: () => {
          updateJourneyRail(stop.dataset.panel || "");
        },
        onEnterBack: () => {
          updateJourneyRail(stop.dataset.panel || "");
        }
      });
    });

    const overview = document.getElementById("journey-overview");
    const overviewCounts = overview ? [...overview.querySelectorAll(".count-up")] : [];
    if (overview && overviewCounts.length) {
      ScrollTrigger.create({
        trigger: overview,
        containerAnimation: journeyTween,
        start: "center center",
        once: true,
        onEnter: () => {
          overviewCounts.forEach(item => animateCountUpItem(item));
        }
      });
    }

    document.querySelectorAll(".journey-node").forEach(node => {
      const dot = node.querySelector(".journey-node-dot");
      const line = node.querySelector(".journey-node-line");
      const stop = node.closest(".journey-stop");
      if (!dot || !line || !stop) return;

      gsap.set(dot, { scale: 0.72, opacity: 0.7 });
      gsap.set(line, { scaleY: 0 });

      gsap.timeline({
        scrollTrigger: {
          trigger: stop,
          containerAnimation: journeyTween,
          start: "left 64%",
          once: true
        }
      })
        .to(dot, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out"
        })
        .to(line, {
          scaleY: 1,
          duration: 0.45,
          ease: "power2.out"
        }, "-=0.05");
    });

    const nextCard = document.querySelector(".journey-next-card");
    if (nextCard) {
      const pulse = gsap.to(nextCard, {
        opacity: 1,
        duration: 2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        paused: true
      });

      gsap.from(nextCard, {
        x: 80,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: nextCard,
          containerAnimation: journeyTween,
          start: "left 76%",
          once: true,
          onEnter: () => pulse.play()
        }
      });
    }
  }

  function setupMicroInteractions() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;

    const pressables = [
      ...document.querySelectorAll("button"),
      ...document.querySelectorAll(".btn, .btn-soft, .signal-link, .project-open, .resume-link, .nav-icon-link")
    ];
    const uniquePressables = [...new Set(pressables)];

    uniquePressables.forEach(element => {
      const press = () => {
        gsap.to(element, { scale: 0.95, duration: 0.12, ease: "power2.out", overwrite: true });
      };
      const release = () => {
        gsap.to(element, { scale: 1, duration: 0.38, ease: "back.out(2)", overwrite: true });
      };

      element.addEventListener("pointerdown", press);
      element.addEventListener("pointerup", release);
      element.addEventListener("pointerleave", release);
      element.addEventListener("pointercancel", release);
    });

    navLinks.forEach(link => {
      link.addEventListener("mouseenter", () => {
        gsap.to(link, { y: -2, color: "var(--orange)", duration: 0.15, overwrite: true });
      });
      link.addEventListener("mouseleave", () => {
        gsap.to(link, {
          y: link.classList.contains("active") ? -2 : 0,
          color: getNavLinkBaseColor(link),
          duration: 0.15,
          overwrite: true
        });
      });
    });

    brandBadges.forEach(badge => {
      badge.addEventListener("mouseenter", () => {
        gsap.killTweensOf(badge);
        gsap.set(badge, { rotate: 0 });
        gsap.to(badge, {
          rotate: 360,
          duration: 0.55,
          ease: "power2.inOut",
          overwrite: true,
          onComplete: () => gsap.set(badge, { rotate: 0 })
        });
      });
    });

    const eyebrowTargets = [
      ...document.querySelectorAll(".section-head .section-kicker"),
      ...document.querySelectorAll(".work-intro .section-kicker"),
      ...document.querySelectorAll(".journey-head .section-kicker"),
      ...document.querySelectorAll(".resume-kicker")
    ];

    [...new Set(eyebrowTargets)].forEach(label => {
      gsap.from(label, {
        letterSpacing: "0.05em",
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
        scrollTrigger: {
          trigger: label,
          start: "top 88%",
          once: true
        }
      });
    });

    if (resumePanel) {
      // Keep resume readable even if ScrollTrigger doesn't fire for any reason.
      gsap.set(resumePanel, { opacity: 1, scale: 1 });
      gsap.from(resumePanel, {
        scale: 0.96,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: resumePanel,
          start: "top 82%",
          once: true
        },
        immediateRender: false
      });
    }

    if (footer) {
      const footerColumns = [...footer.querySelectorAll(".footer-column")];
      const footerBottomGroup = [footer.querySelector(".footer-divider"), footer.querySelector(".footer-bottom")].filter(Boolean);

      if (footerColumns.length) {
        gsap.from(footerColumns, {
          y: 28,
          opacity: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footer,
            start: "top 82%",
            once: true
          }
        });
      }

      if (footerBottomGroup.length) {
        gsap.from(footerBottomGroup, {
          y: 24,
          opacity: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: footer,
            start: "top 76%",
            once: true
          }
        });
      }
    }
  }

  function typeSignalBody() {
    if (!signalBody) return;
    const fullText = signalBody.textContent || "";
    if (!fullText) return;
    signalBody.textContent = "";
    if (heroTypeTimer) window.clearTimeout(heroTypeTimer);
    let index = 0;
    const step = () => {
      signalBody.textContent = fullText.slice(0, index);
      index += 1;
      if (index <= fullText.length) {
        heroTypeTimer = window.setTimeout(step, 16);
      }
    };
    step();
  }

  function setupHeroWordCycle() {
    if (!heroWord || !window.gsap) return;
    if (heroWordTimer) window.clearInterval(heroWordTimer);
    heroWord.style.opacity = "1";
    heroWord.style.transform = "translateY(0%)";
    heroWordTimer = window.setInterval(() => {
      heroWordIndex = (heroWordIndex + 1) % heroWords.length;
      const nextWord = heroWords[heroWordIndex];
      const tl = window.gsap.timeline();
      tl.to(heroWord, {
        yPercent: -100,
        opacity: 0,
        duration: 0.38,
        ease: "power3.inOut"
      })
        .call(() => {
          heroWord.textContent = nextWord;
          window.gsap.set(heroWord, { yPercent: 100 });
        })
        .to(heroWord, {
          yPercent: 0,
          opacity: 1,
          duration: 0.38,
          ease: "power3.out"
        }, "+=0.1");
    }, 3000);
  }

  function setupHeroParallax() {
    if (!heroTitle || !window.gsap) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    document.addEventListener("mousemove", event => {
      const dx = (event.clientX / window.innerWidth - 0.5) * 14;
      const dy = (event.clientY / window.innerHeight - 0.5) * 7;
      window.gsap.to(heroTitle, { x: dx, y: dy, duration: 0.9, ease: "power2.out", overwrite: true });
    }, { passive: true });
  }

  function setupScrollReveals() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;

    // Eyebrow / kicker labels
    gsap.utils.toArray(".section-kicker, .section-head .eyebrow, .terminal-label").forEach(el => {
      gsap.from(el, {
        opacity: 0,
        letterSpacing: "0.04em",
        duration: 0.7,
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true
        }
      });
    });

    // Section h2 headings
    gsap.utils.toArray(".section-head h2, .journey-head h2").forEach(h2 => {
      if (h2.dataset.split === "true") return;
      const words = (h2.innerText || "").split(" ");
      h2.innerHTML = words.map(w => {
        if (!w) return "";
        return `<span style="display:inline-block;overflow:hidden"><span class="h2w" style="display:inline-block">${w}</span></span>`;
      }).join(" ");
      h2.dataset.split = "true";
      const wordEls = h2.querySelectorAll(".h2w");
      gsap.from(wordEls, {
        y: "100%",
        opacity: 0,
        duration: 0.65,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: h2,
          start: "top 86%",
          once: true
        }
      });
    });

    // Visualization cards
    gsap.utils.toArray(".visual-grid").forEach(grid => {
      const cards = grid.querySelectorAll(".visual-card");
      if (!cards.length) return;
      gsap.from(cards, {
        opacity: 0,
        y: 55,
        duration: 0.65,
        stagger: 0.09,
        ease: "power3.out",
        scrollTrigger: {
          trigger: grid,
          start: "top 80%",
          once: true
        }
      });
    });

    // Journey timeline cards
    gsap.utils.toArray(".timeline-grid, .timeline-stack").forEach(container => {
      const items = container.querySelectorAll(".timeline");
      if (!items.length) return;
      gsap.from(items, {
        opacity: 0,
        y: 40,
        duration: 0.55,
        stagger: 0.08,
        scrollTrigger: {
          trigger: container,
          start: "top 82%",
          once: true
        }
      });
    });

    // Project sections
    gsap.utils.toArray(".project-section").forEach(section => {
      const copy = section.querySelector(".project-copy");
      const visual = section.querySelector(".work-visual-card");
      if (!copy || !visual) return;
      const isReverse = !!section.querySelector(".project-inner.reverse");
      gsap.from(copy, {
        opacity: 0,
        x: isReverse ? 50 : -50,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true
        }
      });
      gsap.from(visual, {
        opacity: 0,
        x: isReverse ? -50 : 50,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true
        }
      });
    });

    // Recruiter snapshot / metrics count-up (mini, pmetric)
    document.querySelectorAll(".mini strong, .pmetric strong").forEach(el => {
      const raw = (el.textContent || "").trim();
      const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
      const suffix = raw.replace(/[0-9.,]/g, "");
      if (isNaN(num)) return;
      const state = { val: 0 };
      gsap.from(state, {
        val: num,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: function () {
          el.textContent = `${Math.round(state.val)}${suffix}`;
        },
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true
        }
      });
    });

  }

  function setupHeroGrain() {
    if (!heroGrain) return;
    const context = heroGrain.getContext("2d");
    if (!context) return;

    const resize = () => {
      const rect = heroGrain.getBoundingClientRect();
      heroGrain.width = Math.max(1, Math.floor(rect.width));
      heroGrain.height = Math.max(1, Math.floor(rect.height));
      render();
    };

    const render = () => {
      const { width, height } = heroGrain;
      context.clearRect(0, 0, width, height);
      for (let i = 0; i < 2000; i += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const alpha = Math.random() * 0.12;
        context.fillStyle = `rgba(255,255,255,${alpha})`;
        context.fillRect(x, y, 1.5, 1.5);
      }
    };

    resize();
    window.addEventListener("resize", resize);
  }

  function startHeroMotion() {
    if (heroMotionStarted || !window.gsap) return;
    heroMotionStarted = true;
    setupHeroGrain();
    setupHeroParallax();

    splitHeadlineWords();

    const tl = window.gsap.timeline({ defaults: { ease: "power3.out" } });
    const pillItems = heroPills ? heroPills.querySelectorAll(".pill") : [];

    tl.from(".eyebrow", { opacity: 0, y: 20, duration: 0.6 })
      .from(".hw", { y: "110%", opacity: 0, duration: 0.72, stagger: 0.055 }, "-=0.25")
      .from(".summary", { opacity: 0, y: 24, duration: 0.6 }, "-=0.3")
      .from(pillItems, { opacity: 0, y: 14, stagger: 0.07, duration: 0.38 }, "-=0.2")
      .from("#heroTerminal", { opacity: 0, x: 80, scale: 0.96, duration: 0.9, ease: "power3.out", onComplete: typeSignalBody }, 0.35);

    if (!heroWordCycleStarted) {
      heroWordCycleStarted = true;
      setupHeroWordCycle();
    }
  }

  /** Run full hero entrance in final state (for desktop intro: layout resolves under the canvas before crossfade). */
  function startHeroMotionInstantFinal() {
    if (heroMotionStarted || !window.gsap) return;
    heroMotionStarted = true;
    setupHeroGrain();
    setupHeroParallax();
    splitHeadlineWords();

    const { gsap } = window;
    const pillItems = heroPills ? heroPills.querySelectorAll(".pill") : [];
    const activeMode =
      modeButtons.find(button => button.classList.contains("active"))?.dataset.mode || "builder";
    const bodyFallback = modeData[activeMode]?.body ?? signalBody?.textContent ?? "";

    gsap.set(".eyebrow", { opacity: 1, y: 0 });
    gsap.set(".hw", { y: "0%", opacity: 1 });
    gsap.set(".summary", { opacity: 1, y: 0 });
    gsap.set(pillItems, { opacity: 1, y: 0 });
    gsap.set("#heroTerminal", { opacity: 1, x: 0, scale: 1 });
    if (signalBody) {
      signalBody.textContent = bodyFallback;
    }
    movePillIndicator(modeIndicator, document.querySelector(".switch button.active"), false);
    window.__heroIntroHandoff = true;
  }

  function prepareHeroUnderIntroCanvas() {}

  function initHeroEntrance() {
    if (window.__portfolioIntroExitHandled) {
      if (!heroMotionStarted) {
        heroMotionStarted = true;
        setupHeroGrain();
        setupHeroParallax();
        splitHeadlineWords();
        startHeroMotionInstantFinal();
      }
      if (!heroWordCycleStarted) {
        heroWordCycleStarted = true;
        setupHeroWordCycle();
      }
      window.dispatchEvent(new Event("portfolio-hero-ready"));
      return;
    }
    if (heroMotionStarted) {
      if (!heroWordCycleStarted) {
        heroWordCycleStarted = true;
        setupHeroWordCycle();
      }
    } else {
      startHeroMotion();
    }
    window.dispatchEvent(new Event("portfolio-hero-ready"));
  }

  function setupVizFallbacks() {
    const shells = [...document.querySelectorAll(".visual-frame")];
    if (!shells.length) return;

    const activateFrame = frameShell => {
      const frame = frameShell.querySelector("iframe");
      const fallback = frameShell.querySelector(".viz-fallback");
      if (!frame || !fallback || frame.dataset.activated === "true") return;

      frame.dataset.activated = "true";
      let settled = false;
      const fail = () => {
        if (settled) return;
        settled = true;
        frame.hidden = true;
        fallback.hidden = false;
      };
      const pass = () => {
        if (settled) return;
        settled = true;
        fallback.hidden = true;
      };

      frame.addEventListener("load", pass, { once: true });
      frame.addEventListener("error", fail, { once: true });

      const src = frame.dataset.src;
      if (src && !frame.getAttribute("src")) {
        frame.setAttribute("src", src);
      }

      window.setTimeout(() => {
        if (!settled) fail();
      }, 3500);
    };

    if (!("IntersectionObserver" in window)) {
      shells.forEach(activateFrame);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        activateFrame(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "300px 0px" });

    shells.forEach(shell => observer.observe(shell));
  }

  function fitResumeToOnePage() {
    const resume = document.getElementById("resume");
    const page = document.querySelector("#resume .resume-page");
    if (!resume || !page) return;
    const previous = {
      display: resume.style.display,
      position: resume.style.position,
      visibility: resume.style.visibility,
      left: resume.style.left,
      top: resume.style.top,
      width: resume.style.width
    };
    resume.style.display = "block";
    resume.style.position = "absolute";
    resume.style.visibility = "hidden";
    resume.style.left = "-10000px";
    resume.style.top = "0";
    const pageHeightIn = 11;
    const pageWidthIn = 8.5;
    const marginIn = 1.5 / 2.54;
    const printableHeightPx = (pageHeightIn - marginIn * 2) * 96;
    const printableWidthIn = pageWidthIn - marginIn * 2;
    resume.style.width = `${printableWidthIn}in`;
    page.style.transform = "";
    page.style.transformOrigin = "top center";
    page.style.marginBottom = "";
    const height = page.scrollHeight;
    let scale = 1;
    if (height > printableHeightPx) scale = Math.max(0.78, printableHeightPx / height);
    page.style.transform = `scale(${scale.toFixed(3)})`;
    page.style.marginBottom = `-${(1 - scale) * height}px`;
    resume.style.display = previous.display;
    resume.style.position = previous.position;
    resume.style.visibility = previous.visibility;
    resume.style.left = previous.left;
    resume.style.top = previous.top;
    resume.style.width = previous.width;
  }

  function clearResumeScale() {
    const page = document.querySelector("#resume .resume-page");
    if (!page) return;
    page.style.transform = "";
    page.style.transformOrigin = "";
    page.style.marginBottom = "";
  }

  let printing = false;
  let printTimer = null;

  function restoreResume() {
    if (!printing) return;
    if (printTimer) {
      clearTimeout(printTimer);
      printTimer = null;
    }
    clearResumeScale();
    printing = false;
  }

  function printResume() {
    if (printing) return;
    printing = true;
    fitResumeToOnePage();
    window.addEventListener("afterprint", restoreResume, { once: true });
    window.addEventListener("focus", restoreResume, { once: true });
    printTimer = window.setTimeout(restoreResume, 4000);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }

  function setupLenis() {
    if (!window.Lenis || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger, Lenis } = window;
    gsap.registerPlugin(ScrollTrigger);
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    lenis.on("scroll", updateNavState);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    gsap.to("#scroll-progress", {
      width: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3
      }
    });
    gsapScrollProgress = true;
  }

  /** Called from intro handoff so the home view is always at scroll top (Lenis + native fallback). */
  window.portfolioForceScrollTop = function portfolioForceScrollTop() {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  function setupPreloader() {
    const finish = () => {
      initHeroEntrance();
    };

    const desktopIntro =
      !reduced &&
      document.getElementById("intro-canvas") &&
      !window.matchMedia("(max-width: 767px)").matches;

    // Desktop canvas intro: hero resolves to final layout under the intro before crossfade (see index.html timers).
    if (desktopIntro) {
      prepareHeroUnderIntroCanvas();
      window.addEventListener("intro-complete", finish, { once: true });
      return;
    }

    // Mobile poster / no intro canvas: wait for intro-complete if poster path still runs.
    if (!reduced && document.getElementById("intro-poster")) {
      window.addEventListener("intro-complete", finish, { once: true });
      return;
    }

    finish();
  }

  function setupCustomCursor() {
    if (!customCursor || !customCursorDot) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.innerWidth <= 920) return;
    const { gsap } = window;
    if (!gsap) return;

    document.body.classList.add("cursor-enabled");

    const state = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      currentX: window.innerWidth / 2,
      currentY: window.innerHeight / 2,
      visible: false,
      linkHover: false,
      cardHover: false,
      darkSection: false
    };

    const updateHoverState = target => {
      state.linkHover = Boolean(target?.closest("a, button, [role='button']"));
      state.cardHover = Boolean(target?.closest(".bento-card, .visual-card, .work-visual-card, .journey-stop, .ring-card, .stack"));
      state.darkSection = Boolean(target?.closest("#hero, #visualizations, #journey"));
      customCursor.classList.toggle("is-hover-link", state.linkHover || state.cardHover);
      customCursor.classList.toggle("is-dark", state.darkSection);
    };

    const tick = () => {
      state.currentX += (state.x - state.currentX) * 0.12;
      state.currentY += (state.y - state.currentY) * 0.12;
      customCursor.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0) scale(${state.cardHover ? 3.5 : state.linkHover ? 2.5 : 1})`;
      customCursorDot.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(1)`;
      requestAnimationFrame(tick);
    };

    document.addEventListener("pointermove", event => {
      state.x = event.clientX;
      state.y = event.clientY;
      if (!state.visible) {
        state.visible = true;
        customCursor.classList.add("visible");
        customCursorDot.classList.add("visible");
      }
      updateHoverState(event.target);
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
      state.visible = false;
      customCursor.classList.remove("visible");
      customCursorDot.classList.remove("visible");
    });

    window.addEventListener("blur", () => {
      customCursor.classList.remove("visible");
      customCursorDot.classList.remove("visible");
    });

    requestAnimationFrame(tick);
  }

  setupObservers();

  // Ensure the projects preview panel is populated immediately for the initial active dot.
  const initialProjectLink = projectLinks.find(link => link.classList.contains("active"));
  const initialProjectId = initialProjectLink?.getAttribute("href")?.replace("#", "") ?? projectSections[0]?.id ?? "";
  if (initialProjectId) updateProjectRail(initialProjectId);

  setupVizFallbacks();

  modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      renderMode(button.dataset.mode);
      if (signalBody) {
        window.gsap?.fromTo(signalBody, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" });
      }
      if (signalTags) {
        const tags = signalTags.querySelectorAll(".tag");
        window.gsap?.from(tags, {
          scale: 0.8,
          opacity: 0,
          stagger: 0.04,
          duration: 0.28,
          ease: "back.out(1.4)"
        });
      }
    });
  });
  renderMode("builder");

  if (navToggle) navToggle.addEventListener("click", openMobileNav);
  if (navClose) navClose.addEventListener("click", closeMobileNav);
  if (mobileNav) {
    mobileNav.addEventListener("click", event => {
      if (event.target === mobileNav) closeMobileNav();
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", event => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      if (target.closest("#journey-track")) {
        scrollToJourneyStop(target);
      } else {
        scrollToTarget(target);
      }
      closeMobileNav();
    });
  });

  pdfButtons.forEach(button => button.addEventListener("click", printResume));
  window.printResume = printResume;

  window.addEventListener("resize", () => {
    movePillIndicator(modeIndicator, document.querySelector(".switch button.active"));
    moveNavIndicator(document.querySelector(".nav-link.active"));
    if (window.innerWidth > 920) closeMobileNav();
  });

  window.addEventListener("scroll", () => {
    if (!lenis) {
      updateProgress();
      updateNavState();
    }
  }, { passive: true });

  if (!reduced) {
    setupPreloader();
    setupLenis();
    setupSkillsTransition();
    setupBentoMotion();
    setupSkillShowcases();
    setupSkillsAtlasScreen();
    setupSkillsConnectors();
    setupProjectShowcase();
    setupVisualizationGallery();
    setupLazyD3Iframes();
    setupJourneyMotion();
    setupCountUps();
    setupCustomCursor();
    setupMicroInteractions();
    setupScrollReveals();
  }

  updateProgress();
  updateNavState();
  markActiveNav("hero");
  updateProjectRail("project-fraud");
  updateJourneyRail("overview");
  movePillIndicator(modeIndicator, document.querySelector(".switch button.active"));

  window.__portfolioShellReady = true;
  window.dispatchEvent(new Event("portfolio-shell-ready"));
})();
