# LuvKush-Classes

Full-stack coaching platform for **Luv Kush Coaching Center** — shorthand, typing, computer fundamentals, Tally, and digital literacy training.

## Stack

| Layer | Tech |
|-------|------|
| **Backend** | Node.js, Express, MongoDB |
| **Web** | Next.js, TypeScript, Tailwind CSS, Framer Motion |
| **Mobile** | Expo (React Native), TypeScript |

## Project structure

```
application/
├── backend/     # REST API
├── frontend/    # Next.js web app
├── mobile/      # Expo mobile app
└── docs/        # Project documentation
```

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # fill in MongoDB URI, JWT secret, etc.
npm install
npm run dev
```

### Web (frontend)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mobile

```bash
cd mobile
cp .env.example .env   # set EXPO_PUBLIC_API_URL to your machine IP
npm install
npx expo start
```

## Environment

- Copy `backend/.env.example` → `backend/.env`
- Copy `mobile/.env.example` → `mobile/.env`
- Never commit real `.env` files (they are gitignored)

## License

Private — Luv Kush Coaching Center © 2026