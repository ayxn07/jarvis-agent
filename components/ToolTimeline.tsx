"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { useMemo } from "react";

import type { AgentMessage } from "@/lib/stores/agent-store";
import { formatToolName } from "@/lib/tools";
import { cn } from "@/lib/utils";

type ToolTimelineProps = {
  messages: AgentMessage[];
};

type TimelineEntry = {
  id: string;
  ts: number;
  name: string;
  summary: string;
  status: "success" | "error";
};

export function ToolTimeline({ messages }: ToolTimelineProps) {
  const events = useMemo<TimelineEntry[]>(() => {
    const relevant = messages.filter((message) => message.toolCall || message.toolResult || message.role === "tool");
    return relevant
      .map((message) => {
        const name = message.toolName ?? message.toolCall?.name ?? "tool";
        const summary = message.text?.trim().length ? message.text.trim() : `**${formatToolName(name)} executed.**`;
        const status: TimelineEntry["status"] =
          message.toolResult && typeof message.toolResult === "object" && message.toolResult !== null && "error" in (message.toolResult as Record<string, unknown>)
            ? "error"
            : "success";

        return {
          id: message.id,
          ts: message.ts,
          name,
          summary,
          status
        } satisfies TimelineEntry;
      })
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8);
  }, [messages]);

  return (
    <motion.section
      className="rounded-3xl border border-white/10 bg-white/5 p-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Tools</p>
          <h3 className="text-base font-semibold text-white">Tool Timeline</h3>
        </div>
        <Clock3 className="h-5 w-5 text-white/40" />
      </header>
      {events.length === 0 ? (
        <p className="text-sm font-semibold text-white/60">
          Tool executions will appear here when Jarvis runs actions like describe_scene or open_link.
        </p>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.li
                key={event.id}
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                whileHover={{ scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border",
                      event.status === "success"
                        ? "border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan"
                        : "border-red-400/60 bg-red-500/10 text-red-300"
                    )}
                  >
                    {event.status === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {formatToolName(event.name)}
                    </p>
                    <p className="text-sm font-semibold text-white/80">
                      {event.summary.replace(/\*\*/g, "")}
                    </p>
                    <p className="text-xs font-semibold text-white/50">
                      {new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.section>
  );
}
