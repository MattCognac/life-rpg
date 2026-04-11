import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-[10px] font-display uppercase tracking-widest border transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/60 bg-primary/10 text-primary",
        secondary: "border-border bg-secondary text-foreground",
        gold: "border-gold/60 bg-gold/10 text-gold",
        success: "border-success/60 bg-success/10 text-success",
        destructive: "border-destructive/60 bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
