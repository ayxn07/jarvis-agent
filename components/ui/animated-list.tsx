"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type AnimatedListProps = {
  items: string[];
  className?: string;
  itemClassName?: string;
  onItemSelect?: (item: string, index: number) => void;
  displayScrollbar?: boolean;
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

export function AnimatedList({
  items,
  className,
  itemClassName,
  onItemSelect,
  displayScrollbar = true
}: AnimatedListProps) {
  const listClassName = cn(
    "flex flex-col gap-2",
    className,
    !displayScrollbar && "[&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar-thumb]:hidden"
  );

  return (
    <div className={listClassName}>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.button
            key={`${item}-${index}`}
            type="button"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={itemVariants}
            transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
            onClick={() => onItemSelect?.(item, index)}
            className={cn(
              "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-left text-sm text-white/80 transition hover:border-neon-cyan/60 hover:text-white",
              itemClassName
            )}
          >
            {item}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
