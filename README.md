# app.downstreamx

React 19 + TypeScript SPA for DownstreamX.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Ensure `api.downstreamx` is running on port 8000 (or update `VITE_API_BASE_URL`).

## Port legacy UI pages

```bash
node scripts/port-legacy-pages.mjs
```

Creates feature placeholders under `src/features/` from legacy Inertia pages (~779 files). Replace placeholders with TanStack Query + RHF implementations.

## Build

```bash
npm run build
```
