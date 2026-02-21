# Meckman Bot

AI assistant running on a single Cloudflare Worker (free tier) with two interfaces:

- **Public Web UI** at [bot.meckman.org](https://bot.meckman.org) — chat and image generation
- **Private Telegram Bot** — same AI capabilities via Telegram commands

## Stack

TypeScript, Cloudflare Workers, Workers AI, grammY (Telegram SDK)

## Design

Follows the Meckman Design System V4 — black background, charcoal panels, tan accents, red curiosity spark on the active mode button.

## Content Policy

All AI services enforce a "Safe for Work and School" policy. Prohibited content is rejected with a standard message.

## Setup

```bash
npm install
npx wrangler login
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler deploy
```

## Development

```bash
npm run dev     # Local dev server
npm run check   # TypeScript type check
npm run deploy  # Deploy to Cloudflare
```

## License

ISC
