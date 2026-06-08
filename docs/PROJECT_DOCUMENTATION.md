# Luv Kush Classes — Complete Project Documentation

**Version:** 2.0  
**Prepared for:** Client Review  
**Institution:** Luv Kush Classes — Shorthand & Typing Coaching Institute  
**Date:** June 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What This Project Is About](#2-what-this-project-is-about)
3. [Project Structure](#3-project-structure)
4. [Technology Stack](#4-technology-stack)
5. [User Roles & Access](#5-user-roles--access)
6. [Backend (API Server)](#6-backend-api-server)
7. [Frontend (Web Application)](#7-frontend-web-application)
8. [Mobile Application](#8-mobile-application)
9. [Database Design](#9-database-design)
10. [Authentication & Security](#10-authentication--security)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [Theme & User Interface](#12-theme--user-interface)
13. [Records Database (Permanent Archive)](#13-records-database-permanent-archive)
14. [Deployment Guide](#14-deployment-guide)
15. [Local Development Setup](#15-local-development-setup)
16. [Default Login Credentials](#16-default-login-credentials)
17. [Features Delivered](#17-features-delivered)
18. [Planned / Future Enhancements](#18-planned--future-enhancements)
19. [Support & Maintenance Notes](#19-support--maintenance-notes)

---

## 1. Executive Summary

**Luv Kush Classes** is a full-stack digital coaching platform built for a shorthand and typing tuition institute. It replaces manual registers, scattered spreadsheets, and paper-based processes with a single integrated system accessible on **web browsers** and **mobile phones**.

The platform supports four types of users — **Admin**, **Teacher**, **Student**, and **Parent** — each with a dedicated dashboard and tools matched to their daily work. Admins manage the entire institute; teachers handle batches, attendance, and classes; students practice typing, take AI-evaluated shorthand dictations, earn XP and badges, and track progress; parents view their child's attendance, fees, and scores in a read-only portal.

The project is delivered as a **monorepo** containing three applications that share one backend API and one database:

| Component | Purpose |
|-----------|---------|
| **Backend** | REST API, database, file uploads, AI coach |
| **Frontend** | Full web portal for desktop and mobile browsers |
| **Mobile** | Native-feel app for Android/iOS via Expo Go or app stores |

---

## 2. What This Project Is About

Luv Kush Classes specialises in:

- **Shorthand** coaching (80, 100, 120, 140 WPM levels)
- **Hindi & English typing** practice and certification
- **Computer basics** and **CCC exam preparation**
- Fee collection, batch scheduling, and performance tracking

This software platform digitises every major operation of the institute:

| Manual Process (Before) | Digital Solution (Now) |
|-------------------------|------------------------|
| Paper attendance registers | Digital attendance marking by teachers |
| Fee collection tracking in notebooks | Online fee records with payment status |
| Printed study materials | Digital library with PDFs, videos, and audio |
| Phone calls for exam reminders | In-app notifications |
| No central student history | Permanent Records Database (scores, certificates, fees) |
| Typing practice on local software only | Built-in typing practice with WPM and accuracy tracking |
| No AI assistance | AI Study Coach powered by Groq |

The goal is to present a **professional, modern institute image** to students and parents while giving staff efficient tools to run day-to-day operations.

---

## 3. Project Structure

```
application/
├── backend/          → Node.js REST API (Express + MongoDB)
├── frontend/         → Next.js web application
├── mobile/           → React Native app (Expo SDK 54)
└── docs/             → Project documentation (this file)
```

### Backend (`backend/`)

```
backend/
├── src/
│   ├── config/         → Database connection
│   ├── controllers/    → Business logic for each feature
│   ├── middleware/     → JWT authentication & role checks
│   ├── models/         → MongoDB data schemas (19 models)
│   ├── services/       → Gamification, shorthand evaluator, Razorpay, notifications
│   ├── routes/         → API endpoint definitions
│   ├── seed.js         → Sample data for first-time setup
│   └── index.js        → Server entry point
├── .env.example        → Environment variable template
├── package.json
└── vercel.json         → Serverless deployment config
```

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── app/            → Pages (Next.js App Router)
│   │   ├── page.tsx           → Public landing page
│   │   ├── login/             → Login screen
│   │   ├── admin/             → 10 admin pages
│   │   ├── teacher/           → 7 teacher pages (incl. shorthand upload)
│   │   ├── student/           → 13 student pages (analytics, leaderboard, exams)
│   │   └── parent/            → 5 parent pages (view-only portal)
│   ├── components/
│   │   ├── layout/     → Sidebar, header, theme, notifications
│   │   ├── ui/         → Cards, tables, skeletons, confetti, data-table
│   │   ├── gamification/ → Badges, leaderboard, celebrations
│   │   └── analytics/  → Charts, heatmap, progress rings
│   ├── contexts/       → Auth and colour theme state
│   └── lib/            → API client and utilities
├── .env.example
├── package.json
└── vercel.json
```

### Mobile (`mobile/`)

```
mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── admin/      → 10 screens (mirrors web admin)
│   │   ├── teacher/    → 7 screens (incl. shorthand upload)
│   │   ├── student/    → 13 screens (analytics, leaderboard, exam flow)
│   │   └── parent/     → 5 screens (view-only portal)
│   ├── components/
│   │   ├── layout/     → Drawer sidebar, theme, notifications
│   │   └── ui/         → Shared cards, buttons, modals
│   ├── navigation/     → Role-based drawer navigators
│   ├── contexts/       → Auth and theme
│   └── lib/            → API client
├── App.tsx
├── app.json
└── package.json
```

---

## 4. Technology Stack

### Backend

| Technology | Version | Role |
|------------|---------|------|
| Node.js | 18+ | Runtime |
| Express.js | 4.x | Web framework |
| MongoDB | Atlas / local | Database |
| Mongoose | 8.x | ODM (object modelling) |
| JWT | — | Authentication tokens |
| bcryptjs | — | Password hashing |
| Cloudinary | — | File/image storage |
| Groq API | — | AI Study Coach, shorthand evaluation, analytics insights |
| Razorpay | 2.x | Online fee payments |
| Firebase Admin | 13.x | Push notifications (FCM) |
| MSG91 / WhatsApp | — | SMS/WhatsApp alerts (optional) |
| Multer | — | File upload handling |

### Frontend (Web)

| Technology | Version | Role |
|------------|---------|------|
| Next.js | 16.x | React framework (App Router) |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| next-themes | — | Dark/light mode |
| Recharts | — | Analytics charts (speed, accuracy, revenue) |
| Framer Motion | — | Page transitions and micro-interactions |
| Sonner | — | Toast notifications |
| TanStack Table | — | Sortable, filterable data tables |
| canvas-confetti | — | Achievement and payment celebrations |
| Lucide React | — | Icons |

### Mobile

| Technology | Version | Role |
|------------|---------|------|
| Expo | SDK 54 | Mobile framework |
| React Native | 0.81 | Native UI |
| React Navigation | 7.x | Drawer & stack navigation |
| Expo Secure Store | — | Encrypted token storage |
| Expo Document Picker | — | Material uploads |
| Expo Notifications | — | Push notification registration (FCM) |
| Expo AV | — | Shorthand dictation audio playback |
| React Native WebView | — | Razorpay payment checkout |

---

## 5. User Roles & Access

### Admin

The institute owner or office manager. Full control over all data.

**Capabilities:**
- View institute-wide dashboard (students, teachers, fees, attendance, exams)
- Add, block, and archive students and teachers
- Manage courses, batches, fees, and exams
- Access the **Records Database** (permanent archive of past students)
- View attendance records across all batches
- Generate report placeholders (PDF/Excel export UI ready)
- Issue certificates

### Teacher

Assigned to one or more batches. Manages day-to-day teaching.

**Capabilities:**
- View assigned batches and student list
- Mark daily attendance (present / absent / late / leave)
- Start and end live classes (room ID generated)
- Upload study materials (PDF, video, audio) to the library
- View and create exams
- See student performance scores

### Student

Enrolled learner. Uses the platform for study and practice.

**Capabilities:**
- View personal dashboard (attendance %, fees, streak, upcoming exams)
- Browse enrolled courses and materials
- **Typing practice** — English and Hindi with live WPM, accuracy, and timer
- **Shorthand practice** — speed selector (80–140 WPM) with dictation UI
- Take exams (portal ready)
- View and pay fees (UPI button UI ready)
- Access digital library (search and filter by category)
- View and verify certificates
- Chat with **AI Study Coach** for doubts and study plans
- **AI Shorthand Evaluator** — play teacher-uploaded audio, type answer, get accuracy/WPM/mistake highlights
- **Gamification** — XP, levels, daily streaks, badges, batch & institute leaderboards
- **Advanced Analytics** — speed/accuracy trends, practice heatmap, AI insights, batch comparison
- **Timed Exams** — MCQ, typing, and shorthand with auto-submit and instant results
- **Razorpay Payments** — pay fees online with receipt history
- View achievements with celebration animations

### Parent (View-Only)

Linked to one or more students by the admin. Cannot edit any data.

**Capabilities:**
- View linked children's attendance percentage and records
- View fee status, due dates, and payment history
- View recent exam scores and shorthand progress
- View issued certificates
- Receive alerts (when FCM/WhatsApp configured)

---

## 6. Backend (API Server)

The backend is a REST API served at `http://localhost:5000/api` in development. All three clients (web, mobile) communicate through this single API.

### 6.1 API Route Groups

| Route Prefix | Description | Access |
|--------------|-------------|--------|
| `/api/health` | Server health check | Public |
| `/api/auth` | Login, register, current user | Public / Authenticated |
| `/api/admin` | Admin dashboard, students, teachers, database | Admin only |
| `/api/teacher` | Teacher dashboard data | Teacher only |
| `/api/student` | Student dashboard, typing practice save | Student only |
| `/api/courses` | Course listing and management | Mixed |
| `/api/batches` | Batch listing and management | Admin |
| `/api/attendance` | Attendance records and bulk marking | Admin, Teacher |
| `/api/fees` | Fee records and payment recording | Admin, Student (view) |
| `/api/exams` | Exam CRUD, timed attempts, auto-grading, results | Admin, Teacher, Student |
| `/api/shorthand` | Dictation upload, AI evaluation, attempt history | Admin, Teacher, Student |
| `/api/gamification` | XP, badges, leaderboards (week/month) | Student |
| `/api/analytics` | Progress graphs, heatmap, AI insights, batch comparison | Student, Teacher, Admin |
| `/api/payments` | Razorpay orders, verify, history, webhook | Student, Admin |
| `/api/parent` | View-only child data (attendance, fees, scores) | Parent |
| `/api/notifications` | In-app alerts, FCM device tokens, send triggers | All authenticated |
| `/api/library` | Digital study materials | All authenticated |
| `/api/certificates` | Certificate issue and verification | Admin, Student |
| `/api/live-classes` | Live class start/end/join | Teacher, Student |
| `/api/ai` | AI coach and question generation | Authenticated |
| `/api/upload` | File upload to Cloudinary (images, audio, PDFs) | Admin, Teacher |

### 6.2 Key Admin API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Stats, revenue chart data |
| GET | `/admin/students` | Active student list |
| POST | `/admin/students` | Create new student |
| PUT | `/admin/students/:userId` | Update student (block/activate) |
| DELETE | `/admin/students/:userId` | Archive student to database |
| GET | `/admin/teachers` | Active teacher list |
| POST | `/admin/teachers` | Create new teacher |
| PUT | `/admin/teachers/:userId` | Update teacher (block/activate) |
| DELETE | `/admin/teachers/:userId` | Archive teacher to database |
| GET | `/admin/database` | Archived students & teachers |
| GET | `/admin/records/:userId` | Full history (certificates, fees, attendance) |
| POST | `/admin/parents` | Create parent account and link to student |
| POST | `/admin/parents/link` | Link existing parent to student |
| GET | `/admin/parents` | List parents with linked children |

### 6.3 Shorthand API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shorthand` | List dictations (students see batch-filtered) |
| GET | `/shorthand/:id` | Get dictation (transcript hidden for students until submit) |
| POST | `/shorthand` | Create dictation with Cloudinary audio URL |
| PUT | `/shorthand/:id` | Update dictation |
| DELETE | `/shorthand/:id` | Deactivate dictation |
| POST | `/shorthand/:id/attempt` | Submit typed answer — returns accuracy, WPM, mistakes, XP |
| GET | `/shorthand/attempts` | Student's attempt history |
| GET | `/shorthand/progress` | Progress graphs data |

### 6.4 Gamification API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gamification/leaderboard?period=week\|month&scope=batch\|institute` | Rankings |
| GET | `/gamification/achievements` | Badges and unlock status |
| GET | `/gamification/my-stats` | XP, level, streak, sessions |

### 6.5 Analytics API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/student` | WPM/accuracy/XP trend data |
| GET | `/analytics/heatmap` | 90-day practice consistency heatmap |
| GET | `/analytics/insights` | Groq AI-generated study insights |
| GET | `/analytics/batch/:batchId/comparison` | Student vs batch average |

### 6.6 Exam API Endpoints (Extended)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams/:id` | Exam details (answers hidden for students) |
| POST | `/exams/:id/start` | Start timed attempt |
| POST | `/exams/:id/submit` | Submit answers — auto-grade MCQ/typing/shorthand |
| GET | `/exams/my-attempts` | Student exam history |
| GET | `/exams/:id/results` | Rankings and detailed results |

### 6.7 Payment API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create-order` | Create Razorpay order for a fee |
| POST | `/payments/verify` | Verify payment signature after checkout |
| GET | `/payments/history` | Payment receipt history |
| POST | `/payments/webhook` | Razorpay webhook (updates fee status) |

### 6.8 Parent API Endpoints (Read-Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/parent/children` | List linked children |
| GET | `/parent/children/:studentId/dashboard` | Child overview |
| GET | `/parent/children/:studentId/attendance` | Attendance records |
| GET | `/parent/children/:studentId/fees` | Fee status and history |
| GET | `/parent/children/:studentId/scores` | Exam and shorthand scores |
| GET | `/parent/children/:studentId/certificates` | Issued certificates |

### 6.9 Notification API Endpoints (Extended)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/device-token` | Register FCM push token (web/mobile) |
| DELETE | `/notifications/device-token` | Remove token on logout |
| POST | `/notifications/send` | Admin/teacher send alert (triggers FCM + WhatsApp) |

### 6.10 Pre-loaded Courses (via Seed)

When `npm run seed` is executed, these courses are created:

| Course | Category | Fee |
|--------|----------|-----|
| Shorthand 80 WPM | shorthand | ₹8,000 |
| Shorthand 100 WPM | shorthand | ₹10,000 |
| Shorthand 120 WPM | shorthand | ₹12,000 |
| Shorthand 140 WPM | shorthand | ₹15,000 |
| Hindi Typing | typing | ₹5,000 |
| English Typing | typing | ₹5,000 |
| Computer Basics | computer | ₹4,000 |
| CCC Preparation | ccc | ₹6,000 |

### 6.11 Environment Variables

Create `backend/.env` from `backend/.env.example`:

```
MONGO_URI=              → MongoDB connection string
JWT_SECRET=             → Secret key for login tokens
JWT_EXPIRES_IN=7d       → Token validity period
PORT=5000               → Server port
CLOUDINARY_CLOUD_NAME=  → Cloudinary cloud name
CLOUDINARY_API_KEY=     → Cloudinary API key
CLOUDINARY_API_SECRET=  → Cloudinary API secret
GROQ_API_KEY=           → AI coach, shorthand evaluator, analytics insights
RAZORPAY_KEY_ID=        → Razorpay public key (rzp_test_... or rzp_live_...)
RAZORPAY_KEY_SECRET=    → Razorpay secret key
RAZORPAY_WEBHOOK_SECRET=→ Webhook signature verification secret
FIREBASE_PROJECT_ID=    → Firebase project ID (for FCM push)
FIREBASE_CLIENT_EMAIL=  → Firebase service account email
FIREBASE_PRIVATE_KEY=   → Firebase service account private key (escape newlines)
MSG91_AUTH_KEY=         → MSG91 API key for WhatsApp/SMS (optional)
MSG91_SENDER_ID=        → MSG91 sender ID (optional)
MSG91_TEMPLATE_ID=      → MSG91 template ID for alerts (optional)
FRONTEND_URL=           → Allowed CORS origin for production
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

**Mobile** (`mobile/.env`):
```
EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_IP:5000/api
```

#### Configuring Firebase (Push Notifications)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Go to Project Settings → Service Accounts → Generate new private key
3. Copy `project_id`, `client_email`, and `private_key` into `backend/.env`
4. For mobile: add `expo-notifications` plugin in `app.json` and set EAS `projectId`
5. Push tokens are registered automatically on login via `/api/notifications/device-token`

#### Configuring Razorpay

1. Create account at [razorpay.com](https://razorpay.com) and get test/live API keys
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in backend `.env`
3. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` in frontend `.env.local` (same key ID)
4. Configure webhook URL: `https://your-api.com/api/payments/webhook` with events `payment.captured`
5. Set `RAZORPAY_WEBHOOK_SECRET` from Razorpay dashboard

Firebase and MSG91 degrade gracefully when not configured — in-app notifications still work.

### 6.12 Running the Backend

```bash
cd backend
npm install
npm run dev          # Development with auto-reload
npm run seed         # Load sample data (run once)
npm start            # Production
```

---

## 7. Frontend (Web Application)

The web application is built with **Next.js 16** and provides a responsive interface that works on desktop, tablet, and mobile browsers.

**URL (local):** `http://localhost:3000`

### 7.1 Public Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing Page | `/` | Institute introduction, feature highlights, login button |
| Login | `/login` | Email/password login with theme selector |

### 7.2 Admin Pages (10 pages)

| Page | URL | What It Does |
|------|-----|--------------|
| Dashboard | `/admin` | 8 stat cards, revenue bar chart, quick action links |
| Students | `/admin/students` | Student table; add, block, archive students |
| Teachers | `/admin/teachers` | Teacher cards; add, block, archive teachers |
| Courses | `/admin/courses` | Course cards; create new courses |
| Batches | `/admin/batches` | View all batches with timing and strength |
| Attendance | `/admin/attendance` | Read-only attendance records across institute |
| Fees | `/admin/fees` | Fee table; add records, record payments |
| Exams | `/admin/exams` | View all scheduled exams |
| Reports | `/admin/reports` | Report cards with PDF/Excel export buttons |
| Database | `/admin/database` | Permanent archive; search past students & teachers |

### 7.3 Teacher Pages (7 pages)

| Page | URL | What It Does |
|------|-----|--------------|
| Dashboard | `/teacher` | Batches, student progress, live class CTA |
| Students | `/teacher/students` | List of assigned students with scores |
| Attendance | `/teacher/attendance` | Mark present/absent/late/leave per student |
| Live Classes | `/teacher/classes` | Start/end class, copy room ID, media controls |
| Exams | `/teacher/exams` | Create timed exams (MCQ, typing, shorthand) |
| Shorthand | `/teacher/shorthand` | Upload audio dictations via Cloudinary |
| Materials | `/teacher/materials` | Upload PDFs, videos, audio to library |

### 7.4 Student Pages (13 pages)

| Page | URL | What It Does |
|------|-----|--------------|
| Dashboard | `/student` | XP/level ring, streak, quick actions, badge celebrations |
| Courses | `/student/courses` | Browse available courses |
| Typing Practice | `/student/typing` | Focus mode, keyboard shortcuts, WPM tracker |
| Shorthand | `/student/shorthand` | AI evaluator — play audio, type, see mistakes & progress |
| Analytics | `/student/analytics` | Speed/accuracy charts, heatmap, AI insights |
| Leaderboard | `/student/leaderboard` | Batch & institute rankings (week/month) |
| Exams | `/student/exams` | Upcoming exams and past attempts |
| Exam Take | `/student/exams/[id]` | Timed exam with auto-submit |
| Exam Results | `/student/exams/[id]/results` | Score breakdown and solutions |
| Fees | `/student/fees` | Razorpay payment, receipt history, confetti on success |
| Library | `/student/library` | Searchable digital materials |
| Certificates | `/student/certificates` | View certificates; verify by ID |
| AI Coach | `/student/ai-coach` | Chat-based AI study assistant |

### 7.5 Parent Pages (5 pages — View-Only)

| Page | URL | What It Does |
|------|-----|--------------|
| Dashboard | `/parent` | Child overview — attendance %, fees, recent scores |
| Attendance | `/parent/attendance` | Child attendance records |
| Fees | `/parent/fees` | Fee status, due dates, payment history |
| Progress | `/parent/progress` | Exam scores and shorthand progress |
| Certificates | `/parent/certificates` | Child's issued certificates |

### 7.6 Web Layout Features

- **Sidebar navigation** — role-specific menu on the left (admin, teacher, student, parent)
- **Mobile responsive** — collapsible hamburger menu on small screens
- **Notification bell** — unread count with dropdown list
- **Theme selector** — 5 colour themes + dark/light mode
- **Framer Motion** — smooth page transitions and stat card animations
- **Sonner toasts** — success/error feedback on actions
- **Skeleton loaders** — loading states on all data-fetching pages
- **Confetti celebrations** — badge unlocks and successful payments
- **TanStack Table** — sortable, filterable tables on admin pages
- **Protected routes** — unauthenticated users redirected to login
- **Role guard** — users can only access their own role's pages

### 7.7 Running the Frontend

```bash
cd frontend
npm install
# Create .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:5000/api
#   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
npm run dev          # http://localhost:3000
npm run build        # Production build
```

---

## 8. Mobile Application

The mobile app is built with **Expo SDK 54** and provides the **same features and navigation** as the web application, optimised for phone screens.

It uses a **drawer sidebar** (slide-in menu) identical in structure to the web sidebar.

### 8.1 How Mobile Connects to Backend

When testing on a physical phone with Expo Go, the phone cannot use `localhost`. The app automatically detects the computer's Wi-Fi IP address, or you can set it manually in `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_IP:5000/api
```

Phone and laptop must be on the **same Wi-Fi network**.

### 8.2 Mobile Screens (35+ total)

The mobile app mirrors every web page:

**Admin (10 screens):** Dashboard, Students, Teachers, Courses, Batches, Attendance, Fees, Exams, Reports, Database

**Teacher (7 screens):** Dashboard, Students, Attendance, Live Classes, Exams, Shorthand Upload, Materials

**Student (13 screens):** Dashboard, Courses, Typing, Shorthand (AI evaluator), Analytics, Leaderboard, Exams, Exam Take, Exam Results, Fees (Razorpay), Library, Certificates, AI Coach

**Parent (5 screens):** Dashboard, Attendance, Fees, Progress, Certificates

### 8.3 Mobile-Specific Features

- **Secure token storage** — login session encrypted on device
- **Push notifications** — FCM token registered on login via `expo-notifications`
- **Audio playback** — shorthand dictations via `expo-av`
- **Razorpay WebView** — fee payment checkout (Expo Go compatible)
- **Document picker** — teachers can upload dictation audio from phone storage
- **Clipboard** — copy live class room ID with one tap
- **External links** — library materials open in phone browser
- **Theme persistence** — colour and dark mode saved on device

### 8.4 Running the Mobile App

```bash
cd mobile
npm install
npx expo start --clear
# Scan QR code with Expo Go app on your phone
```

For production app store release:
```bash
npx eas build --platform android
npx eas build --platform ios
```

---

## 9. Database Design

All data is stored in **MongoDB**. The following 19 collections (models) are used:

| Model | Stores |
|-------|--------|
| **User** | Login credentials, name, email, role (admin/teacher/student/parent), active/archived status |
| **StudentProfile** | Course, batch, fees, attendance %, XP, level, streak, badges, practice history |
| **TeacherProfile** | Qualification, experience, salary, assigned batches, rating |
| **Course** | Course name, category, level, fee, duration |
| **Batch** | Batch name, timing (morning/evening), teacher, enrolled students |
| **Attendance** | Daily attendance per student per batch |
| **Fee** | Fee amount, paid amount, due date, payment status, receipt number |
| **Exam** | Exam title, type, schedule, questions (MCQ/typing/shorthand), marks |
| **ExamAttempt** | Student exam submissions, scores, auto-graded answers, time taken |
| **ShorthandDictation** | Teacher-uploaded audio URL, transcript, target WPM, batch |
| **ShorthandAttempt** | Student submissions with accuracy, WPM, mistakes, improvement |
| **PracticeSession** | Daily practice log for heatmap (typing, shorthand, exam) |
| **Payment** | Razorpay order/payment IDs, amount, status, receipt |
| **ParentLink** | Parent-to-student relationship mapping |
| **DeviceToken** | FCM push tokens per user/device |
| **Notification** | Alerts for fees, exams, achievements |
| **Library** | Study materials (PDF, video, audio, notes) with tags |
| **Certificate** | Issued certificates with unique ID for verification |
| **LiveClass** | Live session room ID, status, participants |

### User Status Fields

| Field | Meaning |
|-------|---------|
| `isActive: true` | User can log in |
| `isActive: false` | User is blocked (cannot log in) |
| `isArchived: true` | User removed from active list; all records preserved in Database |

---

## 10. Authentication & Security

| Feature | Implementation |
|---------|----------------|
| Password storage | bcrypt hashing (12 rounds) |
| Session tokens | JWT (JSON Web Token), 7-day expiry |
| Route protection | Middleware checks token on every protected API call |
| Role enforcement | Admin/Teacher/Student/Parent routes restricted by role |
| Blocked users | `isActive: false` prevents login |
| Mobile token | Stored in Expo Secure Store (encrypted) |
| Web token | Stored in browser localStorage |
| CORS | Configured for localhost and Vercel domains |

---

## 11. Third-Party Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **MongoDB Atlas** | Cloud database hosting | Configured |
| **Cloudinary** | Images, audio dictations, study materials, certificates | Configured |
| **Groq AI** | AI coach, shorthand evaluation, analytics insights | Configured |
| **Razorpay** | Online fee payments (web + mobile) | Integrated (needs API keys) |
| **Firebase FCM** | Push notifications on mobile | Integrated (needs service account) |
| **MSG91 / WhatsApp** | Fee/exam/achievement alerts via WhatsApp | Integrated (optional, needs API key) |
| **Vercel** | Frontend and backend deployment | Ready |
| **Google OAuth** | Social login | Scaffolded (env vars ready, UI not active) |
| **WebRTC / Jitsi** | Full live video classes | Room ID system ready, video SDK not connected |

---

## 12. Theme & User Interface

Both web and mobile support a unified theme system:

### Colour Themes (5 options)

| Theme | Primary Colour | Best For |
|-------|---------------|----------|
| Orange (default) | `#ea580c` | Luv Kush brand identity |
| Pink | `#db2777` | Alternative branding |
| Green | `#16a34a` | Fresh look |
| Blue | `#2563eb` | Professional look |
| Mono (Black) | `#18181b` | Minimalist |

### Display Modes

- **Light mode** — white backgrounds, dark text
- **Dark mode** — dark backgrounds, light text (reduces eye strain)

Theme choice is saved locally and persists across sessions on both web and mobile.

---

## 13. Records Database (Permanent Archive)

A key feature for long-running institutes: when a student completes their course or a teacher leaves, the admin can **archive** them instead of deleting their data.

### What Happens on Archive

1. Student/teacher is removed from the active management list
2. They can no longer log in
3. **All historical data is permanently preserved:**
   - Performance scores and attendance percentage
   - Every fee payment record
   - All issued certificates (with verification IDs)
   - Full attendance history

### Accessing Archived Records

- **Web:** Admin sidebar → **Database**
- **Mobile:** Admin drawer → **Database**
- Search by name or email
- Filter by Students / Teachers
- Tap any record to view complete history

This ensures a student who passed 5 years ago can still have their certificate and scores looked up by the institute.

---

## 14. Deployment Guide

### Recommended Production Architecture

```
Users (Browser / Phone)
        ↓
  Vercel (Frontend)  →  https://luvkush.vercel.app
        ↓
  Vercel (Backend)     →  https://luvkush-api.vercel.app/api
        ↓
  MongoDB Atlas        →  Cloud database
        ↓
  Cloudinary           →  File storage
```

### Steps to Go Live

1. **Database:** Create MongoDB Atlas cluster; add connection string to `backend/.env`
2. **Backend:** Deploy `backend/` folder to Vercel; set all environment variables
3. **Frontend:** Deploy `frontend/` folder to Vercel; set `NEXT_PUBLIC_API_URL` to backend URL
4. **Seed data:** Run `npm run seed` once on the production database
5. **Change passwords:** Update all default admin/teacher/student passwords immediately
6. **Mobile:** Update `mobile/.env` with production API URL; build with EAS; submit to Play Store

---

## 15. Local Development Setup

### Prerequisites

- Node.js 18 or higher
- MongoDB (local or Atlas free tier)
- Expo Go app on phone (for mobile testing)

### Step-by-Step

**Terminal 1 — Backend:**
```bash
cd backend
cp .env.example .env        # Fill in your values
npm install
npm run seed                # First time only
npm run dev                 # Runs on port 5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
npm install
npm run dev                 # Runs on port 3000
```

**Terminal 3 — Mobile:**
```bash
cd mobile
# Set EXPO_PUBLIC_API_URL to your laptop Wi-Fi IP
npm install
npx expo start --clear
```

---

## 16. Default Login Credentials

> ⚠️ **Change all passwords before going live in production.**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@luvkush.com` | `admin123` |
| Teacher | `teacher@luvkush.com` | `teacher123` |
| Student | `student@luvkush.com` | `student123` |
| Parent | `parent@luvkush.com` | `parent123` (linked to student Priya Sharma) |

Run `npm run seed` in the `backend/` folder to create these accounts and sample data.

---

## 17. Features Delivered

### Core Platform (v1.0)

- [x] Role-based login (Admin, Teacher, Student, Parent)
- [x] Admin dashboard with live statistics
- [x] Student management (add, block, archive)
- [x] Teacher management (add, block, archive)
- [x] Course and batch management
- [x] Fee management and payment recording
- [x] Attendance viewing and bulk marking
- [x] Digital library with search and categories
- [x] Certificate viewing and ID verification
- [x] AI Study Coach (Groq-powered chat)
- [x] Live class room ID system (start/end/copy)
- [x] Study material upload (Cloudinary)
- [x] In-app notifications
- [x] Records Database (permanent archive)
- [x] 5 colour themes + dark/light mode (web + mobile)
- [x] Responsive web layout (desktop + mobile browser)
- [x] Full mobile app mirroring all web features

### Engagement & Learning (v2.0 — New)

- [x] **AI Shorthand Evaluator** — Cloudinary audio upload, student editor, Groq-powered evaluation (accuracy, WPM, mistake highlights, improvement tracking)
- [x] **Gamification** — XP points, levels, daily streaks, badge system, batch & institute leaderboards
- [x] **Achievement celebrations** — confetti animations on badge unlock (web + mobile)
- [x] **Advanced Student Analytics** — speed/accuracy trend graphs, practice heatmap, AI insights, batch comparison
- [x] **Complete Exam Module** — timed MCQ/typing/shorthand exams, auto-submit, instant results, exam history
- [x] **Razorpay Payment Gateway** — online fee payment on web and mobile, payment history, real-time fee status update
- [x] **Parent Portal** — view-only access to child's attendance, fees, scores, certificates
- [x] **Push Notifications (FCM)** — device token registration, notification triggers on mobile
- [x] **WhatsApp Alerts (MSG91)** — fee reminders, exam schedule, achievements, attendance warnings (when configured)
- [x] **Enhanced Typing Practice** — focus mode, keyboard shortcuts, skeleton loaders
- [x] **Motivational Student Dashboard** — XP ring, streak counter, quick action cards, Framer Motion animations
- [x] **Teacher Shorthand Upload** — create dictations with Cloudinary audio
- [x] **UI/UX Upgrades** — Framer Motion, Sonner toasts, TanStack Table, skeleton loaders, confetti

### Needs External API Keys to Go Live

- [ ] Razorpay — add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (test keys work for demo)
- [ ] Firebase FCM — add service account credentials for push notifications
- [ ] MSG91 — add API key for WhatsApp alerts (optional)

### UI Ready (Not Yet Connected)

- [ ] Full live video streaming (room system ready, WebRTC not integrated)
- [ ] Google OAuth social login (env vars ready)
- [ ] PDF/Excel report export (buttons present)

---

## 18. Planned / Future Enhancements

| Enhancement | Benefit |
|-------------|---------|
| Full video live classes | Real camera/mic streaming inside the app |
| Google Sign-In | Students log in with Gmail |
| SMS OTP login | Phone-number-based login for rural students |
| Automated report PDFs | One-click downloadable reports |
| Hindi UI language | Full interface in Hindi |
| Biometric login (mobile) | Fingerprint login on phone |
| Matter.js physics interactions | Fun particle effects on practice screens |
| Live leaderboard updates | Real-time rank changes via Firebase |
| Whisper auto-transcription | Auto-generate dictation transcripts from audio |
| Scheduled WhatsApp campaigns | Automated daily practice reminders |

---

## 19. Support & Maintenance Notes

### Changing Admin Password

Log in as admin → the password can be changed by updating the user directly in MongoDB or by adding a "Change Password" feature in a future update.

### Adding New Courses

Admin → Courses → Create Course (web or mobile).

### Backing Up Data

All data is in MongoDB Atlas. Enable automated backups in the Atlas dashboard (recommended for production).

### If the Mobile App Cannot Connect

1. Ensure backend is running (`npm run dev` in `backend/`)
2. Phone and laptop on the same Wi-Fi
3. Update `mobile/.env` with correct laptop IP (`ipconfig` on Windows)
4. Allow port 5000 through Windows Firewall
5. Restart Expo with `npx expo start --clear`

### Project Contacts for Development

| Item | Location |
|------|----------|
| API health check | `GET /api/health` |
| Seed script | `backend/src/seed.js` |
| Environment templates | `*/.env.example` files |
| This documentation | `docs/PROJECT_DOCUMENTATION.md` |

---

*This document describes the Luv Kush Classes platform as delivered. For questions, change requests, or approval of additional features listed in Section 18, please contact the development team.*

**Luv Kush Classes — Shorthand & Typing Coaching Platform**  
*Built with Node.js · Next.js · React Native · MongoDB · Expo*