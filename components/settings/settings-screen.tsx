"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { useAgentStore } from "@/lib/stores/agent-store";

export function SettingsScreen() {
  const { settings, setSettings } = useAgentStore();
  const voices = useMemo(() => ["verse", "alloy", "aria"], []);

  return (
    <div className="space-y-10 py-16">
      <section className="space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-neon-magenta/70">Realtime</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Settings</h1>
          <p className="mt-2 max-w-2xl text-white/60">
            Configure Jarvis preferences. This screen will grow with additional controls as we wire
            the full UI.
          </p>
        </header>
        <div className="rounded-3xl border border-white/10 p-6 ">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white/80">Auto Frame Capture</h2>
              <p className="text-sm text-white/50">
                Automatically send video snapshots while connected.
              </p>
            </div>
            <Toggle
              pressed={settings.autoFrame}
              onPressedChange={(pressed) => setSettings({ autoFrame: pressed })}
            >
              {settings.autoFrame ? "Enabled" : "Disabled"}
            </Toggle>
          </div>
        </div>
        <div className="grid gap-6 rounded-3xl border border-white/10 p-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={settings.model}
              onChange={(event) => setSettings({ model: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <select
              id="voice"
              className="h-11 w-full rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white"
              value={settings.voice}
              onChange={(event) => setSettings({ voice: event.target.value })}
            >
              {voices.map((voice) => (
                <option key={voice} value={voice} className="bg-background">
                  {voice}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="frameRate">Frame Rate (fps)</Label>
            <Input
              id="frameRate"
              type="number"
              step={0.5}
              min={0.5}
              max={3}
              value={settings.frameRate}
              onChange={(event) => setSettings({ frameRate: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="speechRate">Speech Rate</Label>
            <Input
              id="speechRate"
              type="number"
              step={0.1}
              min={0.5}
              max={2}
              value={settings.speechRate}
              onChange={(event) => setSettings({ speechRate: Number(event.target.value) })}
            />
          </div>
        </div>
        <Button variant="outline" className="border-white/20 text-white/60">
          Clear Memory (coming soon)
        </Button>
      </section>
    </div>
  );
}
