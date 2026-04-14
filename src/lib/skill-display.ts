import { getDisciplineBySlug } from "@/lib/disciplines";

const FALLBACK_COLOR = "#dd6119";

/** Accent color derived from discipline. Specializations inherit their parent's discipline. */
export function disciplineAccentColor(skill: {
  discipline?: string | null;
  parent?: { discipline?: string | null } | null;
}): string {
  if (skill.parent?.discipline) {
    const d = getDisciplineBySlug(skill.parent.discipline);
    if (d?.color) return d.color;
  }
  if (skill.discipline) {
    const d = getDisciplineBySlug(skill.discipline);
    if (d?.color) return d.color;
  }
  return FALLBACK_COLOR;
}

/** Resolve a discipline slug to its hex color. */
export function colorForDiscipline(slug: string | null | undefined): string {
  if (!slug) return FALLBACK_COLOR;
  return getDisciplineBySlug(slug)?.color ?? FALLBACK_COLOR;
}
