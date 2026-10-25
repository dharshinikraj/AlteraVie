# AlteraVie Frontend

React 19 + Vite frontend for AlteraVie.

## Development

```bash
npm install
npm run dev
```

The development server listens on `0.0.0.0` so it can be tested from other devices on the same LAN.

## Production build

```bash
npm run build
```

Set `VITE_API_BASE` to the public FastAPI URL in production. Leave it blank for local development so the app targets port 8000 on the same hostname.
