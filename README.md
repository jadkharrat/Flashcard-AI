# RecallAI

RecallAI turns text-based PDF documents into concise flashcard decks for active recall. It is a full-stack TypeScript application with account authentication, PDF text extraction, AI-assisted question generation, responsive study cards, and a recruiter-friendly sample mode that works without backend setup.

## Highlights

- Drag-and-drop PDF upload with type and 10 MB size validation
- AI-generated question-and-answer decks from extracted document text
- Interactive, keyboard-accessible flashcards with reveal-all controls
- One-click sample deck for a zero-configuration product preview
- Registration and login with hashed passwords and JWT sessions
- Responsive light and dark interfaces
- Environment-based API configuration and clear server error feedback

## Stack

- Frontend: React 19, TypeScript, React Router, Tailwind/PostCSS, Vite
- Backend: Node.js, Express, TypeScript, Multer
- Data and authentication: Prisma, SQLite, bcrypt, JSON Web Tokens
- AI and documents: OpenAI API, Poppler `pdftotext`

## Run locally

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
```

Set `OPENAI_API_KEY`, `DATABASE_URL`, and a strong `JWT_SECRET` in `backend/.env`, then install and prepare the database:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The API runs on `http://localhost:5050` by default.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite. To point the frontend at another API host, set `VITE_API_URL` in `frontend/.env`.

## Production checks

```bash
cd frontend
npm run lint
npm run build

cd ../backend
npm run build
```
