# Spincrete

One-click Concrete meme generator for CT-native, Imgflip-rendered memes.

## Architecture

- React + TypeScript frontend built with Vite.
- Dark-only, mobile-first crypto UI.
- Cloudflare Worker API at `POST /api/spin`.
- Imgflip API for curated meme templates and final image rendering.
- OpenRouter API for template-specific meme text.
- D1-backed recent history when configured, with in-memory repeat protection as a fallback.

## Spin Flow

1. User clicks `SPIN MEME`.
2. The Worker selects a random template from the curated Imgflip whitelist.
3. OpenRouter generates short, template-specific CT meme text using crypto, Concrete, and Moai context.
4. Imgflip renders the meme with the correct textbox count.
5. The frontend receives:

```json
{
  "memeUrl": "",
  "caption": "",
  "xPost": "",
  "template": ""
}
```

## Required Secrets

Set these on the Worker:

```bash
wrangler secret put OPENROUTER_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put IMGFLIP_USERNAME
wrangler secret put IMGFLIP_PASSWORD
```

Optional Worker vars:

- `OPENROUTER_MODEL` defaults to `meta-llama/llama-3.2-3b-instruct:free`.
- `GEMINI_API_KEY` is optional and used as a second free LLM fallback.
- `GEMINI_MODEL` defaults to `gemini-2.5-flash`.
- `APP_URL` is sent to OpenRouter as the referer.
- `APP_NAME` is sent to OpenRouter as the app title.

Frontend env:

- `VITE_API_BASE_URL` points the frontend to the deployed Worker URL. Leave empty when serving through the same origin.

## Local Setup

```bash
npm install
npm run dev
```

Run the Worker separately when testing the real generation endpoint:

```bash
npm run dev:worker
```

## D1 Setup

D1 is optional but recommended for anti-repeat history across Worker instances.

```bash
wrangler d1 execute spincrete-db --file=worker/d1/schema.sql --local
```

Update `wrangler.toml` with your real D1 database ID before deploying.

## Deployment

```bash
npm run deploy:worker
npm run deploy:pages
```

The Worker exposes:

- `GET /api/health`
- `POST /api/spin`

## Curated Templates

The Worker only chooses from the curated whitelist in [worker/src/memeTemplates.ts](worker/src/memeTemplates.ts), including Drake, Change My Mind, Two Buttons, Trade Offer, Distracted Boyfriend, Gru Presentation, This Is Fine, Expanding Brain, Surprised Pikachu, Domino Effect, Galaxy Brain, Virgin vs Chad, Spider-Man Pointing, NPC Meme, Family Guy Color Chart, and Bro Visited Friend.
\nCI trigger: commit to activate Pages deploy workflow.
