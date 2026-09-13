"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { loadGoogleFont } from "@/lib/google-fonts";

interface CanvasField {
  fieldKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: string;
  maskColor: string;
  defaultValue: string;
}

interface CanvasJson {
  backgroundImageUrl: string | null;
  backgroundFill: string | null;
  width: number;
  height: number;
  fields: CanvasField[];
}

interface FillField {
  fieldKey: string;
  label: string;
  defaultValue: string;
  maxLength: number | null;
}

interface Variant {
  id: string;
  label: string;
  dpi: number;
  canvasJson: unknown;
  fields: FillField[];
}

const MAX_CANVAS_WIDTH = 640;

export default function FillEditor({
  templateId,
  templateName,
  variants,
}: {
  templateId: string;
  templateName: string;
  variants: Variant[];
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0].id);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      for (const v of variants) {
        for (const f of v.fields) {
          if (!(f.fieldKey in initial)) initial[f.fieldKey] = f.defaultValue;
        }
      }
      return initial;
    },
  );
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const textObjectsRef = useRef<Map<string, fabric.Textbox>>(new Map());

  const variant = variants.find((v) => v.id === selectedVariantId)!;
  const data = variant.canvasJson as CanvasJson;
  const scale = Math.min(1, MAX_CANVAS_WIDTH / data.width);
  const editableSet = new Set(variant.fields.map((f) => f.fieldKey));

  useEffect(() => {
    if (!canvasElRef.current) return;
    const textObjects = textObjectsRef.current;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: data.width * scale,
      height: data.height * scale,
      backgroundColor: data.backgroundFill ?? "#f4f4f5",
      selection: false,
    });
    fabricCanvasRef.current = canvas;

    let disposed = false;

    async function setup() {
      if (data.backgroundImageUrl) {
        try {
          const proxiedUrl = `/api/figma-image?url=${encodeURIComponent(
            data.backgroundImageUrl,
          )}`;
          const img = await fabric.FabricImage.fromURL(proxiedUrl);
          if (disposed) return;
          img.set({
            left: 0,
            top: 0,
            originX: "left",
            originY: "top",
            scaleX: (data.width * scale) / (img.width ?? data.width),
            scaleY: (data.height * scale) / (img.height ?? data.height),
            selectable: false,
            evented: false,
          });
          canvas.add(img);
          canvas.sendObjectToBack(img);
          canvas.requestRenderAll();
        } catch (err) {
          console.error("Failed to load template background image", err);
        }
      }

      for (const field of data.fields) {
        if (!editableSet.has(field.fieldKey)) continue;

        loadGoogleFont(field.fontFamily);
        try {
          await document.fonts.load(
            `${field.fontSize}px "${field.fontFamily}"`,
          );
        } catch {
          // Fall back silently if the font can't be loaded as a web font.
        }
        if (disposed) return;

        const mask = new fabric.Rect({
          left: field.x * scale,
          top: field.y * scale,
          originX: "left",
          originY: "top",
          width: field.width * scale,
          height: field.height * scale,
          fill: field.maskColor,
          selectable: false,
          evented: false,
        });

        const text = new fabric.Textbox(
          fieldValues[field.fieldKey] ?? field.defaultValue,
          {
            left: field.x * scale,
            top: field.y * scale,
            originX: "left",
            originY: "top",
            width: field.width * scale,
            fontFamily: field.fontFamily,
            fontSize: field.fontSize * scale,
            fill: field.color,
            textAlign: field.align as fabric.Textbox["textAlign"],
            selectable: false,
            evented: false,
          },
        );

        textObjects.set(field.fieldKey, text);
        canvas.add(mask);
        canvas.add(text);
      }

      canvas.requestRenderAll();
    }

    setup();

    return () => {
      disposed = true;
      canvas.dispose();
      textObjects.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId]);

  function updateField(fieldKey: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [fieldKey]: value }));
    const text = textObjectsRef.current.get(fieldKey);
    if (text) {
      text.set({ text: value });
      fabricCanvasRef.current?.requestRenderAll();
    }
  }

  function triggerDownload(href: string, filename: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function safeName() {
    return `${templateName}-${variant.label}`.replace(/[^a-z0-9]+/gi, "-");
  }

  function exportImage(format: "png" | "jpeg") {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL({
        format,
        quality: format === "jpeg" ? 0.92 : 1,
        multiplier: 1 / scale,
      });
      triggerDownload(
        dataUrl,
        `${safeName()}.${format === "jpeg" ? "jpg" : "png"}`,
      );
      setExportError(null);
      fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          variantId: variant.id,
          format: format === "jpeg" ? "JPG" : "PNG",
        }),
      }).catch(() => {});
    } catch (err) {
      console.error(err);
      setExportError("Couldn't export an image for this design.");
    }
  }

  async function exportPdf() {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    setExporting("pdf");
    setExportError(null);

    try {
      const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 / scale });
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: dataUrl,
          widthPx: data.width,
          heightPx: data.height,
          dpi: variant.dpi,
          templateId,
          variantId: variant.id,
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${safeName()}.pdf`);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setExportError("Couldn't generate a PDF for this design.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-900">
          {templateName}
        </h1>
        <p className="text-sm text-zinc-500">
          Fill in the content below, then export the size(s) you need.
        </p>
      </div>

      {variants.length > 1 && (
        <div className="mb-4 flex gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVariantId(v.id)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                v.id === selectedVariantId
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
        <div className="overflow-auto rounded-lg border border-zinc-200 bg-zinc-100 p-4">
          <canvas ref={canvasElRef} />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            {variant.fields.length === 0 ? (
              <p className="text-sm text-zinc-500">
                This size has no editable fields.
              </p>
            ) : (
              <div className="space-y-3">
                {variant.fields.map((field) => (
                  <div key={field.fieldKey}>
                    <label className="mb-1 block text-xs font-medium text-zinc-700">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={fieldValues[field.fieldKey] ?? ""}
                      maxLength={field.maxLength ?? undefined}
                      onChange={(e) =>
                        updateField(field.fieldKey, e.target.value)
                      }
                      className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="mb-2 text-xs font-medium text-zinc-700">Export</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => exportImage("png")}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Download PNG
              </button>
              <button
                onClick={() => exportImage("jpeg")}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Download JPG
              </button>
              <button
                onClick={exportPdf}
                disabled={exporting === "pdf"}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
              >
                {exporting === "pdf" ? "Generating PDF…" : "Download PDF"}
              </button>
            </div>
            {exportError && (
              <p className="mt-2 text-xs text-red-600">{exportError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
