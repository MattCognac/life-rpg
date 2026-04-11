# Architecture

A tour of how Life RPG works internally. Written so I can come back in six months and remember how the thing is put together.

---

## Stack Overview

- **Framework**: Next.js 15 App Router, fully server-rendered with client islands where interactivity is needed
- **Database**: SQLite via Prisma, file at `prisma/dev.db`
- **Data mutations**: Server actions (not REST/tRPC). All writes go through `src/actions/*.ts` files marked `"use server"`
- **Styling**: Tailwind CSS + a custom Valheim-inspired theme in `src/app/globals.css`
- **AI**: Anthropic SDK + `zodOutputFormat` for structured Claude output (only used for quest chain generation)

---

## Directory Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Dashboard (home)
│   ├── layout.tsx        # Root layout — sidebar, header, modals, flash
│   ├── quests/           # Quest board, new quest, quest detail
│   ├── chains/           # Chain list, new chain, chain detail, AI generator
│   ├── skills/           # Skill grid, skill detail
│   ├── character/        # Character sheet
│   ├── daily/            # Daily quests + streaks
│   └── achievements/     # Achievement gallery
│
├── actions/              # Server actions — ALL mutations go here
│   ├── quest-actions.ts  # create, update, complete, uncomplete, delete
│   ├── chain-actions.ts  # create, update, delete (with cascade + refund)
│   ├── skill-actions.ts  # create, update, delete
│   ├── character-actions.ts  # rename character
│   ├── daily-actions.ts  # lazy streak reset
│   └── ai-actions.ts     # Claude-powered chain generation (rate limited)
│
├── lib/                  # Pure logic + shared infrastructure
│   ├── db.ts             # Prisma singleton
│   ├── env.ts            # Zod-validated env vars (fails at import)
│   ├── xp.ts             # XP + leveling math (pure)
│   ├── achievements.ts   # 25 achievement definitions + check/reconcile
│   ├── rate-limit.ts     # In-memory rate limiter for AI endpoint
│   ├── daily.ts          # Streak + daily-reset helpers (pure)
│   ├── character.ts      # getOrCreateCharacter singleton helper
│   ├── constants.ts      # Difficulty labels, skill presets, etc.
│   └── utils.ts          # cn(), relativeTime(), formatNumber()
│
├── components/
│   ├── ui/               # Primitives (button, card, dialog, input, etc.)
│   ├── layout/           # Sidebar, header, mobile-nav
│   ├── quests/           # QuestCard, QuestForm, CompleteQuestButton, ...
│   ├── chains/           # ChainCard, ChainProgress, AIChainGenerator, ...
│   ├── skills/           # SkillCard, SkillForm
│   ├── character/        # RenameCharacter dialog
│   ├── achievements/     # AchievementCard
│   ├── daily/            # DailyQuestCard, StreakDisplay
│   ├── dashboard/        # XpChart, SkillRadar, RecentActivity
│   └── shared/           # Toaster, LevelUpModal, QuestCompleteFlash, ...
│
└── types/
    └── index.ts          # ActionResult<T>, ActionEvents

prisma/
├── schema.prisma         # Single source of truth for data model
├── migrations/           # Committed migration history
├── seed.ts               # Sample data (character, skills, chains, dailies)
└── dev.db                # SQLite file (gitignored)

scripts/
└── backup.sh             # Timestamped DB backup with rotation

docs/
├── ARCHITECTURE.md       # You are here
└── SELF_HOSTING.md       # Running on a VPS or home server
```

---

## Data Model

Eight tables. Single-user, so there's no `User` or `userId` — just one `Character` row and everything hangs off it.

```
Character       (exactly 1 row)
  ├── name, title, level, totalXp

Skill                                    QuestChain
  ├── name, icon, color                    ├── name, description
  ├── level, totalXp                       │
  │                                        ├── Quest[]
  └── Quest[]  ──────────────────────────> │
                                           │
Quest                                      │
  ├── title, description                   │
  ├── difficulty (1–5), xpReward           │
  ├── status (active/completed/locked)     │
  ├── isDaily, dailyCron                   │
  ├── chainId ────────────────────────────┘
  ├── chainOrder
  ├── skillId ──────────> Skill
  │
  └── QuestCompletion[]  (cascade delete)

QuestCompletion  (one per completion event — daily quests have many)
  ├── questId, xpAwarded, completedAt

DailyStreak
  ├── questId (unique, not a DB FK), currentStreak, longestStreak, lastCompleted

Achievement  (25 rows, pre-seeded)
  ├── key (unique), name, description, icon, category
  └── unlockedAt (null = locked)

ActivityLog
  ├── type, message, metadata (JSON), createdAt
```

**Key design decisions:**

- **`QuestCompletion` is a separate table**, not a boolean on `Quest`. This lets daily quests be completed once per day and powers the XP-over-time chart. Cascaded on quest delete.
- **`DailyStreak.questId` is unique but not a true FK**. This keeps streak cleanup explicit — deletion paths must `deleteMany` manually. Done in `deleteQuest` and `deleteChain`.
- **`QuestChain.quests` uses `onDelete: SetNull`** by default in Prisma. For cascade deletion we do it manually in `deleteChain()` so we can also refund XP before the rows disappear.
- **Achievements are pre-seeded rows** with `unlockedAt: null`, not rows created on unlock. This lets `reconcileAchievements()` flip them on and off without insert/delete churn.

---

## Core Workflows

### Quest Completion (`completeQuest` in `quest-actions.ts`)

The most important single function in the app. When you click "Complete Quest":

1. **Idempotency check (daily quests only)** — bail out if already completed today
2. **Streak update (daily quests only)** — increment or reset based on `lastCompleted`, apply streak multiplier to XP
3. **Record completion** — insert `QuestCompletion` row
4. **Mark quest completed** (non-daily only) — update status + `completedAt`
5. **Award character XP** — add to `Character.totalXp`, recompute level, update title if changed
6. **Award skill XP** (if quest is tagged to a skill) — same treatment on the `Skill` row
7. **Unlock next chain quest** (if this quest is in a chain) — find the next locked quest and flip it to active
8. **Check chain completion** — if all chain quests are now completed, log a `chain_complete` activity event
9. **Log activity events** — `quest_complete`, `level_up`, `skill_level_up` as applicable
10. **Check achievements** — `checkAchievements()` walks all 25 definitions and unlocks any newly earned, returns them for UI toasts
11. **Return `ActionEvents`** — the client uses this to fire animations (flash, level-up modal, toasts)
12. **Revalidate paths** — `/`, `/quests`, `/daily`, `/character`, `/skills`, `/achievements`, and the chain page if applicable

### Quest Deletion (`deleteQuest` in `quest-actions.ts`)

Symmetric with completion — the inverse operation needs to undo everything:

1. **Fetch quest with completions and skill**
2. **Sum XP refund** across all completion records (daily quests may have dozens)
3. **Refund character XP + recompute level**
4. **Refund skill XP + recompute level** (if tagged)
5. **Delete `DailyStreak` row** (not covered by cascade — FK is not enforced)
6. **Delete the quest** — `QuestCompletion` rows cascade automatically
7. **Reconcile chain locks** (if in a chain) — `reconcileChainLocks()` walks the chain and ensures the first non-completed quest is active and everything after it is locked. Handles the case where the deleted quest was active with a gap behind it.
8. **Reconcile achievements** — `reconcileAchievements()` walks all definitions and flips locks in both directions. If the deletion dropped your character below level 5, the "Rising Star" achievement is re-locked.
9. **Revalidate paths**

### Chain Deletion (`deleteChain` in `chain-actions.ts`)

Cascades the whole chain:

1. **Fetch chain with all quests and their completions**
2. **Tally XP refunds** — per character, per skill (a `Map<skillId, xp>`)
3. **Apply character refund** — recompute level
4. **Apply per-skill refunds** — recompute each affected skill's level
5. **Clean daily streaks** for any daily quests in the chain
6. **`deleteMany` all quests where `chainId` matches** — cascades `QuestCompletion`
7. **Delete the chain row itself**
8. **Reconcile achievements** — some may now be locked again
9. **Revalidate paths**

**Not deleted:** skills. They represent persistent user intent and may be used by standalone quests or other chains.

### Daily Quest Reset (`/app/daily/page.tsx`)

**No cron job.** Reset is lazy: when the `/daily` page loads, it walks all `DailyStreak` rows and resets `currentStreak` to 0 for any where `lastCompleted` is before yesterday. This is cheap for a single user and avoids needing a background worker.

`isStreakBroken()` in `src/lib/daily.ts` is the authoritative check.

### AI Chain Generation (`generateQuestChain` in `ai-actions.ts`)

1. **Check env** — bail if `ANTHROPIC_API_KEY` missing
2. **Validate input** — require non-empty goal, reject anything over 1000 chars
3. **Rate limit** — `checkCombinedRateLimit("ai:generate-chain", ...)` with 3/min + 15/hour caps
4. **Load existing skill names** so Claude can prefer them
5. **Call `client.messages.parse()`** with:
   - `model: "claude-opus-4-6"`
   - `thinking: { type: "adaptive" }` — Claude decides how much to reason
   - `output_config: { format: zodOutputFormat(GeneratedChainSchema) }` — guaranteed-valid output
   - System prompt that teaches the decomposition principles (scale, progressive difficulty, skill reuse, etc.)
6. **Return `response.parsed_output`** to the client for preview
7. **Typed error handling** — `AuthenticationError`, `RateLimitError`, `APIError` each get specific messages

Persistence happens separately in `saveGeneratedChain()` after user preview + accept:
1. Resolve existing skills by name (case-insensitive), create missing ones with rotated preset colors/icons
2. Create the `QuestChain` row
3. Create all quests in order, first `active`, rest `locked`

---

## Server Action Pattern

Every mutation returns:

```ts
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  events?: ActionEvents;  // xpAwarded, leveledUp, achievementsUnlocked, etc.
}
```

The client calls the action via `useTransition`, then passes the result to `handleActionResult()` in `src/components/shared/action-handler.ts`, which:
- Shows an error toast on failure
- Fires `QuestCompleteFlash` on XP award
- Shows the `LevelUpModal` on level-up
- Shows achievement toasts
- Shows skill level-up and chain-complete toasts

All the animation trigger logic lives in one place. Adding a new animation = add a new event field to `ActionEvents` and handle it in `action-handler.ts`.

---

## XP Math (`src/lib/xp.ts`)

Pure functions, no DB dependency, fully unit-testable (if we had tests).

- `xpRequiredForLevel(level)` → `100 × level^1.5` rounded
- `computeLevel(totalXp)` → `{ level, currentLevelXp, xpForNextLevel, progress }`. Iterative, walks the thresholds. Fine for levels up to the hundreds.
- `streakMultiplier(streak)` → 1.0 / 1.1 / 1.25 / 1.5 / 2.0
- `titleForLevel(level)` → "Novice" → "Apprentice" → ... → "Legendary Hero"

Same formula used for character level and skill levels — intentional, keeps the progression intuitive.

---

## Theme (`src/app/globals.css`)

Valheim-inspired Norse palette:

| Token | Value | Usage |
|---|---|---|
| `--background` | near-black with blue tint | Page bg |
| `--primary` | `#dd6119` (Valheim orange) | Buttons, accents |
| `--primary-dark` | `#ad2817` (burnt red) | Button gradient |
| `--gold` | `#ff8201` (fire gold) | XP, rewards, highlights |
| `--foreground` | `#c4b99a` (parchment) | Body text |

Custom utilities:
- `.norse-card` — dark semi-transparent card with subtle gradient border
- `.clip-rune` — angular clip-path for shield/rune-shaped edges
- `.btn-norse` — gradient orange button with ember glow on hover
- `.xp-bar` / `.xp-bar-fill` — warm gradient progress bar with shimmer animation
- `.ember-hover` — orange glow on hover
- `.text-gradient-gold` — gold-to-red text gradient (for headings)

Custom animations defined in `tailwind.config.ts`:
- `fade-in`, `fade-in-up`, `slide-in-right`
- `ember-glow` — pulsing primary-color box-shadow
- `level-up-scale` — scale-up entrance for the level-up modal
- `quest-flash` — radial gold pulse (replaces confetti)
- `shimmer` — moving gradient on XP bars

---

## Things That Are NOT Here (And Why)

- **No authentication.** Single-user app. See SELF_HOSTING.md for how to put auth in front of it.
- **No tests.** Personal project. XP math and achievement logic are the biggest risks if they break — add tests if you care.
- **No error monitoring (Sentry/etc.).** localhost doesn't need it; a VPS deployment might.
- **No analytics.** Not interested.
- **No background jobs / cron.** Streak reset is lazy on page load. No queue, no worker, no Redis.
- **No multi-tenancy.** Everything is `db.character.findFirst()`. Adding users would require a `userId` foreign key on every table.

---

## How to Add a New Feature

A rough recipe, using "add a new achievement" as an example:

1. **Data**: if schema change needed, edit `prisma/schema.prisma`, run `npm run db:migrate` with a meaningful name
2. **Logic**: add the achievement definition to `ACHIEVEMENTS` in `src/lib/achievements.ts` with a `check` function
3. **Seed**: add to `prisma/seed.ts` if you want it in fresh installs
4. **UI**: nothing needed — the achievement gallery reads all rows and categorizes them automatically
5. **Test**: complete the triggering condition and watch for the toast

For a new feature that needs a mutation:
1. Add server action in `src/actions/*.ts` returning `ActionResult<T>`
2. Wire it to a client component via `useTransition` + `handleActionResult`
3. Add any new event types to `ActionEvents` in `src/types/index.ts`
4. Handle the event in `action-handler.ts` if it needs an animation
