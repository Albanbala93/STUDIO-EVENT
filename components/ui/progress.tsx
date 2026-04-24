import * as React from "react";
import { cn } from "../../lib/utils";

export function Progress({
  value,
  barClassName,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: number;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-gray-100",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          barClassName ?? "bg-accent",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
