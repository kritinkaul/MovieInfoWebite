## Cursor Cloud specific instructions

### Overview
CineVerse is a static frontend movie discovery PWA (HTML/CSS/vanilla JS). There is **no build step**, no package manager, no backend, no database, and no test framework. All movie data comes from the TMDB API (key hardcoded in `script.js`).

### Running the dev server
Serve the repo root with any static HTTP server. The Service Worker (`sw.js`) and some browser APIs require HTTP, not `file://`.

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser.

### Lint / Test / Build
There are no lint, test, or build commands configured in this repo. There is no `package.json`, `Makefile`, or CI config.

### Key files
| File | Purpose |
|---|---|
| `index.html` | Main entry point |
| `script.js` | All application logic and TMDB API integration |
| `styles.css` | Styling |
| `sw.js` | Service Worker for PWA offline caching |
| `manifest.json` | PWA manifest |

### Gotchas
- The TMDB API key is hardcoded in `script.js` line 5. If it stops working, a new key can be obtained from https://www.themoviedb.org/.
- Several alternate HTML files exist (`index_new.html`, `index_broken.html`, `index_fixed.html`, `dev.html`, `test-modal.html`) — these are development/debug variants, not the main entry point.
- The watchlist is stored in `localStorage` — clearing browser data resets it.
