import type { RefObject } from "react";

/**
 * The shared chrome around a template's Fabric canvas: the scrollable
 * bordered container plus the failed-background-image banner. Used by
 * both the Owner's canvas editor and the Editor's fill/export page —
 * everything below this (interactivity, field creation) differs between
 * the two and stays local to each.
 */
export default function CanvasSurface({
  containerRef,
  canvasRef,
  backgroundLoadFailed,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  backgroundLoadFailed: boolean;
}) {
  return (
    <div>
      {backgroundLoadFailed && (
        <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Background image couldn&apos;t load — showing text layout only.
          Exports made now won&apos;t include the template background.
        </p>
      )}
      <div
        ref={containerRef}
        className="overflow-auto rounded-lg border border-zinc-200 bg-zinc-100 p-4"
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
