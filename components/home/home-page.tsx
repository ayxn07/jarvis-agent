"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { AudioVisualizer } from "@/components/AudioVisualizer";
import { CameraDock } from "@/components/CameraDock";
import { ChatPanel } from "@/components/ChatPanel";
import { ToolTimeline } from "@/components/ToolTimeline";
import { GalaxyBackground } from "@/components/ui/galaxy-background";
import { HeaderDock } from "@/components/HeaderDock";
import { SettingsSheet } from "@/components/SettingsSheet";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useJarvisClient } from "@/lib/hooks/use-jarvis-client";
import { useAgentStore } from "@/lib/stores/agent-store";

export function HomePage() {
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
    const interval = setInterval(() => {
      captureAndSendFrame().catch((error) => console.warn("Auto frame failed", error));
    }, Math.max(500, (1 / settings.frameRate) * 1000));
    return () => clearInterval(interval);
  }, [captureAndSendFrame, connected, settings.autoFrame, settings.frameRate]);

  const listening = phase === "listening" || phase === "transcribing";
  const speaking = phase === "speaking";

  return (
    <div className="relative flex min-h-screen w-full flex-col gap-8 overflow-hidden">
      <GalaxyBackground />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <HeaderDock connected={connected} phase={phase} />
        <SettingsSheet />
      </div>

      <div className="grid w-full gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.section
          className="flex min-w-0 flex-col gap-6"
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
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
            <div className="flex w-[50%] items-center gap-6">
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
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
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
        </motion.section>
      </div>
    </div>
  );
}
