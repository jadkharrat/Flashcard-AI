# RecallAI frontend

The RecallAI web client is a React and TypeScript application built with Vite. It provides account creation and sign-in, a no-account sample workspace, PDF upload validation, customizable AI generation, a private saved-deck library, an editor with AI-assisted card rewrites, accessible study controls, and responsive light/dark themes.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. Start the backend on port `5050`, then start the frontend:

   ```bash
   npm run dev
   ```

The frontend defaults to `http://localhost:5050` when `VITE_API_URL` is not set.

## Environment

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_API_URL` | Backend origin, without a trailing `/api` path | `http://localhost:5050` |

## Quality checks

```bash
npm run lint
npm run build
```

`npm run build` performs a strict TypeScript build before creating the production bundle.
