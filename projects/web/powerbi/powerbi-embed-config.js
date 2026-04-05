// Power BI embed configuration for index.html (Visualizations → featured dashboard).
//
// ── “Published” vs anonymous (no sign-in) ──────────────────────────────────
//   Saving or publishing the report to the Power BI *service* (app.powerbi.com) does
//   NOT make it public. Links like reportEmbed?…&autoAuth=true always expect a
//   Microsoft sign-in and permission on the report.
//
//   For visitors to see the dashboard **without signing in**, you must use
//   **Publish to web** (separate feature). In the service: open the report →
//   File → Embed report → **Publish to web** (or Share → Publish to web). Copy the
//   **iframe URL** — it always starts with:
//     https://app.powerbi.com/view?r=eyJrIjoi...
//   Paste that full string below. Anyone with the link can view the report; do not
//   use for confidential data. Your IT admin can disable Publish to web.
//
//   Report in workspace (for reference): …/reports/35433675-f555-4339-9892-d95c5f3d26a1/…
//
// Senior_Project — Publish to web (public; no sign-in for viewers)
window.powerbiPublishedIframeSrc =
  "https://app.powerbi.com/view?r=eyJrIjoiYjgxN2Y4YTYtNjUzZC00MWI1LWI0NDUtZWY0OWUzYWZmMTIyIiwidCI6ImMyYjg1NWI3LWI5OGItNGFjNS1hODJkLWU3NzA2ZmE5NTVhZCIsImMiOjZ9";

// Optional: which report page opens first (Publish to web). In Power BI Service, open the
// report, click the page you want, copy the last URL segment after /reports/<id>/ — it
// looks like ReportSection1a2b3c4d5e6f7890. Leave null to use Power BI’s default (usually
// the first page in the report).
window.powerbiPublishedPageName = null;

// Optional: accessible title for the iframe
window.powerbiPublishedReportTitle = "Senior Project — Power BI dashboard";

//
// ── Option B — JavaScript embed (secure; needs a server) ───────────────────
//   Your page uses powerbi.min.js, which requires a short-lived embed token from
//   the Power BI REST API (GenerateTokenInGroup). Typical pattern: small backend
//   (Azure Function, Node, etc.) using a service principal; frontend calls your API,
//   receives { embedUrl, reportId, accessToken }, then sets:
//
//   window.powerbiEmbedConfig = {
//     reportId: "35433675-f555-4339-9892-d95c5f3d26a1",
//     embedUrl: "https://app.powerbi.com/reportEmbed?reportId=...&groupId=...", // from REST
//     accessToken: "<from GenerateToken; never commit real tokens to git>",
//     settings: { /* optional */ },
//   };
//
//   Never put a real accessToken in this file on GitHub.
//
window.powerbiEmbedConfig = null;

//
// Optional: adds an "Open in Power BI" link on the dashboard card (viewers must be signed in and allowed on the report).
window.powerbiOpenInServiceUrl =
  "https://app.powerbi.com/groups/me/reports/35433675-f555-4339-9892-d95c5f3d26a1/b78d36498fbce51669bb?experience=power-bi";

