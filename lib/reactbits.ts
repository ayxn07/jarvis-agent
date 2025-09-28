"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export function useKeyPress(targetKey: string, handler: (event: KeyboardEvent) => void) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === targetKey.toLowerCase()) {
        handlerRef.current(event);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [targetKey]);
}

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export function useMeasure<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [bounds, setBounds] = useState<DOMRectReadOnly>();

  const observer = useRef<ResizeObserver>();

  const cleanup = useCallback(() => {
    observer.current?.disconnect();
    observer.current = undefined;
  }, []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    observer.current = new ResizeObserver(([entry]) => {
      if (entry) {
        setBounds(entry.contentRect);
      }
    });
    observer.current.observe(ref.current);
    return cleanup;
  }, [cleanup]);

  return { ref, bounds } as const;
}
