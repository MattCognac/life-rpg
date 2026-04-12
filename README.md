# Life RPG

> An RPG quest system for real life — organize goals into chains, earn XP, level up skills, unlock achievements. Styled after the Norse aesthetic of *Valheim*.

A personal project I built to gamify the things I actually want to do in life. Shared with friends via a private repo — not a product, no roadmap, no support commitments.

---

## What It Does

- **Quests** with 5 difficulty tiers (Trivial → Legendary) and scaling XP rewards
- **Quest Chains** — ordered quest sequences where completing one unlocks the next. The AI chain generator can break down a big goal like *"Learn to hunt"* into 20+ concrete steps using Claude
- **Skills** — user-defined categories (Fitness, Coding, Music, etc.) organized into realms, leveling up independently from the overall character
- **Daily Quests** with streak tracking and streak-multiplied XP bonuses (up to 2× at 30+ days)
- **8 Character Classes** — Warrior, Mage, Ranger, Paladin, Assassin, Monk, Artificer, Druid
- **25 Achievements** across 6 categories, auto-unlocking when conditions are met (and re-locking if you delete the quests that earned them)
- **Dashboard** with a 30-day XP chart, skill radar, stats grid, and recent activity feed
- **Account Settings** — change password, update email, delete account

Multi-user with authentication. Each person gets their own character, quests, skills, and progress.

---

## Tech

- **[Next.js 15](https://nextjs.org)** (App Router) + TypeScript
- **[Supabase](https://supabase.com)** — Auth (email/password) + hosted Postgres
- **[Prisma](https://www.prisma.io)** ORM on Supabase Postgres
- **[Tailwind CSS](https://tailwindcss.com)** + custom Valheim-inspired theme
- **[Recharts](https://recharts.org)** for dashboard visualizations
- **[Radix UI](https://www.radix-ui.com)** primitives
- **[Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)** for AI chain generation
- **[Lucide Icons](https://lucide.dev)**

Deployed on **[Vercel](https://vercel.com)**.

---

## Local Development

**Prerequisites:** Node.js 20+ and npm.

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd life-rpg
npm install
```

2. Set up a [Supabase](https://supabase.com) project (free tier works). You'll need:
   - Project URL and publishable key (Settings → API)
   - A secret key for admin operations (Settings → API → Secret keys)
   - Postgres connection strings (Settings → Database → Connection string)

3. Copy the env template and fill in your values:

```bash
cp .env.example .env
```

4. Apply database migrations:

```bash
npm run db:deploy
```

5. Optionally seed sample data:

```bash
npm run db:seed
```

6. Start the dev server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Sign up with an email and password.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start the production server (after build) |
| `npm run db:migrate` | Apply schema changes (creates new migration if schema changed) |
| `npm run db:deploy` | Apply pending migrations without prompting (for production/CI) |
| `npm run db:seed` | Seed the database with sample data |
| `npm run db:studio` | Open Prisma Studio to browse/edit data |

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable (anon) key |
| `SUPABASE_SECRET_KEY` | No | Supabase secret key — needed for admin operations (account deletion). Without it, everything else works fine. |
| `DATABASE_URL` | Yes | Supabase Postgres connection string (transaction pooler, port 6543) |
| `DIRECT_URL` | Yes | Supabase Postgres direct connection (session pooler, port 5432 — used for migrations) |
| `ANTHROPIC_API_KEY` | No | Enables AI quest-chain generation. Get one at [console.anthropic.com](https://console.anthropic.com/). Without it, the "Generate with AI" button shows an error. |

---

## How It Works

### Leveling Math

Each level requires `100 × level^1.5` XP (rounded). The curve is gentle early and steeper later.

| Level → Next | XP Required | Rough Feel |
|---|---|---|
| 1 → 2 | 100 | 1 Medium quest |
| 5 → 6 | 1,118 | 11 Medium quests |
| 10 → 11 | 3,162 | 8 Hard quests |
| 20 → 21 | 8,944 | 22 Hard quests |

Character level and each skill level use the same formula independently.

### XP Rewards

| Difficulty | XP |
|---|---|
| Trivial | 25 |
| Easy | 50 |
| Medium | 100 |
| Hard | 200 |
| Legendary | 400 |

### Streak Bonuses (Daily Quests)

| Streak | Multiplier |
|---|---|
| 3–6 days | +10% |
| 7–13 days | +25% |
| 14–29 days | +50% |
| 30+ days | +100% |

### Quest Chains

Quests in a chain are locked by default except the first. Completing a quest automatically unlocks the next one in order. Deleting a chain refunds all XP earned from its quests.

### AI Chain Generation

Describe a goal (e.g. *"Learn to hunt"*, *"Run a marathon"*), and Claude breaks it into an ordered chain of concrete quests. Rate-limited to **3/minute** and **15/hour**.

### Achievements

25 achievements across General, Quests, Levels, Skills, Streaks, and Difficulty categories. They unlock automatically and **re-lock** if you later delete the quests that earned them.

---

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for data model, core workflows, directory structure, and design decisions.

---

## Data & Privacy

- **Authentication** is handled by Supabase Auth (email/password). Sessions are managed via secure cookies.
- **All data** (quests, skills, characters, etc.) lives in Supabase Postgres. Each user's data is scoped by their `userId`.
- **AI chain generation** sends your goal text to Anthropic. Nothing else leaves the app.
- No analytics, no telemetry.

---

## License

All rights reserved. See [LICENSE](./LICENSE).
