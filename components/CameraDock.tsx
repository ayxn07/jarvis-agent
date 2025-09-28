"use client";

import { motion } from "framer-motion";
import { Camera, Crop, Focus, Scan } from "lucide-react";
import { useCallback, useMemo, useState, type PointerEvent, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { useMeasure } from "@/lib/reactbits";
import { cn } from "@/lib/utils";

export type CameraDockProps = {
  videoRef: RefObject<HTMLVideoElement>;
  onAttachCamera: () => Promise<MediaStream | void>;
  onSnapFrame: (roi?: { x: number; y: number; width: number; height: number } | null) => Promise<void>;
  analyzing?: boolean;
};

type OverlayRect = { x: number; y: number; width: number; height: number };

export function CameraDock({ videoRef, onAttachCamera, onSnapFrame, analyzing }: CameraDockProps) {
  const [attached, setAttached] = useState(false);
  const [roiMode, setRoiMode] = useState(false);
  const [roiRect, setRoiRect] = useState<OverlayRect | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const { ref: overlayRef, bounds } = useMeasure<HTMLDivElement>();

  const computedLabel = useMemo(() => {
    if (!attached) return "Enable camera";
    if (analyzing) return "Analyzing frame…";
    if (roiMode) return "ROI mode";
    return "Live preview";
  }, [analyzing, attached, roiMode]);

  const attachCamera = useCallback(async () => {
    await onAttachCamera();
    setAttached(true);
  }, [onAttachCamera]);

  const toVideoCoords = useCallback(() => {
    const video = videoRef.current;
    if (!roiRect || !video || !bounds) return null;
    const scaleX = video.videoWidth / bounds.width;
    const scaleY = video.videoHeight / bounds.height;
    return {
      x: Math.max(0, Math.round(roiRect.x * scaleX)),
      y: Math.max(0, Math.round(roiRect.y * scaleY)),
      width: Math.max(1, Math.round(roiRect.width * scaleX)),
      height: Math.max(1, Math.round(roiRect.height * scaleY))
    };
  }, [bounds, roiRect, videoRef]);

  const handleSnap = useCallback(async () => {
    await onSnapFrame(toVideoCoords());
  }, [onSnapFrame, toVideoCoords]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!roiMode) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setDragStart({ x, y });
      setRoiRect({ x, y, width: 0, height: 0 });
    },
    [roiMode]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!roiMode || !dragStart) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const width = x - dragStart.x;
      const height = y - dragStart.y;
      setRoiRect({
        x: width < 0 ? x : dragStart.x,
        y: height < 0 ? y : dragStart.y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    },
    [dragStart, roiMode]
  );

  const handlePointerUp = useCallback(() => {
    setDragStart(null);
  }, []);

  return (
    <div className="relative min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Vision</p>
          <h2 className="text-lg font-medium text-white/80">Camera Dock</h2>
          <p className="text-xs font-semibold text-white/60">{computedLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={roiMode ? "neon" : "outline"}
            size="sm"
            onClick={() => setRoiMode((prev) => !prev)}
            className="gap-2"
          >
            <Crop className="h-4 w-4" /> ROI
          </Button>
          <Button
            variant={attached ? "outline" : "neon"}
            size="sm"
            onClick={() => (attached ? handleSnap() : attachCamera())}
            className="gap-2"
          >
            {attached ? <Camera className="h-4 w-4" /> : <Focus className="h-4 w-4" />}
            {attached ? "Snap" : "Enable"}
          </Button>
        </div>
      </header>

      <div className="relative aspect-video w-full bg-black/60">
        {!attached && (
          <button
            type="button"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/50"
            onClick={attachCamera}
          >
            <Scan className="h-12 w-12" />
            <span className="text-sm font-semibold">Allow camera access to view live feed.</span>
          </button>
        )}
        <div
          ref={overlayRef}
          className={cn("relative h-full w-full", attached ? "cursor-crosshair" : "cursor-not-allowed")}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover opacity-90"
          />
          {roiMode && roiRect && (
            <motion.div
              className="absolute border border-neon-cyan/70 bg-neon-cyan/10"
              animate={{
                left: roiRect.x,
                top: roiRect.y,
                width: roiRect.width,
                height: roiRect.height
              }}
            />
          )}
          {analyzing && (
            <div className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-semibold text-white/85">
              Processing frame…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


