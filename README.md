<div align="center">

# bracu.network

**The student and alumni directory for BRAC University.**  
A webring connecting designers, engineers, researchers, and founders — all from BRACU.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

[**bracu.network**](https://bracu.network) · [Join the network](https://bracu.network/join)

</div>

https://github.com/user-attachments/assets/071cdd6c-2d34-4341-8f03-1e84c429d855

---

## What is this?

bracu.network is an open student webring and personal website directory for BRAC University students and alumni. Inspired by [uwaterloo.network](https://uwaterloo.network), it lets the BRACU community discover each other's work, connect across departments, and showcase their personal sites.

It is **not a social network**. It is a curated, low-noise directory of real builders from BRACU — with a public embed widget so members can link to each other from their own websites.

---

## Features

- **Animated hero** — SVG webring pulse animation: an orbiting dot traces a ring of labeled discipline nodes (designers, engineers, researchers, founders), with cross-chord connections and reduced-motion support
- **Live member directory** — searchable, filterable table with avatars, department, website, and social links; filter by student or alumni
- **2D force-directed network graph** — physics-based canvas graph (custom Verlet engine, no library); hover-synced bidirectionally with the member table; draggable nodes; click to open member site
- **Student / alumni differentiation** — members are tagged as current student or alumni; separate filter tabs + coloured badges in the directory
- **Multi-step join form** — 4-step application with progress bar, localStorage draft persistence, drag-and-drop photo upload, real-time social URL validation, rate-limit countdown, and auto-scroll to first error
- **Webring embed widget** — drop a `<script>` tag on your personal site to join the ring
- **Admin dashboard** — full-card view of pending and approved members; approve, reject, remove, and change member type (student/alumni) — all with instant ISR cache revalidation and inline error feedback on action failures
- **Production-hardened** — rate limiting, CSP headers, Row-Level Security, EXIF stripping, Zod validation, auth guard on all mutations

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                           │
│                                                         │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────┐  │
│  │  middleware  │──▶│  Next.js 16    │──▶│  /api/   │  │
│  │  rate-limit  │   │  App Router    │   │  members │  │
│  │  auth-guard  │   │  Server Actions│   │  (REST)  │  │
│  └──────────────┘   └───────┬────────┘   └──────────┘  │
│                              │                          │
└──────────────────────────────┼──────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │           Supabase              │
              │                                 │
              │  ┌──────────────────────────┐   │
              │  │  PostgreSQL (members)     │   │
              │  │  RLS-enforced policies   │   │
              │  └──────────────────────────┘   │
              │  ┌──────────────────────────┐   │
              │  │  Storage (profile photos)│   │
              │  │  EXIF-stripped + resized  │   │
              │  └──────────────────────────┘   │
              │  ┌──────────────────────────┐   │
              │  │  Auth (admin only)       │   │
              │  └──────────────────────────┘   │
              └─────────────────────────────────┘
```

### Key technical decisions

| Decision | Rationale |
|---|---|
| **Next.js App Router + Server Actions** | Form submission happens server-side — no client-side API keys exposed |
| **ISR (60s revalidation) + on-demand revalidation** | Home page is statically cached; admin approvals and type changes bust the cache immediately via `revalidatePath` |
| **Supabase RLS** | Public reads only see `is_approved = true` rows; service-role client used for all mutations via server actions |
| **Custom 2D physics engine** | Force-directed graph built without a third-party library — keeps the bundle lean and gives full control over rendering |
| **`sharp` for image processing** | Profile photos are resized to 400×400 and EXIF metadata (including GPS) is stripped before upload |
| **In-memory sliding-window rate limiter** | No external service required; dual enforcement at middleware and server action level. For multi-region deployments, swap for Upstash Redis. |
| **`zod` for validation** | Strict schema including BRACU-specific student ID regex and `@bracu.ac.bd` email enforcement |
| **localStorage form persistence** | Join form draft is saved to localStorage on every keystroke and restored on revisit |

---

## Security

| Layer | Implementation |
|---|---|
| **HTTP headers** | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy` via `next.config.ts` |
| **Rate limiting** | 5 join submissions/min · 10 admin login attempts/5min (middleware + server action double enforcement) |
| **Auth guard** | `requireAdmin()` called on every admin mutation — validates session server-side via `getUser()` and checks the caller's email against an `ADMIN_EMAILS` allowlist (env var); unauthenticated and unauthorised calls are rejected before any DB access |
| **Input sanitization** | All fields trimmed; `roles` and `interests` arrays capped at 10 items × 60 chars |
| **Image validation** | Magic-byte MIME check (not just extension), 5 MB cap, EXIF strip, sharp resize to 400×400 |
| **Embed XSS protection** | `embed.js` builds DOM nodes via `createElement` / `textContent`; no `innerHTML` interpolation; URLs validated as `https://` only |
| **Database** | Row-Level Security enabled; public reads limited to approved members; all writes go through service-role server actions |
| **Secrets** | `SUPABASE_SERVICE_ROLE_KEY` is server-only (`server-only` import); never bundled to the browser |

---

## Local Development

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works fine)

### Setup

```bash
# 1. Clone
git clone https://github.com/yourusername/bracu-network.git
cd bracu-network

# 2. Install
npm install

# 3. Environment variables
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and service role key
```

### Environment variables

For security, this README does not include inline key values.
Use `.env.example` as the only template source:

```bash
cp .env.example .env.local
```

Then fill in your own values locally. **Never commit `.env.local` or real secrets.**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key — never exposed to the browser |
| `ADMIN_EMAILS` | Comma-separated list of email addresses that have admin access (e.g. `alice@example.com,bob@example.com`) |

### Database

Run this in the Supabase SQL editor to set up the full schema:

```sql
-- 1. Members table
CREATE TABLE public.members (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                            TEXT UNIQUE NOT NULL,
  name                            TEXT NOT NULL,
  website                         TEXT NOT NULL,
  department                      TEXT NOT NULL,
  member_type                     TEXT CHECK (member_type IN ('student', 'alumni')),
  student_id                      TEXT,
  batch                           TEXT,
  current_semester                TEXT,
  expected_graduation_semester    TEXT,
  residential_semester            TEXT,
  residential_semester_public     BOOLEAN DEFAULT false,
  bracu_email                     TEXT,
  email                           TEXT,
  roles                           TEXT[] DEFAULT '{}',
  interests                       TEXT[] DEFAULT '{}',
  connections                     TEXT[] DEFAULT '{}',
  github                          TEXT,
  linkedin                        TEXT,
  twitter                         TEXT,
  instagram                       TEXT,
  profile_pic                     TEXT,
  is_approved                     BOOLEAN DEFAULT false,
  created_at                      TIMESTAMPTZ DEFAULT now(),
  updated_at                      TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "Public can read approved members"
  ON public.members FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can read all members"
  ON public.members FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update members"
  ON public.members FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete members"
  ON public.members FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true);

CREATE POLICY "Public profile photos are viewable by everyone"
  ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
```

> **Note:** The `INSERT` policy is intentionally omitted. All inserts go through `getAdminClient()` in server actions to prevent unauthenticated abuse.

### Run

```bash
npm run dev
# → http://localhost:3000
```

> The dev script runs with `--webpack` (webpack bundler) and `NODE_OPTIONS='--max-old-space-size=4096'`. Turbopack is disabled because of a known panic bug in Next.js 16.2.4 that causes intermittent Turbopack compilation failures in dev. Production builds (`next build`) are unaffected and use the standard webpack pipeline.

---

## Admin dashboard

| Path | Description |
|---|---|
| `/admin/login` | Sign in with your Supabase admin email |
| `/admin` | Full dashboard — pending applications + approved members |

From the dashboard you can:
- **Approve** a pending application (instantly revalidates the home page cache)
- **Reject** a pending application (deletes the row)
- **Remove** an approved member
- **Set member type** (student / alumni) via a dropdown on each card — this controls how members are filtered on the home page

All actions are protected by `requireAdmin()` which validates both the session and the caller's email against the `ADMIN_EMAILS` allowlist. Failures are surfaced as inline error messages on the card.

---

## Joining the network

No technical knowledge required. Go to [bracu.network/join](https://bracu.network/join), fill out the 4-step form, and wait for approval. The form saves your progress automatically — you can close the tab and come back.

## Embedding the webring widget

Once approved, add this to your personal website to join the webring navigation:

```html
<script
  src="https://bracu.network/embed.js"
  data-webring
  data-user="your-slug-here">
</script>
```

This renders a small navigation bar linking to the previous and next member in the ring. The widget uses DOM APIs only — no `innerHTML` interpolation.

---

## Project structure

```
video/
└── index.html          # HyperFrames composition (GSAP, 1920×1080, 14 s)
└── bracu-network.mp4   # Rendered launch video

src/
├── app/
│   ├── admin/          # Protected admin dashboard (approve/reject/remove/setType)
│   ├── api/members/    # Public REST endpoint (embed widget + CORS)
│   ├── join/           # 4-step application form + server actions
│   ├── icon.tsx        # Dynamic favicon
│   ├── layout.tsx      # Root layout + analytics + global footer
│   └── page.tsx        # Home page (ISR 60s + on-demand revalidation)
├── components/
│   ├── AnimatedHero    # SVG webring pulse animation (ring + orbiting dot + chords)
│   ├── HomeClient      # Client shell — wires table ↔ graph hover sync
│   ├── MemberTable     # Searchable/filterable directory table with type badges
│   ├── NetworkGraph    # 2D force-directed canvas graph (custom physics)
│   ├── JoinForm        # 4-step form with localStorage, drag-drop, validation
│   ├── AdminMemberCard # Full member card with approve/reject/remove/type toggle
│   ├── FilterDropdown  # Department + role filters
│   └── SocialIcons     # Uniform social link icons
├── lib/
│   ├── rate-limit.ts   # Sliding-window in-memory rate limiter
│   ├── with-timeout.ts # DB query timeout wrapper
│   ├── supabase/       # Client / server / admin Supabase instances
│   └── data/           # Server-only data fetchers (server-only import guard)
└── middleware.ts        # Auth guard + rate limiting (Edge)
```

---

## Roadmap

- [ ] Email notification on application approval
- [ ] Member profile pages (`/members/[slug]`)
- [ ] Upstash Redis rate limiter (for multi-region / serverless deployments)
- [ ] Alumni work sector / field alignment display in directory
- [ ] Attack protection (CAPTCHA) on admin login via Supabase Auth settings

---

<div align="center">

*by the BRACU people, for the BRACU people*

© 2026 bracu.network

</div>
