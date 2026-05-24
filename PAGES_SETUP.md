# Cloudflare deployment

**Live app:** [spincrete.pages.dev](https://spincrete.pages.dev)

Spincrete runs on Cloudflare Workers (`spincrete-api`) with the React frontend bundled as static assets. Pages can mirror or redirect to the same app.

## Primary deploy (recommended)

Builds the UI and deploys Worker + API together:

```bash
npm run deploy:worker
```

Live URL: [spincrete.pages.dev](https://spincrete.pages.dev)

## Pages projects

| Project | URL | Role |
| --- | --- | --- |
| `spincrete` | [spincrete.pages.dev](https://spincrete.pages.dev) | Main public URL |
| `memecrete` | [memecrete.pages.dev](https://memecrete.pages.dev) | Alternate / redirect |

Deploy Pages static build:

```bash
npm run deploy:pages
```

Deploy redirect stub only:

```bash
npx wrangler pages deploy pages-redirect --project-name spincrete --commit-dirty=true
```

## GitHub Actions

[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) deploys to Pages on push to `main` when `CF_API_TOKEN` is set.

## Secrets

Worker (recommended):

```bash
npx wrangler secret bulk .dev.vars --config wrangler.worker.toml
```

Pages (if using `functions/api/spin.ts`):

```bash
npx wrangler pages secret bulk .dev.vars --project-name spincrete
```

Required keys: `OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_FALLBACKS`, `IMGFLIP_USERNAME`, `IMGFLIP_PASSWORD`

Optional: `GEMINI_API_KEY`, `OPENROUTER_MODEL`, `GEMINI_MODEL`

## Local dev

```bash
npm run build
npm run dev:worker
```

Copy [.dev.vars.example](.dev.vars.example) → `.dev.vars`

## Troubleshooting

**Blank page on Pages** — asset upload may be incomplete. Run `npm run deploy:worker` or retry CI deploy.

**500 on spin** — check Worker secrets with `GET /api/health`.

**Repeating memes** — anti-repeat logic lives in [worker/src/spinVariety.ts](worker/src/spinVariety.ts).

See [README.md](README.md) for full project docs.
