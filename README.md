# RecallAI

RecallAI turns text-based PDF documents into focused question-and-answer decks for active recall. It combines a React interface with a TypeScript API, local account storage, PDF text extraction, and AI-assisted flashcard generation.

The built-in sample deck works without an account or API key, making the project easy to preview. Creating an account and generating cards from your own PDF uses the local backend.

## What it includes

- Drag-and-drop PDF uploads with file type and 10 MB size validation
- AI-generated decks focused on the key ideas in a document
- Interactive, keyboard-accessible study cards and reveal-all controls
- Registration and login with hashed passwords and expiring JWT sessions
- A responsive interface with light and dark themes
- A one-click sample deck that requires no backend configuration
- Clear loading, validation, and server error states

## Technology

- **Frontend:** React 19, TypeScript, React Router, Tailwind CSS, Vite
- **Backend:** Node.js, Express, TypeScript, Multer
- **Data and authentication:** Prisma, SQLite, bcrypt, JSON Web Tokens
- **AI and documents:** OpenAI API, `pdf-parse`

## Run it locally

### Requirements

- Node.js 22.12 or newer (Node 20.19+ is also supported)
- npm
- An [OpenAI API key](https://platform.openai.com/api-keys) for generating flashcards from uploaded PDFs

The sample deck, registration, and login still work without an OpenAI key.
PDF extraction uses the bundled `pdf-parse` library, so Poppler/`pdftotext` is not required.

### One-command setup

From the project root, run:

```bash
npm run setup
```

This command:

1. Creates `backend/.env` from the example if it does not exist and generates a secure JWT secret.
2. Installs the exact frontend and backend dependencies from their lockfiles.
3. Generates the Prisma client.
4. Applies the committed migrations to create or update the local SQLite database.

Then add your real OpenAI key to `backend/.env`:

```env
OPENAI_API_KEY=your_openai_api_key
```

Start the frontend and API together:

```bash
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:5050` by default. Press `Ctrl+C` once to stop both services.

> `npm run setup` preserves existing environment values. It only creates the file when missing or replaces an invalid/obvious placeholder JWT secret.

## Environment variables

Backend settings live in `backend/.env`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | For PDF generation | Authenticates requests to OpenAI. |
| `JWT_SECRET` | Yes | Signs login tokens. The setup command generates this automatically. |
| `DATABASE_URL` | Yes | Prisma connection URL. The local default points to a private SQLite file. |
| `PORT` | No | API port; defaults to `5050`. |
| `CLIENT_ORIGIN` | No | Allowed browser origin for CORS; defaults to the local Vite URL. |
| `OPENAI_MODEL` | No | OpenAI model used for generation; the backend provides a default. |

To use an API running somewhere other than `http://localhost:5050`, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5050
```

Environment files and local databases are intentionally excluded from Git.

## Useful commands

Run these from the project root:

| Command | What it does |
| --- | --- |
| `npm run setup` | Installs dependencies and prepares a fresh local database. |
| `npm run dev` | Starts the frontend and backend together; the backend applies pending migrations first. |
| `npm run db:setup` | Regenerates Prisma and applies all committed database migrations. |
| `npm run dev:frontend` | Starts only the Vite frontend. |
| `npm run dev:backend` | Starts only the API. |
| `npm run check` | Runs linting, backend tests, and production builds for both apps. |

## Project structure

```text
Flashcard-AI/
├── backend/
│   ├── prisma/          # Data model
│   └── src/             # API routes, services, and utilities
├── frontend/
│   └── src/             # React pages, components, and API clients
├── scripts/             # Cross-platform setup and development helpers
└── .github/workflows/   # Automated lint and build checks
```

## Making database changes

After editing `backend/prisma/schema.prisma`, create a named migration from the project root:

```bash
npm --prefix backend run db:migrate -- --name describe_your_change
```

Commit the generated migration files, but never commit the local SQLite database. Other environments apply committed migrations through `npm run setup` or automatically when the backend starts.

## Troubleshooting

### `The table main.User does not exist`

The SQLite file exists, but its migrations have not been applied yet. Stop the API, run the following command from the project root, and start it again:

```bash
npm run db:setup
npm run dev
```

Local database files are not stored in Git, so this initialization is expected after a fresh clone.

### The installed packages do not match `package.json`

Run `npm run setup`. It uses `npm ci` to replace stale local packages with the exact versions recorded in each lockfile.

### `dotenv` prints an “injecting env” line

That line is informational. It confirms that the environment file was loaded and is not an application error.

## Quality checks

Every push and pull request is checked by GitHub Actions. The same lint, test, and production-build checks can be run locally with:

```bash
npm run check
```
