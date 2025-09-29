"use client";

import { cn } from "@/lib/utils";

export type StarBorderProps = React.HTMLAttributes<HTMLDivElement>;

export function StarBorder({ className, children, ...rest }: StarBorderProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl bg-gradient-to-r from-cyan-400/30 to-blue-600/30",
        "border border-transparent hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,255,255,0.8)]",
        "transition-all duration-300",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
