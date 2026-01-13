"use client";

import { Loader2 } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

interface InfiniteScrollTriggerProps {
  onIntersect: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function InfiniteScrollTrigger({
  onIntersect,
  hasMore,
  isLoading,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useInfiniteScroll(onIntersect, {
    enabled: hasMore && !isLoading,
  });

  if (!hasMore && !isLoading) {
    return null;
  }

  return (
    <div ref={triggerRef} className="flex justify-center py-8">
      {isLoading && (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
