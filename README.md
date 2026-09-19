# AI Bathroom Designer

Unofficial concept project for an AI-assisted bathroom planning workflow. Product names and prices are illustrative and must be verified with the manufacturer, dealer, contractor, and local code authority before purchase or construction.

## Run Locally

```bash
npm install
npm run dev:all
```

The Vite app runs on `http://localhost:5173` and proxies API calls to the Express server on `http://localhost:5000`.

## Scripts

```bash
npm run dev
npm run server
npm run dev:all
npm run build
npm test
```

## Environment

Copy `.env.example` to `.env` if you want to enable optional model-backed features.

- `ANTHROPIC_API_KEY` enables server-side bathroom image analysis.
- `GEMINI_API_KEY` enables model-backed copilot intent parsing before the local parser fallback.

Without those keys, the app stays honest: image analysis returns a low-confidence manual-review result, and the copilot uses local command parsing.

## Notes

- `server/data/products.json` is the single base product catalog; the frontend imports it and expands finish/style variants.
- Generated AR/share links read `size`, `style`, and `tier` query parameters.
- `node_modules` and `dist` are intentionally ignored so exported zips stay small.
