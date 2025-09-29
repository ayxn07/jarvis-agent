"use client";

import { AnimatedList } from "@/components/ui/animated-list";
import { ShinyText } from "@/components/ui/shiny-text";
import { StarBorder } from "@/components/ui/star-border";
import { motion } from "framer-motion";
import { BookOpen, Camera, Loader2, Sparkles, Workflow } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AudioVisualizer } from "@/components/AudioVisualizer";
import { CameraDock } from "@/components/CameraDock";
import { ChatPanel } from "@/components/ChatPanel";
import { ToolTimeline } from "@/components/ToolTimeline";
import { HeaderDock } from "@/components/HeaderDock";
import { SettingsSheet } from "@/components/SettingsSheet";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJarvisClient } from "@/lib/hooks/use-jarvis-client";
import { useAgentStore } from "@/lib/stores/agent-store";

export function HomePage() {
  const agentSectionRef = useRef<HTMLDivElement | null>(null);
  const tutorialSectionRef = useRef<HTMLDivElement | null>(null);
  const { messages, phase, connected, currentTranscriptPartial, settings } = useAgentStore();
  const {
    audioRef,
    videoRef,
    connect,
    disconnect,
    sendUserText,
    sendControlEvent,
    captureAndSendFrame,
    generateImages,
    attachVideo
  } = useJarvisClient();
  const [cameraBusy, setCameraBusy] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState("16:9");
  const [imageCount, setImageCount] = useState(1);
  const [imageResults, setImageResults] = useState<Array<{ id: string; dataUrl: string; mimeType: string }>>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    connect().catch((error) => console.error("Autoconnect failed", error));
    return () => disconnect();
  }, [connect, disconnect]);

  const handleSnap = useCallback(async () => {
    try {
      setCameraBusy(true);
      await captureAndSendFrame();
    } catch (error) {
      console.error("Frame capture failed", error);
    } finally {
      setCameraBusy(false);
    }
  }, [captureAndSendFrame]);

  useEffect(() => {
    if (!settings.autoFrame || !connected) return;
    const interval = window.setInterval(() => {
      captureAndSendFrame().catch((error) => console.warn("Auto frame failed", error));
    }, Math.max(500, (1 / settings.frameRate) * 1000));
    return () => window.clearInterval(interval);
  }, [captureAndSendFrame, connected, settings.autoFrame, settings.frameRate]);

  const listening = phase === "listening" || phase === "transcribing";
  const speaking = phase === "speaking";

  const heroFeatures = useMemo(
    () => [
      {
        key: "models",
        title: "Multimodel clarity",
        description:
          "Compare Gemini 2.5 Flash against Pro for deep reasoning and see their answers side-by-side in real time.",
        icon: Sparkles
      },
      {
        key: "vision",
        title: "Vision-first capture",
        description:
          "Snap frames or stream the camera feed so Jarvis can diagnose UI states, whiteboards, or physical dashboards instantly.",
        icon: Camera
      },
      {
        key: "workflow",
        title: "Autonomous workflows",
        description:
          "Let Jarvis sequence tools, call tutorials, and surface context windows while you stay focused on direction.",
        icon: Workflow
      },
      {
        key: "collaboration",
        title: "Seamless collaboration",
        description:
          "Share live sessions with teammates, annotate answers, and co-create ideas with synchronized updates.",
        icon: Workflow
      },
      {
        key: "memory",
        title: "Persistent memory",
        description:
          "Jarvis remembers past interactions, adapts to your style, and brings context forward whenever you return.",
        icon: Workflow
      },
      {
        key: "security",
        title: "Enterprise-grade security",
        description:
          "Your data stays encrypted with full compliance for enterprise workflows, ensuring trust and safety at scale.",
        icon: Workflow
      },

    ],
    []
  );


  const tutorialSteps = useMemo(
    () => [
      {
        title: "Prime the command deck",
        description:
          "Open the sliding sidebar to pick models, choose a voice, and tune frame cadence before you launch a session."
      },
      {
        title: "Blend modalities",
        description:
          "Talk, type, or capture a Manual Snap. Jarvis routes inputs through Gemini 2.5 Flash and escalates to Pro when detail matters."
      },
      {
        title: "Audit the trail",
        description:
          "Use the tool timeline to inspect fallbacks, generated imagery, and recommended follow-up prompts without leaving the flow."
      }
    ],
    []
  );

  const quickPrompts = useMemo(
    () => [
      "Draft a rollout plan and compare Flash vs Pro guidance.",
      "Summarize the current screen from a Manual Snap.",
      "Generate UI imagery for a neon glassmorphism dashboard.",
      "Walk me through enabling automatic frame capture."
    ],
    []
  );

  const imageSuggestions = useMemo(
    () => [
      "Cinematic neon glassmorphism control room",
      "Isometric product hero with holographic overlays",
      "Dark UI dashboard rendered with volumetric lighting",
      "Minimal wireframe workspace with cyan accent glow"
    ],
    []
  );

  const scrollToAgent = useCallback(() => {
    agentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToTutorials = useCallback(() => {
    tutorialSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleImageSuggestion = useCallback((suggestion: string) => {
    setImagePrompt((current) => {
      if (!current.trim()) return suggestion;
      if (current.toLowerCase().includes(suggestion.toLowerCase())) return current;
      return `${current.trim()}
${suggestion}`;
    });
  }, []);

  const handleGenerateImages = useCallback(async () => {
    const trimmed = imagePrompt.trim();
    if (!trimmed) {
      setImageError("Add a prompt to generate imagery.");
      return;
    }
    try {
      setImageLoading(true);
      setImageError(null);
      const data = await generateImages({
        prompt: trimmed,
        aspectRatio: imageAspectRatio,
        count: Math.min(Math.max(imageCount, 1), 4)
      });
      setImageResults(data.images ?? []);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Image generation failed");
    } finally {
      setImageLoading(false);
    }
  }, [generateImages, imageAspectRatio, imageCount, imagePrompt]);

  const resetImageStudio = useCallback(() => {
    setImagePrompt("");
    setImageAspectRatio("16:9");
    setImageCount(1);
    setImageResults([]);
    setImageError(null);
    setImageLoading(false);
  }, []);
  return (
    <div className="relative flex min-h-screen w-full flex-col gap-16 pb-24">
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-neon-cyan/15 via-transparent to-neon-magenta/20"
        initial={{ opacity: 0.35, scale: 0.96 }}
        animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.94, 1.03, 0.94] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_0_60px_rgba(36,3,58,0.35)] sm:p-12">
        <div className="pointer-events-none absolute -top-24 -left-28 h-64 w-64 rounded-full bg-neon-cyan/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-neon-magenta/30 blur-3xl" />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
              <Sparkles className="h-4 w-4 text-neon-cyan" />
              Launchpad
            </div>
            <ShinyText text="Jarvis orchestrates Gemini multimodal" className="text-sm font-medium text-white/80" />
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Deploy an agentic cockpit where <span className="text-neon-cyan">Gemini 2.5 Flash</span> and Pro collaborate while Jarvis automates the busywork.
            </h1>
            <p className="max-w-xl text-lg text-white/70">
              Compare streamed responses, auto-capture context, and watch Jarvis stitch tutorials, tools, and telemetry into one live console.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={scrollToAgent} className="gap-2 rounded-full bg-neon-cyan/90 px-6 py-2 text-black transition hover:bg-neon-cyan">
                Try Jarvis
              </Button>
              <Button
                variant="outline"
                onClick={scrollToTutorials}
                className="rounded-full border-white/25 px-6 py-2 text-white/80 transition hover:border-neon-magenta/60 hover:text-white"
              >
                Workflow tour
              </Button>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/45">
                <BookOpen className="h-4 w-4 text-neon-magenta" />
                Starter prompts
              </div>
              <AnimatedList
                items={quickPrompts}
                className="grid gap-2 text-sm text-white/80"
                itemClassName="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-lg"
                displayScrollbar={false}
              />
            </div>
          </div>
          <div className="grid gap-5 ">
            {heroFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
                  viewport={{ once: true, margin: "-80px" }}
                >
                  <StarBorder
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-6 backdrop-blur-xl transition hover:border-neon-cyan/50"
                  >
                    <div className="flex items-start gap-4">
                      <span className="rounded-2xl bg-neon-cyan/10 p-3 text-neon-cyan">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                        <p className="text-sm leading-6 text-white/70">{feature.description}</p>
                      </div>
                    </div>
                  </StarBorder>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section ref={tutorialSectionRef} className="grid gap-6 lg:grid-cols-3">
        {tutorialSteps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.1 }}
            viewport={{ once: true, margin: "-80px" }}
            className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
          >
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-neon-magenta/15 text-sm font-semibold text-neon-magenta">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">{step.description}</p>
          </motion.div>
        ))}
      </section>

      <section ref={agentSectionRef} id="jarvis-workspace" className="scroll-mt-28 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <HeaderDock connected={connected} phase={phase} />
          <SettingsSheet />
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.section
            className="flex min-w-0 flex-col gap-6"
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <ChatPanel
              messages={messages}
              currentPartial={currentTranscriptPartial}
              onSendMessage={sendUserText}
            />
            <motion.div
              className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-6"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              <div className="flex w-full flex-col gap-6 md:w-auto md:flex-row md:items-center">
                <VoiceButton
                  active={listening}
                  onEngage={() => sendControlEvent("start_listen")}
                  onRelease={() => sendControlEvent("stop_listen")}
                />
                <AudioVisualizer audioRef={audioRef} active={speaking} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={handleSnap} className="gap-2">
                  Manual Snap
                </Button>
              </div>
              <audio ref={audioRef} autoPlay className="hidden" />
            </motion.div>
          </motion.section>

          <motion.section
            className="flex min-w-0 flex-col gap-6"
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
            viewport={{ once: true }}
          >
            <CameraDock
              videoRef={videoRef}
              onAttachCamera={attachVideo}
              onSnapFrame={async (roi) => {
                try {
                  setCameraBusy(true);
                  await captureAndSendFrame({ roi: roi ?? undefined });
                } catch (error) {
                  console.error("ROI capture failed", error);
                } finally {
                  setCameraBusy(false);
                }
              }}
              analyzing={cameraBusy}
            />
            <ToolTimeline messages={messages} />
            <ImageStudio
              prompt={imagePrompt}
              onPromptChange={setImagePrompt}
              aspectRatio={imageAspectRatio}
              onAspectRatioChange={setImageAspectRatio}
              count={imageCount}
              onCountChange={(value) => setImageCount(value)}
              onGenerate={handleGenerateImages}
              loading={imageLoading}
              error={imageError}
              images={imageResults}
              suggestions={imageSuggestions}
              onSuggestion={handleImageSuggestion}
              onReset={resetImageStudio}
            />
          </motion.section>
        </div>
      </section>
    </div>
  );
}








type ImageStudioProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  count: number;
  onCountChange: (value: number) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
  images: Array<{ id: string; dataUrl: string; mimeType: string }>;
  suggestions: string[];
  onSuggestion: (value: string) => void;
  onReset: () => void;
};

function ImageStudio({
  prompt,
  onPromptChange,
  aspectRatio,
  onAspectRatioChange,
  count,
  onCountChange,
  onGenerate,
  loading,
  error,
  images,
  suggestions,
  onSuggestion,
  onReset
}: ImageStudioProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Image studio</p>
          <h3 className="text-lg font-semibold text-white">Generate illustrative frames</h3>
        </div>
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-neon-cyan" /> : null}
      </div>
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Describe the scene Jarvis should render..."
        className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="image-aspect">Aspect ratio</Label>
          <Input
            id="image-aspect"
            value={aspectRatio}
            onChange={(event) => onAspectRatioChange(event.target.value)}
            placeholder="16:9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image-count">Variants</Label>
          <Input
            id="image-count"
            type="number"
            min={1}
            max={4}
            value={count}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              if (Number.isNaN(next)) return;
              onCountChange(Math.min(Math.max(next, 1), 4));
            }}
          />
        </div>
      </div>
      {suggestions.length > 0 && (
        <AnimatedList
          items={suggestions}
          className="grid gap-2 text-xs text-white/70"
          itemClassName="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          displayScrollbar={false}
          onItemSelect={(item) => onSuggestion(item)}
        />
      )}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="rounded-full bg-neon-cyan/90 px-6 py-2 text-black transition hover:bg-neon-cyan"
        >
          {loading ? "Generating..." : "Generate imagery"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="rounded-full border-white/20 px-4 py-2 text-xs text-white/70 transition hover:border-neon-magenta/60 hover:text-white"
        >
          Reset
        </Button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((image) => (
            <StarBorder

              key={image.id}
              color="#f472ff"
              className="space-y-2 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/70"
            >
              <img src={image.dataUrl} alt="Generated visual" className="w-full rounded-xl object-cover" />
              <figcaption className="text-[10px] uppercase tracking-[0.3em] text-white/50">{image.mimeType}</figcaption>
            </StarBorder>
          ))}
        </div>
      )}
    </div>
  );
}













