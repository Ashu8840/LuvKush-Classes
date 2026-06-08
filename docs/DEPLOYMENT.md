# Deployment Guide — Frontend (Vercel) & Backend (Render)

Step-by-step instructions to deploy **Luv Kush Classes** from the monorepo:

| App | Platform | Folder | Example URL |
|-----|----------|--------|-------------|
| Web frontend | **Vercel** | `frontend/` | `https://luvkush.vercel.app` |
| API backend | **Render** | `backend/` | `https://luvkush-api.onrender.com` |
| Database | **MongoDB Atlas** | — | Cloud connection string |

**Repository:** [https://github.com/Ashu8840/LuvKush-Classes](https://github.com/Ashu8840/LuvKush-Classes)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [MongoDB Atlas Setup](#2-mongodb-atlas-setup)
3. [Deploy Backend on Render](#3-deploy-backend-on-render)
4. [Deploy Frontend on Vercel](#4-deploy-frontend-on-vercel)
5. [Connect Frontend and Backend](#5-connect-frontend-and-backend)
6. [Seed Production Database](#6-seed-production-database)
7. [Verify Deployment](#7-verify-deployment)
8. [Mobile App (Optional)](#8-mobile-app-optional)
9. [Auto-Deploy on Git Push](#9-auto-deploy-on-git-push)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Before you start, make sure you have:

- A [GitHub](https://github.com) account with this repo pushed to `main`
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier works)
- A [Render](https://render.com) account (for the API)
- A [Vercel](https://vercel.com) account (for the web app)
- A [Cloudinary](https://cloudinary.com) account (for file uploads — required for materials, avatars, etc.)

**Deploy order:** MongoDB → Render (backend) → Vercel (frontend) → link env vars → test.

---

## 2. MongoDB Atlas Setup

### Step 1 — Create a cluster

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Click **Build a Database**.
3. Choose **M0 Free** (or a paid tier for production).
4. Pick a region close to your users (e.g. Mumbai / Singapore).
5. Click **Create**.

### Step 2 — Create a database user

1. Go to **Database Access** → **Add New Database User**.
2. Choose **Password** authentication.
3. Set a strong username and password (save these).
4. Grant **Read and write to any database**.
5. Click **Add User**.

### Step 3 — Allow network access

1. Go to **Network Access** → **Add IP Address**.
2. Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Required so Render's servers can reach your database.
3. Click **Confirm**.

### Step 4 — Copy the connection string

1. Go to **Database** → **Connect** → **Drivers**.
2. Copy the connection string. It looks like:

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

3. Replace `<username>` and `<password>` with your DB user credentials.
4. Add a database name before the `?`, e.g.:

   ```
   mongodb+srv://user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/luvkush?retryWrites=true&w=majority
   ```

5. Save this as your `MONGO_URI` — you will use it on Render.

---

## 3. Deploy Backend on Render

### Step 1 — Create a Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if prompted.
4. Select repository: **Ashu8840/LuvKush-Classes**.
5. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | `luvkush-api` (or your preferred name) |
   | **Region** | Singapore or closest to India |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free (or paid to avoid cold starts) |

### Step 2 — Add environment variables

In Render → your service → **Environment**, add:

| Variable | Required | Value / Notes |
|----------|----------|---------------|
| `MONGO_URI` | **Yes** | Your Atlas connection string from Section 2 |
| `JWT_SECRET` | **Yes** | Long random string (32+ characters) |
| `JWT_EXPIRES_IN` | **Yes** | `7d` |
| `NODE_ENV` | **Yes** | `production` |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | **Yes** | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | **Yes** | From Cloudinary dashboard |
| `FRONTEND_URL` | **Yes** | Set after Vercel deploy, e.g. `https://luvkush.vercel.app` |
| `GROQ_API_KEY` | Optional | AI shorthand evaluation |
| `FIREBASE_PROJECT_ID` | Optional | Push notifications |
| `FIREBASE_CLIENT_EMAIL` | Optional | Push notifications |
| `FIREBASE_PRIVATE_KEY` | Optional | Push notifications (use `\n` for newlines) |
| `MSG91_AUTH_KEY` | Optional | SMS OTP |
| `MSG91_SENDER_ID` | Optional | SMS OTP |
| `MSG91_TEMPLATE_ID` | Optional | SMS OTP |
| `UPI_ID` | Optional | Fee payments display |
| `UPI_MERCHANT_NAME` | Optional | Fee payments display |

> **Do not set `PORT`** — Render assigns it automatically.

### Step 3 — Deploy

1. Click **Create Web Service**.
2. Wait for the build to finish (usually 2–5 minutes).
3. Copy your service URL, e.g. `https://luvkush-api.onrender.com`.

### Step 4 — Verify backend

Open in a browser:

```
https://YOUR-SERVICE.onrender.com/
```

Expected response:

```json
{ "success": true, "message": "Luv Kush Classes API" }
```

API routes are under `/api`, e.g. `https://YOUR-SERVICE.onrender.com/api/auth/login`.

**Optional:** In Render → **Settings** → **Health Check Path**, set `/`.

---

## 4. Deploy Frontend on Vercel

### Step 1 — Import the project

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** → **Project**.
3. Import **Ashu8840/LuvKush-Classes** from GitHub.
4. Authorize Vercel to access the repo if prompted.

### Step 2 — Configure build settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Install Command** | `npm install` |
| **Output Directory** | *(leave default)* |

The project includes `frontend/vercel.json` with region `bom1` (Mumbai).

### Step 3 — Add environment variables

Before deploying, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-SERVICE.onrender.com/api` |

> **Important:** Include `/api` at the end. The frontend reads this in `frontend/src/lib/api.ts`.

Apply to **Production**, **Preview**, and **Development** environments.

### Step 4 — Deploy

1. Click **Deploy**.
2. Wait for the build (usually 2–4 minutes).
3. Copy your production URL, e.g. `https://luvkush.vercel.app`.

### Step 5 — Custom domain (optional)

1. Vercel → Project → **Settings** → **Domains**.
2. Add your custom domain and follow DNS instructions.

---

## 5. Connect Frontend and Backend

After both services are live:

1. Go to **Render** → your backend service → **Environment**.
2. Set `FRONTEND_URL` to your Vercel URL (no trailing slash):

   ```
   https://luvkush.vercel.app
   ```

3. Click **Save Changes**.
4. Trigger **Manual Deploy** → **Deploy latest commit**.

`FRONTEND_URL` is used for certificate logo URLs. CORS in `backend/src/index.js` already allows:

- `https://luvkush.vercel.app`
- Any `*.vercel.app` preview URL
- The `FRONTEND_URL` env variable

---

## 6. Seed Production Database

If the production database is empty, seed it once with default users and sample data.

### Option A — Run locally against Atlas

```powershell
cd backend
$env:MONGO_URI="your_atlas_connection_string"
npm run seed
```

### Option B — Render Shell (paid plans)

1. Render → your service → **Shell**.
2. Run:

   ```bash
   npm run seed
   ```

### After seeding

Change all default passwords immediately in production. See `docs/PROJECT_DOCUMENTATION.md` for default credentials.

---

## 7. Verify Deployment

Use this checklist after both services are deployed:

| # | Check | Expected result |
|---|-------|-----------------|
| 1 | Open Vercel URL | Home page loads |
| 2 | Open Render URL `/` | JSON API welcome message |
| 3 | Log in on web | Login succeeds, dashboard loads |
| 4 | Browser DevTools → Network | API calls go to `https://YOUR-SERVICE.onrender.com/api/...` |
| 5 | No CORS errors | Console is clean |
| 6 | Upload a file (admin) | Works if Cloudinary vars are set |
| 7 | Generate a certificate | Logo appears if `FRONTEND_URL` is set |
| 8 | Homepage testimonials | Approved testimonials display correctly |

---

## 8. Mobile App (Optional)

The mobile app is not deployed to Vercel or Render. Point it at your Render API:

1. Create `mobile/.env` (gitignored):

   ```
   EXPO_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com/api
   ```

2. Rebuild with [EAS Build](https://docs.expo.dev/build/introduction/) or run via Expo Go for testing.

> **Note:** Render free tier has cold starts (~30–60 seconds on first request after idle). Mobile users may notice a delay on the first API call.

---

## 9. Auto-Deploy on Git Push

Both platforms redeploy automatically when you push to `main`:

| Platform | Watches | Folder |
|----------|---------|--------|
| Render | `main` branch | `backend/` |
| Vercel | `main` branch | `frontend/` |

After changing environment variables, trigger a **manual redeploy** on that platform — env changes do not always trigger a new build.

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| **API slow or unreachable on first request** | Render free tier cold start. Wait 30–60s or upgrade plan. |
| **CORS error in browser** | Set `FRONTEND_URL` on Render to exact Vercel URL; redeploy backend. |
| **Login works locally, fails in production** | Check `NEXT_PUBLIC_API_URL` ends with `/api`; redeploy Vercel after env changes. |
| **MongoDB connection failed** | Verify Atlas IP whitelist (`0.0.0.0/0`) and correct `MONGO_URI` password. |
| **File uploads fail** | Add all three Cloudinary env vars on Render. |
| **Certificate logo missing** | Set `FRONTEND_URL` to Vercel URL where `/logo.png` is served. |
| **Build fails on Vercel** | Confirm Root Directory is `frontend`, not repo root. |
| **Build fails on Render** | Confirm Root Directory is `backend`; Start Command is `npm start`. |
| **Env var not picked up** | Redeploy manually after saving env vars. |

---

## Quick Reference — Deploy Order

```
1. MongoDB Atlas  →  cluster + connection string
2. Render         →  backend service (backend/)
3. Test           →  GET https://your-api.onrender.com/
4. Vercel         →  frontend (frontend/) + NEXT_PUBLIC_API_URL
5. Render         →  set FRONTEND_URL + redeploy
6. Seed DB        →  npm run seed (one time)
7. Test           →  login, uploads, certificates
```

---

*Last updated: June 2026*