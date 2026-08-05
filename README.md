<div align="center">

# 🚗 AutoMacha

### The Campus Ride-Share Platform That Just Works.

**Match rides. Split fares. Chat securely. All in one tap.**

Built by students, for students — live and serving the IIITDM Kurnool campus.

[![Live App](https://img.shields.io/badge/🌐_Live_App-automacha-863BFF?style=for-the-badge)](https://automacha.vercel.app)
[![Backend API](https://img.shields.io/badge/⚡_API-Render-46E3B7?style=for-the-badge)](https://automacha-backend.onrender.com/api/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 💡 The Problem

Getting an auto from IIITDM Kurnool campus to the city? You're either overpaying alone, or frantically texting batch groups hoping someone's going your way at the same time. It's chaotic, unreliable, and expensive.

## ✅ The Solution

**AutoMacha** eliminates the guesswork. Post where you're going, get instantly matched with others heading the same direction, coordinate through end-to-end encrypted chat, and split the fare — all from a slick PWA that works on any device, even offline.

---

## 🔥 What Makes It Powerful

<table>
<tr>
<td width="50%">

### 🎯 Smart Matching
Post a travel request and AutoMacha finds others heading your way — filtered by destination, time window, and proximity. No more spamming group chats.

### 💬 Real-Time E2EE Chat
Matched with someone? Jump into a WebSocket-powered chat room with **AES-256-GCM end-to-end encryption**. Your conversations stay private, period.

### 📲 Installable PWA
Add it to your home screen. It loads instantly, works offline, and feels native — no app store required.

</td>
<td width="50%">

### 🔔 Instant Notifications
Ride connect requests, match alerts, and updates — delivered in real-time so you never miss a ride.

### 🛡️ Campus-Only Security
Institute email verification (`@iiitk.ac.in`), JWT auth with token rotation, OTP-based login, and account lockout protection. Only verified students get in.

### 📊 Live Dashboard
Real-time campus ride stats, active request counts, and trends — refreshed every minute via background jobs.

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│           React 19 · TypeScript · Vite 8 · PWA              │
│         TailwindCSS · React Router 7 · Radix UI             │
│                   Deployed on Vercel                        │
└──────────────────────┬──────────────────────────────────────┘
                       │  REST (Axios)  &  WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                        BACKEND                              │
│          Django 5 · DRF · Daphne (ASGI)                     │
│        Django Channels (WebSocket) · SimpleJWT              │
│                   Deployed on Render                        │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL          Redis (optional)       Celery + Beat   │
│  Primary DB          Cache · Channels       Background Jobs │
│                      Broker                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Feature Breakdown

| Module | What It Does |
|---|---|
| **Accounts** | Register, login (username / roll number / email), OTP verification, JWT access + refresh tokens, profile with avatar |
| **Travel Requests** | Create, edit, browse & auto-expire ride requests with daily + active limits |
| **Matching** | Destination-aware smart matching with time-window & distance filters |
| **Chat** | WebSocket rooms per ride match with AES-256-GCM E2EE, JWT-authenticated |
| **Ride Connect** | One-tap ride request to matched travelers via WhatsApp, email, or in-app notification |
| **Notifications** | Real-time in-app alerts with auto-cleanup & retention policies |
| **Dashboard** | Aggregated campus ride stats with periodic cache refresh |
| **Ride History** | Complete ride logs with filtering & search |
| **Auto-Drivers** | Campus auto-driver directory with contact info |
| **Admin Portal** | Full admin suite for user & platform management |
| **Destinations** | Pre-seeded campus destinations + custom destination support |

---

## 🚀 Run It Locally

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |
| Redis | *(optional — only for production)* |

## 🔌 API Reference

All endpoints prefixed with `/api/`.

| Route | Module | Description |
|---|---|---|
| `/api/accounts/` | Auth & Profiles | Registration, login, OTP, password reset, profile |
| `/api/travel-requests/` | Travel Requests | CRUD, matching, expiry |
| `/api/destinations/` | Destinations | Browse & manage destinations |
| `/api/dashboard/` | Dashboard | Campus-wide ride statistics |
| `/api/notifications/` | Notifications | User notification feed |
| `/api/auto-drivers/` | Auto-Drivers | Driver directory |
| `/api/admin-portal/` | Admin Portal | Admin-only management APIs |
| `/api/ride-history/` | Ride History | Past ride records |
| `/api/chat/` | Chat | Chat room REST endpoints |
| `/api/health/` | Health | Liveness & readiness probes |
| `/api/metrics/` | Metrics | System metrics export |

**WebSocket**: `ws://<host>/ws/chat/<room>/` — JWT-authenticated, E2EE-ready

---

## ⏱️ Background Jobs

| Job | Frequency | Purpose |
|---|---|---|
| Expire stale requests | Every 5 min | Auto-closes expired travel requests |
| OTP cleanup | Hourly | Purges used & expired OTPs |
| Notification cleanup | Daily @ midnight | Removes notifications past retention |
| Dashboard cache refresh | Every 1 min | Keeps dashboard stats real-time |
| System health check | Hourly | Monitors DB, cache, & service health |

---

## 🛡️ Security & Privacy

- **JWT Authentication** — short-lived access tokens (15 min), 7-day refresh with rotation & blacklisting
- **End-to-End Encryption** — AES-256-GCM for all chat messages, keys derived per-room via HKDF
- **OTP Verification** — 6-digit codes with configurable expiry & rate limits
- **Account Lockout** — auto-locks after 5 failed login attempts for 15 minutes
- **Rate Limiting** — per-endpoint throttling (anon: 30/min, authenticated: 120/min)
- **Production Hardening** — HTTPS-only, HSTS, CSP headers, `X-Frame-Options: DENY`
- **Campus-Only Registration** — restricted to verified institute email domains

---

## 🚢 Deployment

| Service | Platform | Config |
|---|---|---|
| Backend API + WebSocket | **Render** (Daphne ASGI) | [`render.yaml`](render.yaml) |
| PostgreSQL Database | **Render** (Free tier) | [`render.yaml`](render.yaml) |
| Frontend PWA | **Vercel** | [`frontend/vercel.json`](frontend/vercel.json) |

---

## 📁 Project Structure

```
AutoMacha/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # Auth, OTP, profiles, multi-field login
│   │   ├── admin_portal/      # Admin-only management APIs
│   │   ├── auto_drivers/      # Campus auto-driver directory
│   │   ├── chat/              # WebSocket chat + E2EE + JWT middleware
│   │   ├── common/            # Shared middleware, logging, utilities
│   │   ├── dashboard/         # Aggregated stats & background cache
│   │   ├── destinations/      # Destination CRUD & seed data
│   │   ├── notifications/     # Real-time notification system
│   │   ├── ride_history/      # Ride history & records
│   │   └── travel_requests/   # Core request lifecycle & matching
│   ├── config/                # Settings, URLs, ASGI, app_config
│   ├── requirements.txt
│   └── build.sh               # Render build script
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level pages
│   │   ├── services/          # API service layer (Axios)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # Auth & app context providers
│   │   ├── routes/            # Route definitions & guards
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Helpers (crypto, formatting, etc.)
│   │   └── config/            # Centralized app configuration
│   ├── vite.config.ts         # Vite + PWA configuration
│   └── vercel.json            # Vercel deployment config
├── render.yaml                # Render Blueprint (API + DB)
└── LICENSE                    # MIT License
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, TailwindCSS 3, React Router 7, Radix UI, Lucide Icons, Zod, React Hook Form, Axios, PWA (Workbox) |
| **Backend** | Python 3.10+, Django 5, Django REST Framework, Django Channels, Daphne (ASGI), SimpleJWT, Celery, WhiteNoise |
| **Database** | PostgreSQL 14+ |
| **Cache / Broker** | Redis (optional locally, recommended for production) |
| **Infra** | Render (backend), Vercel (frontend) |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Duvva Sai Vivek](https://github.com/duvvasaivivek)**

*Making campus commutes cheaper, safer, and way less chaotic.*

</div>
