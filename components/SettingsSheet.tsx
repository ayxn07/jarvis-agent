"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { useAgentStore } from "@/lib/stores/agent-store";

export function SettingsSheet() {
  const { settings, setSettings } = useAgentStore();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
          <Settings className="h-4 w-4" /> Preferences
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full max-w-md flex-col overflow-hidden border-white/10 bg-white/10 text-white backdrop-blur-xl"
      >
        <motion.div
          initial={{ x: 64, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          className="flex h-full flex-col gap-8 overflow-y-auto p-8"
        >
          <SheetHeader className="items-start text-left">
            <SheetTitle className="text-xl font-semibold text-white">Command Deck</SheetTitle>
            <SheetDescription className="text-sm text-white/60">
              Dial in Jarvis behaviour, audio, and capture cadence. Preferences are cached locally.
            </SheetDescription>
          </SheetHeader>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-6 shadow-[0_0_35px_rgba(12,12,45,0.35)]">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Auto-send Frames</h3>
                <p className="text-xs text-white/60">Continuously capture frames while connected.</p>
              </div>
              <Toggle pressed={settings.autoFrame} onPressedChange={(pressed) => setSettings({ autoFrame: pressed })}>
                {settings.autoFrame ? "On" : "Off"}
              </Toggle>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="frameRate">Frame cadence (fps)</Label>
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
                <Label htmlFor="speechRate">Speech tempo</Label>
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
          </section>

          <section className="space-y-5 rounded-2xl border border-white/10 bg-black/25 p-6 shadow-[0_0_35px_rgba(12,12,45,0.35)]">
            <header>
              <h3 className="text-sm font-semibold text-white">Model & Voice</h3>
              <p className="text-xs text-white/60">Target models and TTS voices drive Jarvis personality.</p>
            </header>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Gemini model</Label>
                <Input
                  id="model"
                  value={settings.model}
                  onChange={(event) => setSettings({ model: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voice">Voice ID</Label>
                <Input
                  id="voice"
                  placeholder="ElevenLabs voice ID"
                  value={settings.voice}
                  onChange={(event) => setSettings({ voice: event.target.value })}
                />
                <p className="text-xs text-white/50">
                  Paste a voice ID from ElevenLabs. Leave blank to retain the default cinematic register.
                </p>
              </div>
            </div>
          </section>

          <motion.div
            className="mt-auto flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-5"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div>
              <h4 className="text-sm font-semibold text-white">Reset conversational context</h4>
              <p className="text-xs text-white/55">Clear transcripts and cached state from this device.</p>
            </div>
            <Button variant="outline" className="border-white/30 text-white/80 transition hover:border-neon-magenta/60 hover:text-white">
              Clear Memory
            </Button>
          </motion.div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}

