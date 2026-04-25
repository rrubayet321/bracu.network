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

---

## What is this?

bracu.network is an open student webring and personal website directory for BRAC University students and alumni. Inspired by [uwaterloo.network](https://uwaterloo.network), it lets the BRACU community discover each other's work, connect across departments, and showcase their personal sites.

It is **not a social network**. It is a curated, low-noise directory of real builders from BRACU — with a public embed widget so members can link to each other from their own websites.

---

## Features

- **Animated hero** — SVG energy beams visualise every discipline converging into one network
- **Live member directory** — searchable, filterable table with avatars, department, website, and social links
- **Interactive network graph** — real-time force-directed graph of all members (hover-linked to the table)
- **Webring embed widget** — drop a `<script>` tag on your personal site to join the ring
- **Join form** — multi-section application form with profile photo upload and strict BRACU email/ID validation
- **Admin dashboard** — approve or reject pending applications, protected by Supabase Auth
- **Production-hardened** — rate limiting, CSP headers, Row-Level Security, EXIF stripping, Zod validation

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
| **ISR (60s revalidation)** | Home page is statically cached — DB is queried once per minute, not per visitor |
| **Supabase RLS** | Public reads only see `is_approved = true` rows; anon inserts are capped to `is_approved = false` |
| **`sharp` for image processing** | Profile photos are resized to 400×400 and EXIF metadata is stripped before upload |
| **In-memory sliding-window rate limiter** | No external service required; Edge-runtime compatible |
| **`zod` for validation** | Strict schema including BRACU-specific student ID regex and `@bracu.ac.bd` email enforcement |

---

## Security

| Layer | Implementation |
|---|---|
| **HTTP headers** | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy` via `next.config.ts` |
| **Rate limiting** | 5 join submissions/min · 10 admin login attempts/5min (middleware + server action double enforcement) |
| **Input sanitization** | All fields trimmed; `roles` and `interests` arrays capped at 10 items × 60 chars |
| **Image validation** | Magic-byte MIME check, 5 MB cap, EXIF strip, sharp resize |
| **Database** | Row-Level Security enabled; public INSERT only allows `is_approved = false` |
| **Auth** | `getUser()` server-validated on every admin request — not just session cookie checks |
| **Secrets** | `SUPABASE_SERVICE_ROLE_KEY` is server-only; never bundled to the browser |

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

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, never public
```

### Database

Run this in the Supabase SQL editor to create the members table:

```sql
create table public.members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  website     text not null,
  email       text,
  department  text,
  student_id  text,
  bio         text,
  roles       text[],
  interests   text[],
  github      text,
  linkedin    text,
  twitter     text,
  instagram   text,
  profile_pic text,
  is_approved boolean default false,
  created_at  timestamptz default now()
);

-- Performance index
create index idx_members_approved on members (is_approved, created_at desc);
```

Then enable **Row-Level Security** in the Supabase Dashboard and add these policies:

```sql
-- Public: read only approved members
create policy "Public can read approved members"
  on members for select using (is_approved = true);

-- Public: apply to join (cannot self-approve)
create policy "Anyone can apply to join"
  on members for insert with check (is_approved = false);
```

### Run

```bash
npm run dev
# → http://localhost:3000
```

> **Note:** The dev server uses Turbopack and may occasionally crash with a memory error after many rapid file changes. Just re-run `npm run dev` — this is a known Next.js 16 dev mode issue and does not affect production.

---

## Joining the network

No technical knowledge required. Go to [bracu.network/join](https://bracu.network/join), fill out the form, and wait for approval. You'll receive no spam — just an entry in the directory.

## Embedding the webring widget

Once approved, add this to your personal website to join the webring navigation:

```html
<script
  src="https://bracu.network/embed.js"
  data-webring
  data-user="your-slug-here">
</script>
```

This renders a small navigation bar linking to the previous and next member in the ring.

---

## Project structure

```
src/
├── app/
│   ├── admin/          # Protected admin dashboard (approve/reject)
│   ├── api/members/    # Public REST endpoint (embed widget)
│   ├── join/           # Application form + server actions
│   ├── icon.tsx        # Dynamic favicon (BN brand mark)
│   ├── layout.tsx      # Root layout + global footer
│   └── page.tsx        # Home page (ISR, 60s)
├── components/
│   ├── AnimatedHero    # SVG energy beam animation
│   ├── MemberTable     # Searchable/filterable directory table
│   ├── NetworkGraph    # Force-directed member graph
│   ├── JoinForm        # Multi-section application form
│   ├── AdminMemberCard # Approve/reject card
│   ├── FilterDropdown  # Department + role filters
│   └── SocialIcons     # Uniform social link icons
├── lib/
│   ├── rate-limit.ts   # Sliding-window in-memory rate limiter
│   ├── with-timeout.ts # DB query timeout wrapper
│   ├── supabase/       # Client + server Supabase instances
│   └── data/           # Server-only data fetchers
└── middleware.ts        # Auth guard + rate limiting (Edge)
```

---

## Roadmap

- [ ] Email notification on application approval
- [ ] Member profile pages (`/members/[slug]`)
- [ ] Semester/batch filtering
- [ ] Upstash Redis rate limiter (for multi-region deployments)

---

<div align="center">

*by the BRACU people, for the BRACU people*

© 2026 bracu.network

</div>
