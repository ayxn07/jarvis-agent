import { cn } from "@/lib/utils";

import type { HTMLAttributes } from "react";

type GalaxyBackgroundProps = HTMLAttributes<HTMLDivElement>;

const STAR_COUNT = 84;

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type Star = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
};

const STARS: Star[] = Array.from({ length: STAR_COUNT }, (_, index) => {
  const seed = index + 1;
  const x = pseudoRandom(seed) * 100;
  const y = pseudoRandom(seed + 1) * 100;
  const size = 1.2 + pseudoRandom(seed + 2) * 2.4;
  const delay = pseudoRandom(seed + 3) * 6;
  const duration = 4.5 + pseudoRandom(seed + 4) * 6.5;
  return { x, y, size, delay, duration };
});

export function GalaxyBackground({ className, ...props }: GalaxyBackgroundProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn(
        "galaxy-background pointer-events-none absolute inset-0 -z-20",
        className
      )}
    >
      <div className="galaxy-background__gradient" />
      <div className="galaxy-background__aurora galaxy-background__aurora--one" />
      <div className="galaxy-background__aurora galaxy-background__aurora--two" />
      <div className="galaxy-background__aurora galaxy-background__aurora--three" />
      <div className="galaxy-background__noise" />
      {STARS.map((star, index) => (
        <span
          key={index}
          className="galaxy-background__star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`
          }}
        />
      ))}
      <div className="galaxy-background__vignette" />
    </div>
  );
}
