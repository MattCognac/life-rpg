import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  Icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "norse-card p-12 text-center flex flex-col items-center gap-4",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full border-2 border-border bg-card-hover flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <div className="font-display text-lg tracking-wider uppercase text-foreground">
          {title}
        </div>
        {description && (
          <div className="text-sm text-muted-foreground font-body mt-1 max-w-md">
            {description}
          </div>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
