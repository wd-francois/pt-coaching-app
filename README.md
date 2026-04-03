# PT Coaching App

React + Vite app for personal training: clients, workouts, measurements, and Supabase or local (IndexedDB) storage.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and add your Supabase URL and anon key (optional — without them the app uses IndexedDB in the browser).

```bash
npm run dev
```

## Database

- **Supabase:** see `SUPABASE_SETUP_GUIDE.md` and SQL under `supabase/migrations/`.
- **Local-only:** no `.env` needed; data stays in the browser.

## Scripts

| Command        | Description      |
| -------------- | ---------------- |
| `npm run dev`  | Dev server       |
| `npm run build`| Production build |
| `npm run preview` | Preview build |
