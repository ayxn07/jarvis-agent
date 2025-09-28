import * as TogglePrimitive from "@radix-ui/react-toggle";
import * as React from "react";

import { cn } from "@/lib/utils";

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>(({ className, pressed, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase text-white/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-magenta",
      pressed && "border-neon-magenta/70 text-white shadow-[0_0_15px_rgba(255,78,205,0.4)]",
      className
    )}
    pressed={pressed}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle };
