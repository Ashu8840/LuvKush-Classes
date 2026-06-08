# Environment Variables — Copy & Paste for Render & Vercel

Production API base URL:

```
https://luvkush-classes.onrender.com
```

API routes use the `/api` prefix, e.g. `https://luvkush-classes.onrender.com/api`.

---

## Where the ready-to-paste files live

Full values (including secrets) are in your **local** env files — these are gitignored and stay on your machine only:

| Platform | Open this file on your PC | Paste into |
|----------|---------------------------|------------|
| **Render** (backend) | `backend/.env` | Render → Web Service → **Environment** |
| **Vercel** (frontend) | `frontend/.env.local` | Vercel → Project → **Settings → Environment Variables** |
| **Mobile** (EAS / APK) | `mobile/.env` | Used at build time; rebuild app after changes |

Copy each `KEY=value` line from the file into the dashboard (one variable per row). Skip comment lines starting with `#`.

---

## Render — Backend (`backend/.env`)

| Variable | Notes |
|----------|-------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `CLOUDINARY_CLOUD_NAME` | File uploads |
| `CLOUDINARY_API_KEY` | File uploads |
| `CLOUDINARY_API_SECRET` | File uploads |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Auth signing key |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `GOOGLE_CLIENT_ID` | Optional OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional OAuth |
| `GROQ_API_KEY` | AI shorthand / typing |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://luvkush.vercel.app` |
| `UPI_ID` | Fee payments |
| `UPI_MERCHANT_NAME` | Fee payments |

**Do not add `PORT`** — Render sets it automatically.

After saving, click **Manual Deploy → Deploy latest commit**.

---

## Vercel — Frontend (`frontend/.env.local`)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://luvkush-classes.onrender.com/api` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web key (if using push) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |

Apply to **Production**, **Preview**, and **Development**, then **Redeploy**.

---

## Mobile — Production app (`mobile/.env`)

| Variable | Value |
|----------|-------|
| `EXPO_PUBLIC_API_URL` | `https://luvkush-classes.onrender.com/api` |
| `EXPO_PUBLIC_API_PORT` | `5000` (used only for local LAN dev) |

After updating:

```bash
cd mobile
npx eas build --platform android
```

Or your usual EAS / release build command. The downloaded app will call the Render API.

> **Expo Go:** With an `https://` URL set, the app uses Render even in development mode.

---

## Quick verification

| Check | URL |
|-------|-----|
| Backend alive | https://luvkush-classes.onrender.com/ |
| API prefix | https://luvkush-classes.onrender.com/api |
| Web app | Your Vercel URL after deploy |

---

*See also: [DEPLOYMENT.md](./DEPLOYMENT.md) for full step-by-step setup.*