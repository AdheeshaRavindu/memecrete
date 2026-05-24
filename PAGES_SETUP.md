Cloudflare Pages — repository setup and recommended file structure

This repo is already structured for Cloudflare Pages. Use the instructions below when you "Connect to Git" in the Cloudflare Pages UI.

Recommended Cloudflare Pages settings when connecting this GitHub repo:
- Branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Install command: leave blank (Cloudflare will run `npm ci` if you set up a package.json script), or set `npm ci` if you prefer explicit install.

Files and layout (what this repo contains / what Cloudflare needs):
- `package.json` — includes `build` script which runs `vite build` and produces `dist/`.
- `vite.config.ts` — Vite config for building the client.
- `src/` — React + TS source files.
- `dist/` — production build output (auto-created by `npm run build`). Cloudflare Pages will use whatever is in `dist` as static assets.
- `wrangler.toml` / `wrangler.worker.toml` — Cloudflare Worker config (only needed if you deploy Workers separately).
- `.github/workflows/deploy-pages.yml` — optional GitHub Actions workflow (we added this as a fallback CI deploy via `wrangler`).
- `dist.zip` — a zip of the `dist` folder for manual upload via the Pages UI if required.

Notes / Hints
- If you connect via the Cloudflare UI, you do not need the `CF_API_TOKEN` secret; Cloudflare builds and deploys using the connected Git provider permissions.
- If you prefer CI deploy with `wrangler` (the workflow we added), create a GitHub Actions secret named `CF_API_TOKEN` with a token that has Pages write permissions.
- If you want a manual upload instead of connecting the repo, use `dist.zip` via the Cloudflare Pages upload dialog.

Quick checklist (when connecting in the Pages UI):
1. Select the repository: `AdheeshaRavindu/memecrete`.
2. Branch: `main`.
3. Set build command: `npm run build`.
4. Set output directory: `dist`.
5. Start the deployment.

If you want, I can also create a small `pages/` folder or an `index.html` in the repo root for a zero-build Pages deploy — tell me which approach you want and I will add it.