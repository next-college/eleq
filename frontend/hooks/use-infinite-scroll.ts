"use client";

import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  enabled?: boolean;
}

export function useInfiniteScroll(
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 0.1, enabled = true } = options;
  const triggerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !triggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callbackRef.current();
        }
      },
      { threshold }
    );

    observer.observe(triggerRef.current);

    return () => observer.disconnect();
  }, [threshold, enabled]);

  return triggerRef;
}
