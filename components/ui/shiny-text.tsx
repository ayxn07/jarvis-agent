"use client";

import { cn } from "@/lib/utils";

type Props = { text: string; className?: string; pulse?: boolean };

export function ShinyText({ text, className, pulse = false }: Props) {
  return (
    <span
      className={cn(
        "relative inline-block ml-3  bg-gradient-to-r from-neon-magenta via-neon-cyan to-white bg-clip-text text-transparent",
        "animate-[shine_6s_linear_infinite]",
        pulse && "animate-[pulseGlow_2.8s_ease-in-out_infinite] will-change-transform ",
        className
      )}
    >
      {text}
    </span>
  );
}

// global styles via tailwind plugin replacement for keyframes
