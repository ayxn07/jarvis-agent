"use client";

import { cn } from "@/lib/utils";

export type StarBorderProps = React.HTMLAttributes<HTMLDivElement>;

export function StarBorder({ className, children, ...rest }: StarBorderProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl bg-black/30",
        "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-r before:from-neon-cyan/40 before:via-white/10 before:to-neon-magenta/40 before:opacity-70 before:blur-[14px]",
        "after:pointer-events-none after:absolute after:-inset-[1.5px] after:-z-10 after:rounded-[inherit] after:bg-gradient-to-r after:from-neon-magenta/60 after:via-transparent after:to-neon-cyan/60",
        "shadow-[0_18px_60px_rgba(15,0,40,0.35)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
