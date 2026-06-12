/* Theme + entrance plumbing shared by the embedded D3 pages.
   Load synchronously in <head> so data-theme lands before first paint. */
(function () {
  var params = new URLSearchParams(window.location.search);
  var theme = params.get("theme") === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme);

  // Embedded panes drop the editorial chrome (kicker, sub, panel card) so the
  // preview is chart-forward; the standalone page keeps the full layout.
  var embedded = false;
  try {
    embedded = window !== window.top;
  } catch (_err) {
    embedded = true;
  }
  if (embedded) document.documentElement.setAttribute("data-embed", "true");

  // The parent page broadcasts toggles so already-loaded frames follow along.
  window.addEventListener("message", function (event) {
    var data = event && event.data;
    if (!data || data.type !== "portfolio-theme") return;
    if (event.origin !== window.location.origin) return;
    document.documentElement.setAttribute(
      "data-theme",
      data.theme === "light" ? "light" : "dark"
    );
    document.dispatchEvent(new CustomEvent("viz-theme-change"));
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Defers a chart's entrance until the pane is actually in the top-level
  // viewport (frames preload ~1400px early, so load-time animations would
  // finish unseen). Calls cb(true) when the entrance should be skipped and the
  // chart rendered in its final state immediately.
  function whenVisible(el, cb) {
    var done = false;
    var run = function (skip) {
      if (done) return;
      done = true;
      cb(skip === true);
    };
    if (reduced) {
      run(true);
      return;
    }
    if (!el || !("IntersectionObserver" in window)) {
      run(false);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          io.disconnect();
          run(false);
          return;
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
  }

  window.vizShell = {
    theme: function () {
      return document.documentElement.getAttribute("data-theme") || "dark";
    },
    reducedMotion: reduced,
    whenVisible: whenVisible
  };
})();
