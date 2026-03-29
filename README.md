# FamilyCalendar

A beautiful, Hearth Display-inspired family calendar web app that aggregates Google Calendar and Outlook calendars for all family members into a shared weekly overview.

## Features

- **Gantt-style Week View** — See everyone's free/busy at a glance with horizontal time bars
- **Detailed Day View** — Click any day to see side-by-side schedules with full event details
- **Multi-provider** — Supports both Google Calendar and Microsoft Outlook
- **Encrypted credentials** — OAuth tokens encrypted with AES-256-GCM, key stored as Worker secret
- **Edge-deployed** — Runs on Cloudflare Pages + Workers + D1 for fast global access

## Tech Stack

- **Frontend**: SvelteKit + Tailwind CSS v4
- **Backend**: Cloudflare Workers (via SvelteKit server routes)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Sessions**: Cloudflare KV
- **Encryption**: Web Crypto API (AES-256-GCM)

## Setup

### Prerequisites

1. [Node.js](https://nodejs.org/) 18+
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
3. A Cloudflare account
4. Google Cloud Console project with Calendar API enabled
5. Azure AD (Entra) app registration with Microsoft Graph Calendar permissions

### 1. Install dependencies

```bash
npm install
```

### 2. Create Cloudflare resources

```bash
# Create D1 database
wrangler d1 create family-calendar-db
# Copy the database_id to wrangler.jsonc

# Create KV namespace
wrangler kv namespace create SESSIONS
# Copy the namespace id to wrangler.jsonc
```

### 3. Run database migration

```bash
wrangler d1 execute family-calendar-db --file=./migrations/0001_init.sql
```

### 4. Generate encryption key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Set secrets

```bash
wrangler secret put ENCRYPTION_KEY
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put OUTLOOK_CLIENT_ID
wrangler secret put OUTLOOK_CLIENT_SECRET
```

### 6. Configure OAuth redirect URIs

- **Google**: Add `https://your-domain.pages.dev/auth/google/callback` to authorized redirect URIs
- **Outlook**: Add `https://your-domain.pages.dev/auth/outlook/callback` as a redirect URI

### 7. Local development

```bash
npm run dev
```

### 8. Deploy

```bash
npm run build
wrangler pages deploy .svelte-kit/cloudflare
```

## Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── crypto.ts           # AES-256-GCM encryption
│   │   ├── db.ts               # D1 database queries
│   │   ├── events.ts           # Event aggregation
│   │   ├── google-calendar.ts  # Google OAuth + API
│   │   ├── outlook-calendar.ts # Outlook OAuth + API
│   │   └── session.ts          # KV session management
│   ├── components/
│   │   ├── WeekView.svelte     # Gantt-style week overview
│   │   ├── GanttRow.svelte     # Member's busy bars
│   │   ├── DayView.svelte      # Detailed day schedule
│   │   ├── MemberLegend.svelte # Color legend
│   │   └── WeekNav.svelte      # Week/day navigation
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Date utilities
├── routes/
│   ├── +page.svelte            # Main calendar view
│   ├── +page.server.ts         # Load events
│   ├── setup/                  # Family setup page
│   └── auth/                   # OAuth callback routes
└── app.d.ts                    # Cloudflare env types
```

## Security

- OAuth tokens are encrypted with AES-256-GCM before storage
- Encryption key stored as a Cloudflare Worker secret (never in code)
- Fresh IV generated for every encryption operation
- Session cookies: HTTP-only, Secure, SameSite=Lax
- D1 and KV data encrypted at rest by Cloudflare
