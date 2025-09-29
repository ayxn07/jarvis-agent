"use client";

import { cn } from "@/lib/utils";

export function ShinyText({ text, className }: { text: string; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent",
        "animate-[shine_6s_linear_infinite]",
        className
      )}
    >
      {text}
    </span>
  );
}

 // global styles via tailwind plugin replacement for keyframes
