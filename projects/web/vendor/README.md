# Vendored browser scripts

These files are served **locally** so the portfolio works without CDN access:

| File | Package |
|------|---------|
| `gsap.min.js` | gsap@3.12.2 |
| `ScrollTrigger.min.js` | gsap@3.12.2 |
| `lenis.min.js` | @studio-freight/lenis@1.0.42 |
| `powerbi.min.js` | powerbi-client@2.22.0 |

After changing versions in the root `package.json`, run from the repo root:

```bash
npm install
npm run vendor:sync
```

(`postinstall` also runs `vendor:sync` automatically.)
