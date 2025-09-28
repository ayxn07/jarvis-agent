"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type RefObject } from "react";

export type AudioVisualizerProps = {
  audioRef: RefObject<HTMLAudioElement>;
  active: boolean;
};

const BAR_COUNT = 32;
const PEAK_DECAY = 0.08;

export function AudioVisualizer({ audioRef, active }: AudioVisualizerProps) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number>();
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0.05));

  useEffect(() => {
    if (!audioRef.current) return;

    const audioEl = audioRef.current;
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;
    analyserRef.current = analyser;

    const resumeContext = () => {
      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }
    };

    const interactionEvents: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "keydown"];
    const handleUserInteraction = () => {
      interactionEvents.forEach((eventName) => window.removeEventListener(eventName, handleUserInteraction));
      resumeContext();
    };

    if (context.state !== "running") {
      interactionEvents.forEach((eventName) => window.addEventListener(eventName, handleUserInteraction));
    }

    const handlePlay = () => {
      resumeContext();
    };

    audioEl.addEventListener("play", handlePlay);
    resumeContext();

    const source = context.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(context.destination);

    const update = () => {
      const analyserNode = analyserRef.current;
      if (analyserNode) {
        const scratch = new Float32Array(analyserNode.frequencyBinCount);
        analyserNode.getFloatFrequencyData(scratch);
        const bucketSize = Math.max(1, Math.floor(scratch.length / BAR_COUNT));
        setLevels((prev) => {
          const next = prev.slice();
          for (let i = 0; i < BAR_COUNT; i += 1) {
            const start = i * bucketSize;
            let sum = 0;
            for (let j = 0; j < bucketSize && start + j < scratch.length; j += 1) {
              sum += scratch[start + j];
            }
            const avg = bucketSize > 0 ? sum / bucketSize : 0;
            const normalized = Math.max(0, Math.min(1, (avg + 140) / 140));
            const eased = next[i] * (1 - PEAK_DECAY) + normalized * PEAK_DECAY;
            next[i] = Math.max(0.02, eased);
          }
          return next;
        });
      }
      frameRef.current = window.requestAnimationFrame(update);
    };

    frameRef.current = window.requestAnimationFrame(update);

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      interactionEvents.forEach((eventName) => window.removeEventListener(eventName, handleUserInteraction));
      audioEl.removeEventListener("play", handlePlay);
      source.disconnect();
      analyser.disconnect();
      context.close().catch(() => {});
      analyserRef.current = null;
    };
  }, [audioRef]);

  useEffect(() => {
    if (active) return;
    const interval = window.setInterval(() => {
      setLevels((prev) => prev.map((value) => Math.max(0.02, value * 0.9)));
    }, 100);
    return () => window.clearInterval(interval);
  }, [active]);

  return (
    <div className="flex h-20 w-full items-end gap-[4px] overflow-hidden rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      {levels.map((level, index) => (
        <motion.span
          key={index}
          className="relative flex-1 overflow-hidden rounded-full bg-gradient-to-t from-neon-magenta/40 via-neon-cyan/60 to-white/80"
          animate={{ height: `${Math.max(level, 0.05) * 100}%` }}
          transition={{ duration: 0.12, ease: "easeOut" }}
        >
          <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 via-transparent" />
        </motion.span>
      ))}
    </div>
  );
}
