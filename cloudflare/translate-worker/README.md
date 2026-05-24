# Carole Portfolio Translate Worker

This Worker protects the portfolio CMS translation workflow.

Flow:

1. Sanity Studio calls the site endpoint: `/api/translate`.
2. The site endpoint calls this Cloudflare Worker with a server-side bearer token.
3. The Worker verifies the token, validates the payload, and calls OpenAI through Cloudflare AI Gateway.
4. AI Gateway handles usage visibility and rate limiting.

## Required Cloudflare Setup

Create an AI Gateway in Cloudflare:

- Provider: OpenAI
- Add rate limiting in the AI Gateway settings
- Recommended starting limit: 30 requests per 10 minutes, sliding window

Then configure Worker secrets:

```bash
npx wrangler secret put TRANSLATE_WORKER_TOKEN --config cloudflare/translate-worker/wrangler.jsonc
```

For the preferred BYOK / Stored Keys mode:

1. Add the OpenAI key in AI Gateway -> Provider Keys.
2. Create a Gateway token in AI Gateway -> Create token.
3. Add that Gateway token to the Worker:

```bash
npx wrangler secret put CLOUDFLARE_AI_GATEWAY_TOKEN --config cloudflare/translate-worker/wrangler.jsonc
```

That token is created in AI Gateway settings and must have Gateway Run permissions.

`OPENAI_API_KEY` is only needed if you choose not to use BYOK / Stored Keys.

Use a long random value for `TRANSLATE_WORKER_TOKEN`, then add the same value to Vercel as `TRANSLATE_WORKER_TOKEN`.

## Vercel Variables

Set these on the Vercel project:

```bash
CLOUDFLARE_TRANSLATE_WORKER_URL=https://carole-portfolio-translate.<your-subdomain>.workers.dev
TRANSLATE_WORKER_TOKEN=<same-long-random-token-as-worker>
```

Do not set `OPENAI_API_KEY` on Vercel once Cloudflare is active. In BYOK mode, store the OpenAI key in Cloudflare AI Gateway Provider Keys, not in Vercel.

## Local Development

The local Vite endpoint can call the deployed Worker if both values are present in `.env.local`:

```bash
CLOUDFLARE_TRANSLATE_WORKER_URL=
TRANSLATE_WORKER_TOKEN=
```

Direct OpenAI fallback is disabled by default. Only enable it temporarily with:

```bash
ALLOW_DIRECT_OPENAI_TRANSLATION=true
OPENAI_API_KEY=
```

## Deploy

```bash
npx wrangler deploy --config cloudflare/translate-worker/wrangler.jsonc
```
