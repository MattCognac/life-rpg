"use server";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { XP_BY_DIFFICULTY } from "@/lib/xp";
import { revalidateApp } from "@/lib/revalidate";
import { hasAnthropicKey } from "@/lib/env";
import { checkCombinedRateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth";
import { DISCIPLINES, DISCIPLINE_SLUGS } from "@/lib/disciplines";
import type { ActionResult } from "@/types";

const AI_GENERATE_LIMITS = [
  { max: 3, windowMs: 60_000, label: "per-minute" },
  { max: 15, windowMs: 60 * 60_000, label: "per-hour" },
];

const AI_MODEL = "claude-sonnet-4-6";
const AI_MAX_TOKENS = 12_000;
const AI_TIMEOUT_MS = 150_000;

const SecondarySkillSchema = z.object({
  discipline: z.enum(DISCIPLINE_SLUGS),
  skillName: z.string(),
  specializationName: z.string().optional(),
});

const GeneratedQuestSchema = z.object({
  title: z
    .string()
    .describe("Short imperative quest title, e.g. 'Research basic bow types'"),
  description: z
    .string()
    .max(500)
    .describe(
      "1-3 sentence description of what the user needs to do to complete this quest"
    ),
  difficulty: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe(
      "Difficulty: 1=Trivial (a few minutes, very rare), 2=Easy (under an hour), 3=Medium (a few hours), 4=Hard (days of effort), 5=Legendary (major accomplishment, reserved for climactic milestones)"
    ),
  discipline: z
    .enum(DISCIPLINE_SLUGS)
    .describe("Discipline for this quest's skill. body=physical activity, mind=intellectual/analytical, spirit=inner growth, nature=animals/plants/outdoors, craft=making/creating things, life=household/finances/self-management. Classify by what you DO, not what you learn about."),
  skillName: z
    .string()
    .describe(
      "The PRIMARY skill this quest develops (e.g., 'Archery', 'Cooking'). Reuse existing skills when they fit."
    ),
  specializationName: z
    .string()
    .optional()
    .describe(
      "Rarely used. A specialization within the skill (e.g., 'Compound Bow'). Only include for genuinely distinct sub-disciplines, NOT for techniques, maintenance, or fundamentals of the parent skill."
    ),
  secondarySkills: z
    .array(SecondarySkillSchema)
    .max(2)
    .optional()
    .describe(
      "Optional 0-2 secondary skills this quest also develops (they receive 50% XP). Only include when the quest genuinely crosses into a different skill area. Most quests should have zero secondary skills."
    ),
});

const GeneratedChainSchema = z.object({
  chainName: z
    .string()
    .describe("A punchy name for the chain, e.g. 'The Hunter's Path'"),
  chainDescription: z
    .string()
    .max(300)
    .describe("1-2 sentence overview of the journey this chain represents"),
  tier: z
    .enum(["common", "uncommon", "rare", "epic", "legendary"])
    .describe(
      "Chain tier based on scope: common (1 skill), uncommon (2-3 skills), rare (multi-week focused effort), epic (4+ skills or 2+ disciplines), legendary (5+ skills across 3+ disciplines)"
    ),
  quests: z
    .array(GeneratedQuestSchema)
    .describe(
      "Ordered list of quests that, completed in sequence, achieve the goal. Use as many or as few quests as the goal genuinely requires — a simple goal may only need 4 quests, an ambitious multi-year goal may need 30 or more. Do not pad with filler, do not truncate to seem concise. Each quest must represent a distinct, meaningful step forward. The first should be the obvious starting point; the final quest should BE the goal itself."
    ),
});

export type GeneratedChain = z.infer<typeof GeneratedChainSchema>;

async function getSkillTree(userId: string): Promise<string> {
  const skills = await db.skill.findMany({
    where: { userId, parentId: null },
    include: { children: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  if (skills.length === 0) return "(none yet)";
  return skills
    .map(
      (s) =>
        `[${s.discipline ?? "life"}] ${s.name}: ${s.children.map((c) => c.name).join(", ") || "(no specializations)"}`
    )
    .join("\n");
}

function buildSystemPrompt(skillTree: string): string {
  return `You are a quest designer for Life RPG, a gamified self-improvement app. The user will give you a real-life goal and you must break it down into an ordered chain of quests that, completed in sequence, will get them from zero to accomplishing that goal.

## Your Primary Job: Accurate Decomposition

Before writing any quests, reason through what this goal genuinely requires. Think about:
- What does "done" look like? What is the actual end state?
- What skills, knowledge, equipment, or prerequisites does the user need to acquire along the way?
- What are the distinct phases (research → preparation → practice → execution → mastery)?
- What real-world milestones mark meaningful progress?
- What can only be learned by doing, versus what can be studied?

Then generate EXACTLY as many quests as the goal actually requires. Do not artificially limit yourself. Do not pad with filler.

- A simple goal ("Read a book this month") might need 3-5 quests.
- A moderate goal ("Learn to bake bread") might need 8-15 quests.
- An ambitious goal ("Learn to hunt", "Run a marathon", "Build a SaaS product") might need 15-30 quests.
- A legendary multi-year goal ("Become a licensed pilot", "Write and publish a novel", "Earn a black belt in BJJ") might need 40-60+ quests.

If the goal genuinely requires 50 steps to do right, write 50 steps. If it only requires 4, write 4. Your job is accuracy, not brevity.

## Disciplines & Skills (Read This First)
Every quest must be tagged to a DISCIPLINE and a PRIMARY SKILL. Getting these right is critical.

### The 6 Disciplines (pick exactly one per quest):

**body** — Physical prowess & adventure. The skill is exercised primarily through your body.
Examples: Running, Swimming, Weightlifting, Martial Arts, Archery (as a sport/practice), Climbing, Yoga, Dance, Cycling, Shooting Sports.

**mind** — Knowledge, technology & communication. The skill is primarily intellectual, analytical, or communicative.
Examples: Programming, Web Development, Writing, Mathematics, Languages, Marketing, Public Speaking, Data Analysis, Music Theory, Chess.

**spirit** — Spirituality, mindfulness & inner growth. The skill cultivates inner life, presence, or emotional depth.
Examples: Meditation, Journaling, Breathwork, Prayer, Philosophy, Stoicism, Gratitude Practice.

**nature** — The living world & its bounty. The skill involves interacting with animals, plants, land, water, or weather.
Examples: Hunting, Fishing, Foraging, Gardening, Farming, Beekeeping, Animal Training, Herbalism, Mushroom Cultivation, Wilderness Survival, Birding.

**craft** — Making, building & creating. The skill produces a tangible artifact, design, or creative work.
Examples: Woodworking, Cooking, Blacksmithing, Sewing, Pottery, Photography, Graphic Design, UI Design, Leatherworking, 3D Printing, Music Production.

**life** — Home, health, livelihood & self-management. The skill manages your household, finances, health, or daily systems.
Examples: Personal Finance, Meal Prep, Home Maintenance, Parenting, Time Management, Negotiation, Career Development, Nutrition, First Aid.

### The Core Principle (ALWAYS APPLY):
**Tag every quest to the skill it ADVANCES in the context of this chain — not to a description of the action being performed.** Every quest exists to move the user closer to their goal. The discipline and skill should reflect what competency grows, not the surface-level verb.

Buying gear, studying regulations, assembling supplies, filing paperwork, and making purchases are prerequisite steps. They advance the chain's core skill, not "Personal Finance", "Research", or "Shopping". A quest that exists only because the chain's primary goal requires it should be tagged to that primary goal's skill.

Apply this test: **"After completing this quest, what is the user better at?"** The answer is the skill. A hunter who buys a bow is better at hunting preparation, not personal finance. A programmer who sets up a development environment is better at programming, not system administration.

### Discipline Assignment Rules:
- **The discipline follows the skill, not the action.** Once you determine the correct skill (using the core principle above), the discipline is whichever of the six categories that skill belongs to. Do not re-evaluate the discipline based on what the user physically does in a single quest.
- **Don't let incidental actions override the skill's discipline.** Every skill involves learning, buying things, reading, and practicing. The discipline is determined by what the skill IS, not by one quest's activities. Studying hunting regulations is Nature (Hunting). Buying archery equipment is Body (Archery). These activities don't become Mind or Life just because they involve reading or spending money.

### User's Existing Skills & Specializations:
${skillTree}

## Quest Quality Rules

- **Atomic and actionable.** Each quest must be a single concrete action or milestone that the user can unambiguously mark as complete. "Improve at guitar" is bad. "Play a song all the way through without stopping" is good.
- **Progressive.** Difficulty rises across the chain. Early quests are trivial/easy (research, buy gear, first attempts). Middle quests are medium (deliberate practice, small wins). Late quests are hard/legendary (the real accomplishment and its variants).
- **Building on each other.** Quest N+1 should naturally follow from completing quest N. The prerequisites of a later quest should be satisfied by completing earlier ones.
- **Phase milestones.** Long chains naturally have distinct phases. Include milestone quests that mark the transition between phases — a satisfying "graduation" moment before the next chapter begins. These milestones should be higher difficulty to reflect the accomplishment.
- **Specific titles.** Short and imperative. "Research bow types and pick one", "Hit a stationary target at 20 meters", "Field-dress a harvested animal".
- **Practical descriptions.** Default to 1-2 sentences explaining exactly what the user needs to do. You may use up to 3 sentences if the user asks for more detail, but never more than that. Prioritize clarity and actionability over thoroughness.
- **The final quest IS the goal.** The last quest in the chain should be the actual accomplishment the user asked for.

## Skill Rules
- Reuse existing skill and specialization names when they fit (case-insensitive match). Create new skills only when genuinely needed.
- Skill names should be plain, widely understood terms — the kind you'd see on a resume or in a course catalog.
- Each skill is a SEPARATE XP TRACK. Splitting related activities across different skills fragments progress. Consolidate related activities under one skill.
- **The "independent pursuit" test:** Before creating any new skill, ask: "Would this user independently pursue and grow this skill outside this chain?" If no — if the skill only exists as a support step, incidental action, or one-off task within the chain — tag the quest to the chain's core skill instead. A skill used by only 1 quest is almost always wrong.
- **Existing parent skill check:** Before creating a new top-level skill, check whether the chain's subject is clearly a sub-discipline of a skill the user already has. If so, use the existing skill as the parent with a specialization rather than creating a new top-level skill (e.g., if the user has "Motorcycling" and the chain is about motorcycle maintenance, use skill="Motorcycling" + specialization="Maintenance"). **However, the relationship must be a genuine practitioner relationship — someone actively developing the parent skill would naturally encounter and practice the chain's subject as part of that skill.** Neither surface-level keyword overlap (both involve "vehicles", "health", "building") nor surface-level activity overlap (both involve "fixing", "learning", "making", "writing") is sufficient. If the chain's subject is an independent domain that a practitioner of the parent skill would not recognize as part of their practice, create a new top-level skill instead.
- **New skill for established domains:** When the chain is about a recognized domain with its own established body of knowledge (auto mechanics, plumbing, electrical work, woodworking, HVAC, welding, programming languages, specific sports, specific instruments, etc.), create a new top-level skill for that domain unless the user already has a skill in that exact same domain. Do NOT shoehorn it under an adjacent-but-different skill just because the disciplines or verbs feel similar. "Home Maintenance" is not a parent for automotive work. "First Aid" is not a parent for vehicle diagnostics. "Cooking" is not a parent for pottery. If no existing skill matches the chain's actual domain, make a new one.

### Skill Naming:
A skill name must be a **craft, discipline, or activity you practice** — never an outcome, phase, quality, or vague umbrella.

**Self-check — if ANY test fails, rename the skill:**
1. "I spent an hour practicing ___" — must sound natural.
2. "Introduction to ___" — must be a plausible course title.
3. "I'm learning ___" — a stranger should instantly understand what you mean.

**Never use as skill names:** outcomes (Growth, Mastery), project phases (Planning, Execution), personal qualities (Discipline, Focus, Wellness), or vague business terms when a concrete practice exists (Growth → Marketing).

**Tie-break:** prefer the more conventional, industry-standard noun — the one you'd find in a course catalog. If the only honest name feels awkward as a single word, use [Domain] + [Activity] (e.g. Event Planning, Grant Writing).

### Specialization Rules (USE SPARINGLY):
Specializations are uncommon. A specialization must represent a genuinely distinct sub-discipline that someone could independently specialize in and that is meaningfully different from the parent skill's core practice.

DO NOT create specializations for:
- Techniques or fundamentals within the normal practice of a skill (e.g., "Form", "Stance" are just part of Archery)
- Sub-aspects that everyone practicing the skill would do as a matter of course

DO create specializations for:
- Genuinely distinct branches a practitioner would independently identify with (e.g., "Bow Hunting" under Hunting — distinct from rifle hunting; "Olympic Lifting" under Weightlifting)
- A focused sub-area that is the ENTIRE subject of this chain AND the user already has the parent skill (e.g., if user has "Motorcycling" and the chain is specifically about learning to maintain a motorcycle, use skill="Motorcycling" + specialization="Maintenance" across all quests rather than creating a new top-level skill)

A specialization should apply to multiple quests. If only 1 quest would use it, skip it. When in doubt, OMIT the specialization.

### Secondary Skills (USE SPARINGLY):
A quest can optionally tag 1-2 secondary skills that receive 50% XP. Only add these when the quest GENUINELY crosses into a different skill area that the user is independently developing in this chain.

The secondary skill must pass the same "independent pursuit" test as any other skill. If the chain has multiple distinct skill tracks (e.g., Archery + Hunting in a bow hunting chain), a quest that exercises both can tag the secondary. Do NOT invent a secondary skill for a quality the quest incidentally requires (e.g., patience is not Meditation; cooking one meal is not Cooking unless the chain develops Cooking as its own track).

Most quests should have ZERO secondary skills.

## Chain Scope
Quest chains can and SHOULD span multiple skills and disciplines when the goal calls for it. A goal like "start a homestead" naturally involves Farming, Construction, Animal Care, etc. across Nature, Craft, and Life disciplines. Do not artificially constrain a chain to a single skill or discipline.

Classify the chain tier based on ambition and scope. Tier reflects the scale of the journey, NOT skill count — never invent extra skills to justify a higher tier.
- common: Small, short-term goal (e.g., "Read a book this month", "Organize my closet")
- uncommon: Moderate goal requiring weeks of effort (e.g., "Learn to bake bread", "Run a 5K")
- rare: Focused goal requiring several weeks of sustained practice (e.g., "Complete a 30-day fitness challenge", "Build a personal website")
- epic: Ambitious goal requiring months of sustained effort, even if it's primarily one skill (e.g., "Run a marathon", "Learn to hunt")
- legendary: Major life goal spanning many months or years, typically crossing multiple disciplines (e.g., "Start a homestead", "Build a cabin", "Earn a black belt")

## Difficulty Guidelines
- Difficulty 1 (Trivial) should be rare — only for steps that genuinely take a few minutes. Most research or purchasing steps are at least difficulty 2.
- Epic and legendary chains should have 1-3 difficulty 5 quests for the true climactic milestones in the final stretch.
- Difficulty 5 means a single, hard-earned achievement (e.g., "Execute your first ethical shot on a deer", "Run your first marathon"). It does NOT mean bundling multiple steps together to make a quest sound harder. Keep quests atomic.
- The difficulty 5 quest(s) should be the hardest or most meaningful moments in the chain, not wrap-up, celebration, or cool-down steps that follow the main achievement.`;
}

function checkAiPrerequisites<T>(userId: string): ActionResult<T> | null {
  if (!hasAnthropicKey()) {
    return {
      success: false,
      error:
        "ANTHROPIC_API_KEY is not set. Add it to your .env file to enable AI generation.",
    };
  }
  const limit = checkCombinedRateLimit(`ai:generate-chain:${userId}`, AI_GENERATE_LIMITS);
  if (!limit.ok) {
    const label = limit.failedLimit === "per-minute" ? "minute" : "hour";
    return {
      success: false,
      error: `Rate limit reached (max ${limit.failedLimit === "per-minute" ? AI_GENERATE_LIMITS[0].max : AI_GENERATE_LIMITS[1].max} per ${label}). Try again in ${limit.retryAfterSeconds}s.`,
    };
  }
  return null;
}

function handleAnthropicError<T>(err: unknown): ActionResult<T> {
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return {
      success: false,
      error: "Generation timed out — try a simpler or shorter request.",
    };
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return {
      success: false,
      error: "Invalid ANTHROPIC_API_KEY. Check your .env file.",
    };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { success: false, error: "Rate limited. Wait a moment and try again." };
  }
  if (err instanceof Anthropic.APIError) {
    console.error("Anthropic API error:", err.status, err.message);
    return {
      success: false,
      error: "AI service error. Please try again later.",
    };
  }
  console.error("AI generation error:", err);
  return {
    success: false,
    error: "Something went wrong. Please try again.",
  };
}

async function streamGeneratedChain(
  client: Anthropic,
  skillTree: string,
  userContent: string,
  parseErrorMessage: string
): Promise<ActionResult<GeneratedChain>> {
  const abort = AbortSignal.timeout(AI_TIMEOUT_MS);

  const stream = client.messages.stream(
    {
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system: buildSystemPrompt(skillTree),
      messages: [{ role: "user", content: userContent }],
      output_config: {
        format: zodOutputFormat(GeneratedChainSchema),
      },
    },
    { signal: abort },
  );

  const response = await stream.finalMessage();

  if (!response.parsed_output) {
    return {
      success: false,
      error: parseErrorMessage,
    };
  }

  return { success: true, data: response.parsed_output };
}

export async function generateQuestChain(
  goal: string
): Promise<ActionResult<GeneratedChain>> {
  const userId = await getAuthUser();
  const trimmed = goal.trim();
  if (!trimmed) {
    return { success: false, error: "Please describe your goal" };
  }
  if (trimmed.length > 2000) {
    return {
      success: false,
      error: "Goal is too long. Keep it under 2,000 characters.",
    };
  }

  const prereqError = checkAiPrerequisites<GeneratedChain>(userId);
  if (prereqError) return prereqError;

  try {
    const skillTree = await getSkillTree(userId);
    const client = new Anthropic();

    return await streamGeneratedChain(
      client,
      skillTree,
      `Generate a quest chain for this goal: "${trimmed}"`,
      "Odin couldn't forge a valid chain. Try rephrasing your goal."
    );
  } catch (err) {
    return handleAnthropicError<GeneratedChain>(err);
  }
}

export async function refineQuestChain(
  existingChain: GeneratedChain,
  originalGoal: string,
  refinement: string
): Promise<ActionResult<GeneratedChain>> {
  const userId = await getAuthUser();
  const trimmedRefinement = refinement.trim();
  if (!trimmedRefinement) {
    return { success: false, error: "Please describe what you'd like to change" };
  }
  if (trimmedRefinement.length > 500) {
    return {
      success: false,
      error: "Refinement is too long. Keep it under 500 characters.",
    };
  }

  const prereqError = checkAiPrerequisites<GeneratedChain>(userId);
  if (prereqError) return prereqError;

  try {
    const skillTree = await getSkillTree(userId);
    const client = new Anthropic();

    return await streamGeneratedChain(
      client,
      skillTree,
      `I already generated a quest chain for the goal: "${originalGoal.trim()}"

Here is the current chain:
${JSON.stringify(existingChain, null, 2)}

The user wants to refine this chain with the following feedback:
"${trimmedRefinement}"

Modify the chain to address this feedback. Preserve what is already good — only change, add, or remove quests as needed to incorporate the feedback. Return the full updated chain.`,
      "Odin couldn't refine the chain. Try rephrasing your feedback."
    );
  } catch (err) {
    return handleAnthropicError<GeneratedChain>(err);
  }
}

export async function saveGeneratedChain(
  generated: GeneratedChain
): Promise<ActionResult<{ chainId: string }>> {
  try {
    const userId = await getAuthUser();

    const parsed = GeneratedChainSchema.safeParse(generated);
    if (!parsed.success) {
      return { success: false, error: "Invalid chain data" };
    }
    generated = parsed.data;

    type SkillTuple = { discipline: string; skillName: string; specializationName?: string };
    const tuples: SkillTuple[] = [];
    for (const q of generated.quests) {
      const primaryName = q.skillName.trim();
      if (primaryName) {
        tuples.push({
          discipline: q.discipline,
          skillName: primaryName,
          specializationName: q.specializationName?.trim() || undefined,
        });
      }
      for (const sec of q.secondarySkills ?? []) {
        const secName = sec.skillName.trim();
        if (!secName) continue;
        tuples.push({
          discipline: sec.discipline,
          skillName: secName,
          specializationName: sec.specializationName?.trim() || undefined,
        });
      }
    }

    const skillMap = new Map<string, { id: string; name: string; discipline: string }>();
    const specMap = new Map<string, { id: string; name: string; parentId: string }>();

    const existingSkills = await db.skill.findMany({
      where: { userId, parentId: null },
      include: { children: { select: { id: true, name: true } } },
    });

    for (const s of existingSkills) {
      skillMap.set(s.name.toLowerCase(), { id: s.id, name: s.name, discipline: s.discipline ?? "life" });
      for (const child of s.children) {
        specMap.set(`${s.id}::${child.name.toLowerCase()}`, { id: child.id, name: child.name, parentId: s.id });
      }
    }

    for (const tuple of tuples) {
      const sKey = tuple.skillName.toLowerCase();
      if (!skillMap.has(sKey)) {
        const created = await db.skill.create({
          data: {
            userId,
            name: tuple.skillName,
            discipline: tuple.discipline,
          },
        });
        skillMap.set(sKey, { id: created.id, name: created.name, discipline: tuple.discipline });
      }

      if (tuple.specializationName) {
        const parentSkill = skillMap.get(sKey)!;
        const specKey = `${parentSkill.id}::${tuple.specializationName.toLowerCase()}`;
        if (!specMap.has(specKey)) {
          const parent = skillMap.get(sKey)!;
          const created = await db.skill.create({
            data: {
              userId,
              name: tuple.specializationName,
              parentId: parent.id,
            },
          });
          specMap.set(specKey, { id: created.id, name: created.name, parentId: parent.id });
        }
      }
    }

    const chain = await db.questChain.create({
      data: {
        userId,
        name: generated.chainName,
        description: generated.chainDescription,
        tier: generated.tier,
      },
    });

    for (let i = 0; i < generated.quests.length; i++) {
      const q = generated.quests[i];
      const difficulty = Math.max(1, Math.min(5, Math.round(q.difficulty)));
      const primaryTrim = q.skillName.trim();
      const parentSkill = primaryTrim ? skillMap.get(primaryTrim.toLowerCase()) : undefined;

      let linkSkillId: string | null = null;
      if (primaryTrim && parentSkill) {
        if (q.specializationName?.trim()) {
          const specKey = `${parentSkill.id}::${q.specializationName.trim().toLowerCase()}`;
          const spec = specMap.get(specKey);
          linkSkillId = spec?.id ?? parentSkill.id;
        } else {
          linkSkillId = parentSkill.id;
        }
      }

      const quest = await db.quest.create({
        data: {
          userId,
          title: q.title.trim(),
          description: q.description.trim(),
          difficulty,
          xpReward: XP_BY_DIFFICULTY[difficulty],
          status: i === 0 ? "active" : "locked",
          chainId: chain.id,
          chainOrder: i,
          skillId: linkSkillId,
        },
      });

      for (const sec of q.secondarySkills ?? []) {
        const secTrim = sec.skillName.trim();
        if (!secTrim) continue;
        const secParent = skillMap.get(secTrim.toLowerCase());
        if (!secParent) continue;
        let secSkillId = secParent.id;
        if (sec.specializationName?.trim()) {
          const secSpecKey = `${secParent.id}::${sec.specializationName.trim().toLowerCase()}`;
          const secSpec = specMap.get(secSpecKey);
          if (secSpec) secSkillId = secSpec.id;
        }
        if (secSkillId !== linkSkillId) {
          await db.questSkill.create({
            data: { questId: quest.id, skillId: secSkillId },
          });
        }
      }
    }

    revalidateApp(`/chains/${chain.id}`);

    return { success: true, data: { chainId: chain.id } };
  } catch (err) {
    console.error("saveGeneratedChain failed:", err);
    return {
      success: false,
      error: "Failed to save chain",
    };
  }
}
