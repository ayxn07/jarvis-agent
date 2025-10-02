"use client";

import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

export type VoiceButtonProps = {
  active: boolean;
  disabled?: boolean;
  onEngage: () => void;
  onRelease: () => void;
};

export function VoiceButton({ active, disabled, onEngage, onRelease }: VoiceButtonProps) {
  const [pressing, setPressing] = useState(false);

  const handlePressStart = useCallback(() => {
    if (disabled || pressing) return;
    setPressing(true);
    onEngage();
  }, [disabled, onEngage, pressing]);

  const handlePressEnd = useCallback(() => {
    if (disabled || !pressing) return;
    setPressing(false);
    onRelease();
  }, [disabled, onRelease, pressing]);




  return (
    <motion.button
      type="button"
      disabled={disabled}
      className={cn(
        "relative flex h-20 w-[100px] rounded-circle items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-white shadow-[0_0_35px_rgba(0,171,255,0.2)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan",
        (active || pressing) && "from-neon-cyan/40 to-neon-magenta/40 shadow-[0_0_45px_rgba(255,0,176,0.4)]",
        disabled && "opacity-50"
      )}
      whileTap={{ scale: 0.95 }}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onPointerCancel={handlePressEnd}
    >
      <motion.div
        className="absolute -z-10 h-44 w-44 rounded-full bg-neon-cyan/10"
        animate={{
          scale: active || pressing ? [1, 1.08, 1] : 0,
          opacity: active || pressing ? [0.4, 0.7, 0.4] : 0
        }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      {active || pressing ? <Mic className="h-9 w-9" /> : <MicOff className="h-9 w-9" />}
      <span className="sr-only">{active ? "Stop voice capture" : "Start voice capture"}</span>
    </motion.button>
  );
}




