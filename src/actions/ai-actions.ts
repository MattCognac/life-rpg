"use server";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { XP_BY_DIFFICULTY } from "@/lib/xp";
import { revalidateApp } from "@/lib/revalidate";
import { SKILL_COLOR_PRESETS, SKILL_ICON_PRESETS } from "@/lib/constants";
import { hasAnthropicKey } from "@/lib/env";
import { checkCombinedRateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth";
import { DISCIPLINES, DISCIPLINE_SLUGS } from "@/lib/disciplines";
import type { ActionResult } from "@/types";

const AI_GENERATE_LIMITS = [
  { max: 3, windowMs: 60_000, label: "per-minute" },
  { max: 15, windowMs: 60 * 60_000, label: "per-hour" },
];

const GeneratedQuestSchema = z.object({
  title: z
    .string()
    .describe("Short imperative quest title, e.g. 'Research basic bow types'"),
  description: z
    .string()
    .describe(
      "1-2 sentence description of what the user needs to do to complete this quest"
    ),
  difficulty: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe(
      "Difficulty: 1=Trivial (few minutes), 2=Easy (under an hour), 3=Medium (a few hours), 4=Hard (days of effort), 5=Legendary (major accomplishment)"
    ),
  discipline: z
    .enum(DISCIPLINE_SLUGS)
    .describe("Which discipline this quest belongs to"),
  skillName: z
    .string()
    .describe(
      "The skill this quest develops (e.g., 'Archery', 'Cooking'). Reuse existing skills when they fit."
    ),
  specializationName: z
    .string()
    .optional()
    .describe(
      "Optional specialization within the skill (e.g., 'Compound Bow', 'Grilling'). Only include if the quest develops a narrow specialization, not for simple/straightforward quests. Reuse existing specializations when they fit."
    ),
});

const GeneratedChainSchema = z.object({
  chainName: z
    .string()
    .describe("A punchy name for the chain, e.g. 'The Hunter's Path'"),
  chainDescription: z
    .string()
    .describe("1-2 sentence overview of the journey this chain represents"),
  tier: z
    .enum(["common", "uncommon", "epic", "legendary"])
    .describe(
      "Chain tier based on scope: common (1 skill), uncommon (2-3 skills), epic (4+ skills or 2+ disciplines), legendary (5+ skills across 3+ disciplines)"
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
  const disciplineList = DISCIPLINES.map((d) => `- ${d.slug}: ${d.description}`).join("\n");

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

## Quest Quality Rules

- **Atomic and actionable.** Each quest must be a single concrete action or milestone that the user can unambiguously mark as complete. "Improve at guitar" is bad. "Play a song all the way through without stopping" is good.
- **Progressive.** Difficulty rises across the chain. Early quests are trivial/easy (research, buy gear, first attempts). Middle quests are medium (deliberate practice, small wins). Late quests are hard/legendary (the real accomplishment and its variants).
- **Building on each other.** Quest N+1 should naturally follow from completing quest N. The prerequisites of a later quest should be satisfied by completing earlier ones.
- **Specific titles.** Short and imperative. "Research bow types and pick one", "Hit a stationary target at 20 meters", "Field-dress a harvested animal".
- **Practical descriptions.** 1-2 sentences explaining exactly what the user needs to do. No fluff.
- **The final quest IS the goal.** The last quest in the chain should be the actual accomplishment the user asked for.

## Skill System
Every quest must be tagged to a DISCIPLINE and SKILL. A SPECIALIZATION is optional for quests that develop a specific focused branch of a skill.

### The ${DISCIPLINES.length} Disciplines (pick exactly one per quest):
${disciplineList}

### User's Existing Skills & Specializations:
${skillTree}

Rules:
- Reuse existing skill and specialization names when they fit (case-insensitive match).
- Create new skills/specializations when genuinely needed.
- Skill names should pass the "I'm good at X" test (e.g., "Cooking" not "Food").
- Specialization names should be specific (e.g., "Grilling" not "Cooking Techniques").
- Only include a specialization when the quest genuinely develops a specific focused branch. Simple or straightforward quests should tag to the skill only (omit specializationName).

## Chain Scope
Quest chains can and SHOULD span multiple skills and disciplines when the goal calls for it. A goal like "start a homestead" naturally involves Farming, Construction, Plumbing, Animal Care, Preservation, etc. across Nature, Craft, and Life disciplines. Do not artificially constrain a chain to a single skill or discipline.

Classify the chain tier based on its scope:
- common: 1 skill, 1 discipline (e.g., "Read a book this month")
- uncommon: 2-3 skills, 1 discipline (e.g., "Learn to bake bread")
- epic: 4+ skills or 2+ disciplines (e.g., "Learn to hunt")
- legendary: 5+ skills across 3+ disciplines (e.g., "Start a homestead", "Build a cabin")`;
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

export async function generateQuestChain(
  goal: string
): Promise<ActionResult<GeneratedChain>> {
  const userId = await getAuthUser();
  const trimmed = goal.trim();
  if (!trimmed) {
    return { success: false, error: "Please describe your goal" };
  }
  if (trimmed.length > 1000) {
    return {
      success: false,
      error: "Goal is too long. Keep it under 1000 characters.",
    };
  }

  const prereqError = checkAiPrerequisites<GeneratedChain>(userId);
  if (prereqError) return prereqError;

  try {
    const skillTree = await getSkillTree(userId);
    const client = new Anthropic();

    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      system: buildSystemPrompt(skillTree),
      messages: [
        {
          role: "user",
          content: `Generate a quest chain for this goal: "${trimmed}"`,
        },
      ],
      output_config: {
        format: zodOutputFormat(GeneratedChainSchema),
      },
    });

    const response = await stream.finalMessage();

    if (!response.parsed_output) {
      return {
        success: false,
        error: "Odin couldn't forge a valid chain. Try rephrasing your goal.",
      };
    }

    return { success: true, data: response.parsed_output };
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
  if (trimmedRefinement.length > 1000) {
    return {
      success: false,
      error: "Refinement is too long. Keep it under 1000 characters.",
    };
  }

  const prereqError = checkAiPrerequisites<GeneratedChain>(userId);
  if (prereqError) return prereqError;

  try {
    const skillTree = await getSkillTree(userId);
    const client = new Anthropic();

    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      system: buildSystemPrompt(skillTree),
      messages: [
        {
          role: "user",
          content: `I already generated a quest chain for the goal: "${originalGoal.trim()}"

Here is the current chain:
${JSON.stringify(existingChain, null, 2)}

The user wants to refine this chain with the following feedback:
"${trimmedRefinement}"

Modify the chain to address this feedback. Preserve what is already good — only change, add, or remove quests as needed to incorporate the feedback. Return the full updated chain.`,
        },
      ],
      output_config: {
        format: zodOutputFormat(GeneratedChainSchema),
      },
    });

    const response = await stream.finalMessage();

    if (!response.parsed_output) {
      return {
        success: false,
        error: "Odin couldn't refine the chain. Try rephrasing your feedback.",
      };
    }

    return { success: true, data: response.parsed_output };
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
    const tuples: SkillTuple[] = generated.quests.map((q) => ({
      discipline: q.discipline,
      skillName: q.skillName.trim(),
      specializationName: q.specializationName?.trim() || undefined,
    }));

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

    let presetIdx = existingSkills.length;

    for (const tuple of tuples) {
      const sKey = tuple.skillName.toLowerCase();
      if (!skillMap.has(sKey)) {
        const color = SKILL_COLOR_PRESETS[presetIdx % SKILL_COLOR_PRESETS.length];
        const icon = SKILL_ICON_PRESETS[presetIdx % SKILL_ICON_PRESETS.length];
        presetIdx++;
        const created = await db.skill.create({
          data: {
            userId,
            name: tuple.skillName,
            discipline: tuple.discipline,
            color,
            icon,
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
              icon: SKILL_ICON_PRESETS[presetIdx % SKILL_ICON_PRESETS.length],
              color: SKILL_COLOR_PRESETS[presetIdx % SKILL_COLOR_PRESETS.length],
            },
          });
          presetIdx++;
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
      const parentSkill = skillMap.get(q.skillName.trim().toLowerCase());

      let linkSkillId: string | null = null;
      if (q.specializationName?.trim() && parentSkill) {
        const specKey = `${parentSkill.id}::${q.specializationName.trim().toLowerCase()}`;
        const spec = specMap.get(specKey);
        linkSkillId = spec?.id ?? parentSkill.id;
      } else if (parentSkill) {
        linkSkillId = parentSkill.id;
      }

      await db.quest.create({
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
