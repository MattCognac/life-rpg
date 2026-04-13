import { ClassIcon } from "@/components/shared/class-icon";
import type { CharacterClass } from "@/lib/classes";
import { CHARACTER_CLASSES } from "@/lib/classes";
import { Shield } from "lucide-react";

interface Props {
  characterClass: CharacterClass;
  daysActive: number;
  createdAt: Date;
}

export function CharacterIdentity({ characterClass, daysActive, createdAt }: Props) {
  const cls = CHARACTER_CLASSES[characterClass];

  const joinDate = createdAt.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="norse-card p-6 h-full flex flex-col">
      <h2 className="font-display text-xl tracking-widest uppercase text-foreground mb-4">
        Identity
      </h2>

      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-14 h-14 flex items-center justify-center border-2 border-primary/40 bg-primary/10 flex-shrink-0"
          style={{ boxShadow: "0 0 16px hsl(var(--primary) / 0.15)" }}
        >
          <ClassIcon characterClass={characterClass} className="w-8 h-8" />
        </div>
        <div>
          <div className="font-display text-lg tracking-wider uppercase text-gold">
            {cls.name}
          </div>
          <p className="text-xs font-body text-muted-foreground italic mt-0.5">
            &ldquo;{cls.flavor}&rdquo;
          </p>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
              Class Perk
            </div>
            <p className="text-xs font-body text-foreground/80 mt-0.5">
              {cls.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border/60">
        <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
          Adventuring since {joinDate} &bull; {daysActive} day{daysActive === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}
