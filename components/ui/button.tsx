"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
  {
    variants: {
      variant: {
        // Primary = dégradé electric-indigo → violet (brand Stratly Momentum).
        primary:
          "text-white shadow-card bg-[linear-gradient(135deg,#6366F1,#8B5CF6)] hover:bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] active:bg-[linear-gradient(135deg,#4338CA,#6D28D9)]",
        secondary:
          "bg-navy text-white hover:bg-navy-800 active:bg-navy-900 shadow-card",
        outline:
          "border border-border bg-white text-ink hover:bg-canvas hover:border-ink-muted/40",
        ghost: "text-ink hover:bg-canvas",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
