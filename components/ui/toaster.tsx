"use client";

import { AnimatePresence, motion } from "framer-motion";

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      <ToastViewport />
      <AnimatePresence initial={false}>
        {toasts.map((toastItem) => (
          <Toast key={toastItem.id} variant={toastItem.variant} asChild forceMount>
            <motion.li
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: "spring", duration: 0.3 }}
            >
              <div className="flex flex-1 flex-col gap-1">
                {toastItem.title && <ToastTitle>{toastItem.title}</ToastTitle>}
                {toastItem.description && (
                  <ToastDescription>{toastItem.description}</ToastDescription>
                )}
              </div>
              {toastItem.action && <ToastAction altText="Action">{toastItem.action}</ToastAction>}
              <ToastClose onClick={() => dismiss(toastItem.id)} />
            </motion.li>
          </Toast>
        ))}
      </AnimatePresence>
    </ToastProvider>
  );
}
