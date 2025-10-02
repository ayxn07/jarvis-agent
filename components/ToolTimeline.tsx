"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Link2, Search, CalendarCheck, Camera } from "lucide-react";
import { useMemo, useState } from "react";

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
  status: "running" | "success" | "error";
  args?: unknown;
  result?: unknown;
};

export function ToolTimeline({ messages }: ToolTimelineProps) {
  const events = useMemo<TimelineEntry[]>(() => {
    const relevant = messages.filter((message) => message.toolCall || message.toolResult || message.role === "tool");
    return relevant
      .map((message) => {
        const name = message.toolName ?? message.toolCall?.name ?? "tool";
        const summary = message.text?.trim().length ? message.text.trim() : `**${formatToolName(name)} executed.**`;
        let status: TimelineEntry["status"] = "running";
        if (message.toolResult) {
          status =
            typeof message.toolResult === "object" && message.toolResult !== null && "error" in (message.toolResult as Record<string, unknown>)
              ? "error"
              : "success";
        }

        return {
          id: message.id,
          ts: message.ts,
          name,
          summary,
          status,
          args: message.toolCall?.args,
          result: message.toolResult
        } satisfies TimelineEntry;
      })
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8);
  }, [messages]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const ToolIcon = ({ name, status }: { name: string; status: TimelineEntry["status"] }) => {
    const base =
      status === "success"
        ? "border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan"
        : status === "error"
        ? "border-red-400/60 bg-red-500/10 text-red-300"
        : "border-white/25 bg-white/5 text-white/70";
    const Icon = name.includes("describe")
      ? Camera
      : name.includes("open_link") || name.includes("open")
      ? Link2
      : name.includes("search")
      ? Search
      : name.includes("calendar")
      ? CalendarCheck
      : status === "running"
      ? Loader2
      : CheckCircle2;
    return (
      <span className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border", base)}>
        <Icon className={cn("h-4 w-4", status === "running" && "animate-spin")} />
      </span>
    );
  };

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
                  <ToolIcon name={event.name} status={event.status} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {formatToolName(event.name)}
                    </p>
                    <p className="text-sm font-semibold text-white/80">{event.summary.replace(/\*\*/g, "")}</p>
                    <p className="text-xs font-semibold text-white/50">
                      {new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {(typeof event.args !== "undefined" || typeof event.result !== "undefined") && (
                      <div className="mt-2">
                        <button
                          className="text-xs text-neon-cyan hover:underline"
                          onClick={() => toggle(event.id)}
                        >
                          {expanded[event.id] ? "Hide details" : "Show details"}
                        </button>
                        {expanded[event.id] && (
                          <div className="mt-2 grid gap-2 rounded-xl border border-white/10 bg-black/40 p-2">
                            {typeof event.args !== "undefined" && (
                              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-white/70">
                                {JSON.stringify(event.args, null, 2)}
                              </pre>
                            )}
                            {typeof event.result !== "undefined" && (
                              <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words text-xs text-white/70">
                                {JSON.stringify(event.result, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
