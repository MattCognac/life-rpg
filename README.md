# Life RPG

> **A personal project.** An RPG quest system for real life — organize goals into chains, earn XP, level up skills, unlock achievements. Styled after the Norse aesthetic of *Valheim*.

This is a personal tool, not a product. I built it for myself to gamify the things I actually want to do in life. Feel free to read the code, fork it, or use it yourself — but there's no support, no roadmap commitments, and no expectation of community contributions.

![Life RPG dashboard](./docs/screenshot-placeholder.md)

---

## What It Does

- **Quests** with 5 difficulty tiers (Trivial → Legendary) and scaling XP rewards
- **Quest Chains** — ordered quest sequences where completing one unlocks the next. The AI chain generator can break down a big goal like *"Learn to hunt"* into 20+ concrete steps using Claude Opus 4.6
- **Skills** — user-defined categories (Fitness, Coding, Music, etc.) that level up independently from the overall character
- **Daily Quests** with streak tracking and streak-multiplied XP bonuses (up to 2× at 30+ days)
- **Character Sheet** with level, title, total XP, and visual skill mastery grid
- **25 Achievements** across 6 categories, auto-unlocking when conditions are met (and re-locking if you delete the quests that earned them)
- **Dashboard** with a 30-day XP chart, skill radar, stats grid, and recent activity feed

Everything runs locally against a SQLite file. No accounts, no cloud, no tracking.

---

## Tech

- **[Next.js 15](https://nextjs.org)** (App Router) + TypeScript
- **[Prisma](https://www.prisma.io)** + SQLite
- **[Tailwind CSS](https://tailwindcss.com)** + custom Valheim-inspired theme
- **[Recharts](https://recharts.org)** for dashboard visualizations
- **[Radix UI](https://www.radix-ui.com)** primitives
- **[Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)** (`claude-opus-4-6`) for AI chain generation
- **[Lucide Icons](https://lucide.dev)**

---

## Running It Locally

**Prerequisites:** Node.js 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template
cp .env.example .env
# Edit .env and optionally add ANTHROPIC_API_KEY for AI chain generation

# 3. Create the database and apply schema
npm run db:migrate

# 4. Seed sample data (character, 5 skills, 2 chains, 3 dailies, 25 achievements)
npm run db:seed

# 5. Start the dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

**Want a clean start?** Delete `prisma/dev.db` and run `npm run db:migrate && npm run db:seed` again.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start the production server (after build) |
| `npm run db:migrate` | Apply schema changes (creates new migration if schema changed) |
| `npm run db:deploy` | Apply pending migrations without prompting (for production/CI) |
| `npm run db:seed` | Reset and re-seed the database with sample data |
| `npm run db:studio` | Open Prisma Studio to browse/edit data |
| `npm run db:backup` | Timestamped backup of `dev.db` to `prisma/backups/` (keeps last 20) |
| `npm run setup` | First-time setup: deploy migrations + seed |

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list. Required:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma/SQLite database path. Default: `file:./dev.db` |
| `ANTHROPIC_API_KEY` | *(Optional)* Enables AI quest-chain generation. Get one at [console.anthropic.com](https://console.anthropic.com/). Without it, the app works fine — the "Generate with AI" button will just show an error. |

Env vars are validated at startup via [`src/lib/env.ts`](./src/lib/env.ts). Misconfigurations fail loudly instead of blowing up mid-request.

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
| 30 → 31 | 16,432 | 41 Hard quests |

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

Quests in a chain are locked by default except the first. Completing a quest automatically unlocks the next one in order. When all quests in a chain are completed, you earn a "Chain Complete" event. Deleting a chain refunds all XP earned from its quests and re-checks any achievements that depended on them.

### AI Chain Generation

Click **"Generate with AI"** on the `/chains` page, describe a goal (e.g. *"Learn to hunt"*, *"Run a marathon"*, *"Earn a private pilot's license"*), and Claude breaks it into an ordered chain of concrete quests — as many as the goal genuinely requires. The AI is told to prefer your existing skills and only invent new ones when necessary. Rate-limited to **3/minute** and **15/hour** to protect your API key from accidental spam.

### Achievements

25 achievements across General, Quests, Levels, Skills, Streaks, and Difficulty categories. They unlock automatically when conditions are met, and — critically — **re-lock** if you later delete the quests/chains that earned them. The reconciliation logic lives in [`src/lib/achievements.ts`](./src/lib/achievements.ts).

---

## Architecture & Self-Hosting

- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — data model, core workflows (quest complete, chain unlock, XP refund), directory structure, design decisions
- **[docs/SELF_HOSTING.md](./docs/SELF_HOSTING.md)** — running on a home server or VPS, reverse-proxy setup, backups, the "don't put this on the public internet without auth" warning

---

## Data & Privacy

- Everything lives in `prisma/dev.db` (a single SQLite file). Back it up.
- **No authentication.** Single-user, self-hosted. Don't expose the app directly to the public internet — see [SELF_HOSTING.md](./docs/SELF_HOSTING.md) for how to put basic auth in front of it.
- **AI generation sends your goal text to Anthropic.** Nothing else leaves your machine.
- No analytics, no telemetry, no phone-home.

---

## License

MIT. See [LICENSE](./LICENSE). This is a personal project shared as-is with no warranty or support.
