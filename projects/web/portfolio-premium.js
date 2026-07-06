/* Premium page interactions — scrubbed section-head reveals and metric count-ups. */
(function () {
  "use strict";

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

  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
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

      // Experience & Education's head leads in a touch earlier than the rest.
      var early = sec.id === "experience" ? 4 : 0;

      function scrubVars() {
        return {
          trigger: head,
          start: "top " + (94 + early) + "%",
          end: "top " + (58 + early) + "%",
          scrub: 0.55
        };
      }

      if (title) {
        gsap.fromTo(
          title,
          { y: 48, opacity: 0 },
          { y: 0, opacity: 1, ease: "none", immediateRender: false, scrollTrigger: scrubVars() }
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



  function boot() {
    window.addEventListener("load", function () {
      waitGsap(function () {
        initSectionReveals();
      });
      initCountUp();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
