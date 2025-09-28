"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type TypewriterTextProps = {
  phrases: string[];
  className?: string;
  interval?: number;
  pause?: number;
};

type TypewriterPhase = "typing" | "pause" | "deleting";

export function TypewriterText({ phrases, className, interval = 85, pause = 1400 }: TypewriterTextProps) {
  const sanitized = useMemo(() => phrases.filter((phrase) => phrase && phrase.trim().length > 0), [phrases]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState("");
  const [phase, setPhase] = useState<TypewriterPhase>("typing");

  useEffect(() => {
    if (sanitized.length === 0) return;
    const current = sanitized[index % sanitized.length];
    let timeout = 0;

    if (phase === "typing") {
      if (visible.length < current.length) {
        timeout = window.setTimeout(() => {
          setVisible(current.slice(0, visible.length + 1));
        }, interval);
      } else {
        timeout = window.setTimeout(() => setPhase("pause"), pause);
      }
    } else if (phase === "pause") {
      timeout = window.setTimeout(() => setPhase("deleting"), 500);
    } else if (phase === "deleting") {
      if (visible.length > 0) {
        timeout = window.setTimeout(() => {
          setVisible(current.slice(0, visible.length - 1));
        }, Math.max(45, interval / 1.4));
      } else {
        timeout = window.setTimeout(() => {
          setPhase("typing");
          setIndex((prev) => (prev + 1) % sanitized.length);
        }, 200);
      }
    }

    return () => window.clearTimeout(timeout);
  }, [interval, pause, sanitized, index, visible, phase]);

  useEffect(() => {
    setVisible("");
    setPhase("typing");
    setIndex(0);
  }, [sanitized]);

  if (sanitized.length === 0) {
    return <span className={cn("inline-flex items-center", className)} />;
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span>{visible}</span>
      <span className="h-4 w-[2px] animate-pulse bg-white/75" />
    </span>
  );
}
