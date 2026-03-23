// Power BI embed configuration for projects/web/index.html.
// To display an embedded report, set window.powerbiEmbedConfig with:
//   - embedUrl (string)
//   - reportId (string)
//   - accessToken (string)  (keep secrets off the client in production)
//   - settings (optional object)
//
// If powerbiEmbedConfig remains null/empty, the page will still show the PBIX download link.
//
// Sizing: the dashboard lives in #visualizations .visual-frame--dashboard, which uses
// aspect-ratio: 16 / 9 (typical report layout). For a 4:3 or custom page size, change
// that rule in index.html (search "visual-frame--dashboard") or set an inline style
// on the same element, e.g. style="aspect-ratio: 4 / 3".

window.powerbiEmbedConfig = null;

