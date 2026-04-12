# Architecture

A tour of how Life RPG works internally. Written so I can come back in six months and remember how the thing is put together.

---

## Stack Overview

- **Framework**: Next.js 15 App Router, fully server-rendered with client islands where interactivity is needed
- **Auth**: Supabase Auth (email/password) with cookie-based sessions via `@supabase/ssr`
- **Database**: Supabase Postgres via Prisma ORM
- **Data mutations**: Server actions (not REST/tRPC). All writes go through `src/actions/*.ts` files marked `"use server"`
- **Styling**: Tailwind CSS + a custom Valheim-inspired theme in `src/app/globals.css`
- **AI**: Anthropic SDK + `zodOutputFormat` for structured Claude output (only used for quest chain generation)
- **Deployment**: Vercel (auto-deploys on push to main)

---

## Directory Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (app)/            # Authenticated app layout (sidebar, header)
│   │   ├── page.tsx      # Dashboard (home)
│   │   ├── quests/       # Quest board, new quest, quest detail
│   │   ├── chains/       # Chain list, new chain, chain detail, AI generator
│   │   ├── skills/       # Skill detail pages
│   │   ├── character/    # Character sheet
│   │   ├── daily/        # Daily quests + streaks
│   │   ├── achievements/ # Achievement gallery
│   │   └── settings/     # Account settings (password, email, delete)
│   ├── (auth)/           # Auth layout (login, signup, forgot/reset password)
│   ├── auth/callback/    # Supabase OAuth/code exchange route
│   └── onboarding/       # New user character creation
│
├── actions/              # Server actions — ALL mutations go here
│   ├── quest-actions.ts  # create, update, complete, uncomplete, delete
│   ├── chain-actions.ts  # create, update, delete (with cascade + refund)
│   ├── skill-actions.ts  # create, update, delete
│   ├── character-actions.ts  # rename character, change class
│   ├── account-actions.ts    # delete account (cascade all data + Supabase auth)
│   ├── daily-actions.ts  # lazy streak reset
│   └── ai-actions.ts     # Claude-powered chain generation (rate limited)
│
├── lib/                  # Pure logic + shared infrastructure
│   ├── db.ts             # Prisma singleton
│   ├── auth.ts           # getAuthUser() — validates session, returns userId
│   ├── env.ts            # Zod-validated env vars (fails at import)
│   ├── xp.ts             # XP + leveling math (pure)
│   ├── achievements.ts   # 25 achievement definitions + check/reconcile
│   ├── classes.ts        # 8 character class definitions
│   ├── realms.ts         # Skill realm definitions
│   ├── rate-limit.ts     # In-memory rate limiter for AI endpoint
│   ├── daily.ts          # Streak + daily-reset helpers (pure)
│   ├── character.ts      # getCharacterForUser helper
│   ├── constants.ts      # Difficulty labels, skill presets, etc.
│   ├── utils.ts          # cn(), relativeTime(), formatNumber()
│   ├── revalidate.ts     # revalidateApp() helper
│   └── supabase/
│       ├── server.ts     # Server-side Supabase client (cookie-aware)
│       ├── client.ts     # Browser-side Supabase client
│       ├── middleware.ts  # Supabase client for Next.js middleware
│       └── admin.ts      # Supabase admin client (service role, for account deletion)
│
├── components/
│   ├── ui/               # Primitives (button, card, dialog, input, etc.)
│   ├── layout/           # Sidebar, header, mobile-nav
│   ├── quests/           # QuestCard, QuestForm, CompleteQuestButton, ...
│   ├── chains/           # ChainCard, ChainProgress, AIChainGenerator, ...
│   ├── skills/           # SkillCard, SkillForm
│   ├── character/        # EditCharacter, ChangeClass dialogs
│   ├── achievements/     # AchievementCard
│   ├── daily/            # DailyQuestCard, StreakDisplay
│   ├── dashboard/        # XpChart, SkillRadar, RecentActivity
│   ├── settings/         # ChangePasswordForm, ChangeEmailForm, DeleteAccountSection
│   ├── onboarding/       # TutorialOverlay
│   └── shared/           # Toaster, LevelUpModal, QuestCompleteFlash, ...
│
├── middleware.ts          # Auth guard — redirects unauthenticated users to /login
│
└── types/
    └── index.ts          # ActionResult<T>, ActionEvents

prisma/
├── schema.prisma         # Single source of truth for data model
├── migrations/           # Committed migration history
└── seed.ts               # Sample data (character, skills, chains, dailies)

docs/
└── ARCHITECTURE.md       # You are here
```

---

## Authentication

Supabase Auth with email/password. Three Supabase client variants:

- **Server** (`lib/supabase/server.ts`): cookie-aware client for Server Components and server actions
- **Browser** (`lib/supabase/client.ts`): for client-side auth operations (login, signup, password/email changes)
- **Middleware** (`lib/supabase/middleware.ts`): wired to `NextRequest`/`NextResponse` for session refresh
- **Admin** (`lib/supabase/admin.ts`): service-role client for privileged operations (account deletion)

`getAuthUser()` in `lib/auth.ts` is the single entry point for server-side auth checks. It calls `supabase.auth.getUser()`, redirects to `/login` if no session, and returns the `userId` string.

`middleware.ts` runs on every request, refreshes the session cookie, and redirects unauthenticated users away from protected routes.

---

## Data Model

Every table has a `userId` column scoping data to the authenticated user. There is no `User` table in Prisma — user identity lives in Supabase Auth.

```
Character       (one per user)
  ├── name, title, class, level, totalXp

Skill
  ├── name, icon, color, realm
  ├── level, totalXp
  ├── parentId (self-referencing tree for sub-skills)
  │
  └── Quest[]

QuestChain
  ├── name, description, tier
  └── Quest[]

Quest
  ├── title, description
  ├── difficulty (1–5), xpReward
  ├── status (active/completed/locked)
  ├── isDaily, dailyCron
  ├── chainId → QuestChain
  ├── chainOrder
  ├── skillId → Skill
  │
  └── QuestCompletion[]  (cascade delete)

QuestCompletion  (one per completion event — daily quests have many)
  ├── questId, xpAwarded, completedAt

DailyStreak
  ├── questId (unique per user), currentStreak, longestStreak, lastCompleted

Achievement  (25 rows per user, pre-seeded)
  ├── key (unique per user), name, description, icon, category
  └── unlockedAt (null = locked)

ActivityLog
  ├── type, message, metadata (JSON), createdAt
```

**Key design decisions:**

- **`QuestCompletion` is a separate table**, not a boolean on `Quest`. This lets daily quests be completed once per day and powers the XP-over-time chart.
- **`DailyStreak.questId` is unique but not a true FK**. Deletion paths must `deleteMany` manually.
- **Achievements are pre-seeded rows** with `unlockedAt: null`, not rows created on unlock. This lets `reconcileAchievements()` flip them on and off.
- **Account deletion** cascades through all tables in dependency order via `account-actions.ts`, then removes the Supabase auth user via the admin client.

---

## Core Workflows

### Quest Completion (`completeQuest` in `quest-actions.ts`)

1. Idempotency check (daily quests only)
2. Streak update + multiplier (daily quests only)
3. Record `QuestCompletion`
4. Mark quest completed (non-daily only)
5. Award character XP + recompute level
6. Award skill XP (if tagged)
7. Unlock next chain quest (if in a chain)
8. Check chain completion
9. Log activity events
10. Check achievements
11. Return `ActionEvents` for UI animations
12. Revalidate paths

### Quest Deletion (`deleteQuest`)

Symmetric inverse — refund XP, delete streaks, reconcile chain locks, reconcile achievements.

### Chain Deletion (`deleteChain`)

Cascades: tally XP refunds per skill, apply refunds, clean streaks, delete all quests, delete chain, reconcile achievements.

### Account Deletion (`deleteAccount` in `account-actions.ts`)

1. Delete all user rows: ActivityLog, Achievement, DailyStreak, QuestCompletion, Quest, QuestChain, Skill, Character
2. Delete Supabase auth user via admin API
3. Redirect to login

### Daily Quest Reset

No cron job — lazy reset on `/daily` page load. Walks `DailyStreak` rows and resets broken streaks.

### AI Chain Generation (`generateQuestChain` in `ai-actions.ts`)

Rate-limited (3/min, 15/hour). Sends goal to Claude, returns structured chain of quests for user preview before saving.

---

## Server Action Pattern

Every mutation returns:

```ts
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  events?: ActionEvents;
}
```

The client calls the action via `useTransition`, then passes the result to `handleActionResult()` which fires toasts, animations, and modals based on the events.

---

## Theme (`src/app/globals.css`)

Valheim-inspired Norse palette:

| Token | Value | Usage |
|---|---|---|
| `--background` | near-black with blue tint | Page bg |
| `--primary` | `#dd6119` (Valheim orange) | Buttons, accents |
| `--gold` | `#ff8201` (fire gold) | XP, rewards, highlights |
| `--foreground` | `#c4b99a` (parchment) | Body text |

Custom utilities: `.norse-card`, `.btn-norse`, `.xp-bar`, `.text-gradient-gold`, `.ember-hover`.

---

## What's Not Here (And Why)

- **No tests.** Personal project. XP math and achievement logic are the biggest risks — add tests if you care.
- **No error monitoring.** Would add Sentry if this grew beyond friends.
- **No analytics.** Not interested.
- **No background jobs / cron.** Streak reset is lazy on page load.
- **No input validation with Zod on server actions.** Most trust the types. Would add for a public product.
