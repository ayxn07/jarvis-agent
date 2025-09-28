"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentStore } from "@/lib/stores/agent-store";

export function DebugScreen() {
  const { messages } = useAgentStore();
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      setLogs((prev) => [event.data as string, ...prev].slice(0, 50));
    };
    window.addEventListener("jarvis-debug-event" as any, listener as any);
    return () => window.removeEventListener("jarvis-debug-event" as any, listener as any);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: 0 });
  }, [logs]);

  return (
    <div className="flex flex-col gap-8 py-16">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-cyan/60">Diagnostics</p>
        <h1 className="text-4xl font-semibold">Debug Console</h1>
        <p className="max-w-3xl text-white/60">
          Inspect realtime events, WebRTC state, and tool results. This is a placeholder and will be
          wired to actual metrics in the next phase.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Event Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={logRef} className="h-80 overflow-y-auto space-y-3 text-xs text-white/70">
              {logs.map((log, index) => (
                <div key={index} className="rounded-xl bg-black/40 p-3 font-mono">
                  {log}
                </div>
              ))}
              {logs.length === 0 && <p className="text-white/50">No realtime events captured yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/70">
            {messages.slice().reverse().map((message) => (
              <div key={message.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                  <span>{message.role}</span>
                  <span>{new Date(message.ts).toLocaleTimeString()}</span>
                </div>
                {(message.displayText ?? message.text) && (
                  <p className="mt-2 text-white/80 whitespace-pre-wrap">
                    {message.displayText ?? message.text}
                  </p>
                )}
              </div>
            ))}
            {messages.length === 0 && <p className="text-white/50">No messages yet.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline">Export Logs</Button>
        <Button variant="outline">Reset Peer</Button>
      </div>
    </div>
  );
}
