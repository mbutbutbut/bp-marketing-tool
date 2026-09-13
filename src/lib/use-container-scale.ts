"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks the rendered width of a container element and returns a
 * shrink-to-fit scale factor for content of `contentWidth` px, capped at
 * `maxWidth` so it never upscales past native resolution on a wide screen.
 * Rounds to the nearest 20px so continuous window-drag resizes don't
 * thrash the canvas rebuild on every pixel.
 */
export function useContainerScale(
  contentWidth: number,
  maxWidth: number,
  padding = 32,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(Math.round(width / 20) * 20);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const availableWidth = containerWidth
    ? Math.max(containerWidth - padding, 200)
    : maxWidth;
  const scale = Math.min(1, Math.min(availableWidth, maxWidth) / contentWidth);

  return { containerRef, scale };
}
