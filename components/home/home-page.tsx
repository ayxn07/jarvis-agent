"use client";

import { AnimatedList } from "@/components/ui/animated-list";
import { ShinyText } from "@/components/ui/shiny-text";
import { StarBorder } from "@/components/ui/star-border";
import { motion } from "framer-motion";
import { BookOpen, Camera, Sparkles, Workflow } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AudioVisualizer } from "@/components/AudioVisualizer";
import { CameraDock } from "@/components/CameraDock";
import { ChatPanel } from "@/components/ChatPanel";
import { ToolTimeline } from "@/components/ToolTimeline";
import { HeaderDock } from "@/components/HeaderDock";
import ImageGenerator from "@/components/image/image-generator";
import { SettingsSheet } from "@/components/SettingsSheet";
import { VoiceButton } from "@/components/VoiceButton";
import { useJarvisClient } from "@/lib/hooks/use-jarvis-client";
import { Button } from "@/components/ui/button";
import { useAgentStore } from "@/lib/stores/agent-store";
import SplashCursor from "../ui/SplashCursor";

export function HomePage() {
  const agentSectionRef = useRef<HTMLDivElement | null>(null);
  const tutorialSectionRef = useRef<HTMLDivElement | null>(null);
  const docsSectionRef = useRef<HTMLDivElement | null>(null);
  const [activeDoc, setActiveDoc] = useState<string>("setup");
  const asideWrapperRef = useRef<HTMLDivElement | null>(null);
  const asideRef = useRef<HTMLDivElement | null>(null);
  const [useFixedNav, setUseFixedNav] = useState(false);
  const [fixedBox, setFixedBox] = useState<{ left: number; width: number; height: number }>({ left: 0, width: 0, height: 0 });
  const { messages, phase, connected, currentTranscriptPartial, settings } = useAgentStore();
  const {
    audioRef,
    videoRef,
    connect,
    disconnect,
    sendUserText,
    sendControlEvent,
    captureAndSendFrame,
    attachVideo
  } = useJarvisClient();
  const [cameraBusy, setCameraBusy] = useState(false);
  const quickPrompts = useMemo(() => [
    "Draft a rollout plan and compare Flash vs Pro guidance.",
    "Summarize the current screen from a Manual Snap.",
    "Walk me through enabling automatic frame capture."
  ], []);

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

  // Documentation / Tutorial content structure
  const docsSections = useMemo(
    () => [
      {
        id: "setup",
        title: "Setup & Models",
        items: [
          {
            title: "API keys & env",
            body:
              "Set GEMINI_API_KEY in your environment. Optionally set IMAGE_MODEL or choose at runtime in Settings."
          },
          {
            title: "Model selection",
            body:
              "Use the Settings panel to pick between faster or higher-fidelity models. The app persists your choice."
          }
        ]
      },
      {
        id: "interact",
        title: "Interact with Jarvis",
        items: [
          {
            title: "Chat & Voice",
            body:
              "Type in the chat or press-and-hold the voice button to talk. The agent cycles through listening → thinking → speaking."
          },
          {
            title: "Camera snaps",
            body:
              "Use Manual Snap to capture the current frame, or enable auto-frame in Settings for continuous vision context."
          }
        ]
      },
      {
        id: "tools",
        title: "Tools & Timeline",
        items: [
          {
            title: "Tool lifecycle",
            body:
              "Every tool call logs to the timeline with running → success/error states, args, and results for quick auditing."
          },
          {
            title: "Extensible endpoints",
            body:
              "Add new tools under /api/tools/* with Zod schemas. The UI will reflect them automatically in the timeline."
          }
        ]
      },
      {
        id: "images",
        title: "Image Generation",
        items: [
          {
            title: "Prompt & model",
            body:
              "Open the Image Generator, enter a prompt, and pick a model. Download results and clear the canvas when done."
          }
        ]
      },
      {
        id: "settings",
        title: "Settings & Persistence",
        items: [
          {
            title: "Tuning",
            body:
              "Choose voice, adjust frame rate, and toggle auto-frame capture. Preferences are persisted for your next session."
          }
        ]
      }
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
          "Use the tool timeline to inspect fallbacks and recommended follow-up prompts without leaving the flow."
      }
    ],
    []
  );


  const scrollToAgent = useCallback(() => {
    agentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToTutorials = useCallback(() => {
    tutorialSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const scrollToDocs = useCallback(() => {
    docsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Observe doc sections to highlight active item in the sticky nav
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[id^="doc-"]');
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry most in view
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          const id = visible.target.id.replace("doc-", "");
          setActiveDoc(id);
        }
      },
      {
        root: null,
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Pin docs nav to viewport using a fixed fallback when section is in view
  useEffect(() => {
    const onScrollResize = () => {
      const docEl = docsSectionRef.current;
      const wrap = asideWrapperRef.current;
      const nav = asideRef.current;
      if (!docEl || !wrap || !nav) return;
      const docRect = docEl.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const maxH = Math.max(200, window.innerHeight - 16);
      const navH = Math.min(nav.scrollHeight, maxH);
      // Should fix when the docs section has reached the top and there's still room at the bottom
      const shouldFix = docRect.top <= 8 && docRect.bottom - navH >= 16;
      setUseFixedNav(shouldFix);
      setFixedBox({ left: wrapRect.left, width: wrapRect.width, height: navH });
    };
    onScrollResize();
    window.addEventListener("scroll", onScrollResize, { passive: true });
    window.addEventListener("resize", onScrollResize);
    return () => {
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
    };
  }, []);






  return (
    <div className="relative flex min-h-screen w-full flex-col gap-16 pb-24">
      <SplashCursor />
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-neon-magenta/20 via-neon-cyan/10 to-neon-magenta/25"
        initial={{ opacity: 0.35, scale: 0.96 }}
        animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.94, 1.03, 0.94] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_0_60px_rgba(36,3,58,0.35)] sm:p-12">
        <div className="pointer-events-none absolute -top-24 -left-28 h-64 w-64 rounded-full bg-neon-magenta/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-neon-cyan/20 blur-3xl" />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">

            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Sparkles className="h-4 w-4 text-neon-magenta" />
              Launchpad
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            >
              <ShinyText pulse text="Jarvis orchestrates Gemini multimodal" className="text-sm font-medium text-white/80" />
            </motion.div>
            <motion.h1
              className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
            >
              Deploy an agentic cockpit where <span className="text-neon-magenta">Gemini 2.5 Flash</span> and Pro collaborate while Jarvis automates the busywork.
            </motion.h1>
            <motion.p
              className="max-w-xl text-lg text-white/70"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.18 }}
            >
              Compare streamed responses, auto-capture context, and watch Jarvis stitch tutorials, tools, and telemetry into one live console.
            </motion.p>
            <motion.div
              className="flex flex-wrap gap-3"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <Button onClick={scrollToAgent} variant="neon" className="gap-2 rounded-full px-6 py-2 transition hover:scale-[1.02]">
                  Try Jarvis
                </Button>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <Button
                  variant="outline"
                  onClick={scrollToTutorials}
                  className="rounded-full border-white/25 px-6 py-2 text-white/80 transition hover:border-neon-magenta/70 hover:text-white hover:scale-[1.02]"
                >
                  Workflow tour
                </Button>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <Button
                  variant="link"
                  onClick={scrollToDocs}
                  className="rounded-full px-2 text-neon-magenta hover:text-neon-cyan"
                >
                  Documentation
                </Button>
              </motion.div>
            </motion.div>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/45">
                <BookOpen className="h-4 w-4 text-neon-cyan" />
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
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-6 backdrop-blur-xl transition hover:border-neon-magenta/60"
                  >
                    <div className="flex items-start gap-4">
                      <span className="rounded-2xl bg-neon-magenta/10 p-3 text-neon-magenta">
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

      {/* Documentation / Tutorials Section */}
      <section ref={docsSectionRef} id="documentation" className="relative grid items-start gap-8 lg:grid-cols-[minmax(240px,280px)_1fr]">
        <aside className="self-start">
          <div ref={asideWrapperRef} style={{ minHeight: useFixedNav ? fixedBox.height : undefined }}>
            <div
              ref={asideRef}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md overflow-auto"
              style={
                useFixedNav
                  ? { position: "fixed", top: 0, left: fixedBox.left, width: fixedBox.width, maxHeight: "calc(100vh)", zIndex: 50 }
                  : { position: "sticky" as const, top: 0, maxHeight: "calc(100vh)", zIndex: 30 }
              }
            >
              <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/50">Docs</p>
              <nav className="grid gap-2">
                {docsSections.map((sec) => {
                  const isActive = activeDoc === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => document.getElementById(`doc-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className={[
                        "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                        isActive
                          ? "border border-neon-magenta/60 bg-neon-magenta/10 text-white"
                          : "border border-white/10 bg-white/5 text-white/70 hover:border-neon-magenta/60 hover:text-white"
                      ].join(" ")}
                    >
                      {sec.title}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>
        <div className="grid gap-6 min-h-[150vh]">
          {docsSections.map((sec, idx) => (
            <motion.article
              id={`doc-${sec.id}`}
              key={sec.id}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.45, ease: "easeOut", delay: Math.min(idx * 0.05, 0.2) }}
            >
              <h3 className="mb-2 text-lg font-semibold text-white">{sec.title}</h3>
              <div className="grid gap-3">
                {sec.items.map((it) => (
                  <motion.div
                    key={it.title}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-120px" }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <p className="text-sm font-semibold text-neon-magenta">{it.title}</p>
                    <p className="mt-1 text-sm text-white/75">{it.body}</p>
                  </motion.div>
                ))}
              </div>
            </motion.article>
          ))}
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
            <ImageGenerator />

          </motion.section>
        </div>
      </section>
    </div>
  );
}






















