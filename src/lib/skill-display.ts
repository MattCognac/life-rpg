import { getDisciplineBySlug } from "@/lib/disciplines";

/** Accent for tags: parent skill color for specializations, else discipline palette, else stored color. */
export function disciplineAccentColor(skill: {
  color: string;
  discipline?: string | null;
  parent?: { color: string } | null;
}): string {
  if (skill.parent?.color) return skill.parent.color;
  if (skill.discipline) {
    const d = getDisciplineBySlug(skill.discipline);
    if (d?.color) return d.color;
  }
  return skill.color;
}
