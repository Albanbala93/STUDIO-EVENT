import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
  {
    variants: {
      tone: {
        success: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent/20",
        warn: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20",
        danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-500/20",
        info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-500/20",
        neutral: "bg-gray-100 text-ink-muted ring-1 ring-inset ring-border",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
