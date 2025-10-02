"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import type { AgentPhase } from "@/lib/stores/agent-store";
import { cn } from "@/lib/utils";

const phaseLabels: Record<AgentPhase, string> = {
  idle: "Idle",
  listening: "Listening",
  transcribing: "Transcribing",
  thinking: "Thinking",
  speaking: "Speaking",
  error: "Error"
};

const phaseColors: Record<AgentPhase, string> = {
  idle: "bg-white/20",
  listening: "bg-neon-cyan/60",
  transcribing: "bg-neon-cyan/80",
  thinking: "bg-neon-magenta/70",
  speaking: "bg-neon-magenta/80",
  error: "bg-red-500/70"
};

export function HeaderDock({
  connected,
  phase
}: {
  connected: boolean;
  phase: AgentPhase;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5/70 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan/60 to-neon-magenta/60 text-white shadow-[0_0_25px_rgba(0,171,255,0.4)]"
          initial={{ rotate: -12, scale: 0.92 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 12 }}
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Jarvis</h1>
          <motion.p
            className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-white/60"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
          >
            Adaptive multimodal operations
          </motion.p>
        </div>
      </div>
      <motion.div
        className={cn(
          "relative flex items-center gap-3 rounded-full border border-white/10 px-4 ml-4 mt-3 py-2 text-xs uppercase tracking-[0.3em]",
          connected ? "text-white" : "text-white/50"
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: connected ? 1.05 : 1 }}
      >
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          <span
            className={cn(
              "absolute h-full w-full rounded-full blur-sm transition",
              connected ? "bg-neon-cyan/70" : "bg-white/20"
            )}
          />
          <span
            className={cn("relative h-2.5 w-2.5 rounded-full transition", phaseColors[phase])}
          />
        </span>
        {connected ? `Connected - ${phaseLabels[phase]}` : "Offline"}
      </motion.div>
    </div>
  );
}

