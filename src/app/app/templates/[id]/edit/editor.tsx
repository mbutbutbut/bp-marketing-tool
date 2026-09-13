"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as fabric from "fabric";
import { CURATED_GOOGLE_FONTS, loadGoogleFont } from "@/lib/google-fonts";
import { useContainerScale } from "@/lib/use-container-scale";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";

interface CanvasField {
  fieldKey: string;
  figmaNodeId?: string;
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

interface FieldPair {
  text: fabric.Textbox;
  mask: fabric.Rect;
}

interface InspectorState {
  fieldKey: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  maskColor: string;
  textAlign: string;
}

const MAX_CANVAS_WIDTH = 640;

function syncMaskToText(text: fabric.Textbox, mask: fabric.Rect) {
  mask.set({
    left: text.left,
    top: text.top,
    width: text.getScaledWidth(),
    height: text.getScaledHeight(),
  });
}

export default function TemplateEditor({
  templateId,
  templateName,
  variantId,
  variantLabel,
  dpi,
  canvasJson,
  editableFieldKeys,
}: {
  templateId: string;
  templateName: string;
  variantId: string;
  variantLabel: string;
  dpi: number;
  canvasJson: unknown;
  editableFieldKeys: string[];
}) {
  const router = useRouter();
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const pairsRef = useRef<Map<string, FieldPair>>(new Map());

  const [inspector, setInspector] = useState<InspectorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [backgroundLoadFailed, setBackgroundLoadFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  function showExportMessage(message: string) {
    setExportMessage(message);
    setTimeout(() => setExportMessage(null), 3000);
  }

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const data = canvasJson as CanvasJson;
  const editableSet = new Set(editableFieldKeys);
  const { containerRef, scale } = useContainerScale(
    data.width,
    MAX_CANVAS_WIDTH,
  );

  function inspectorFromPair(fieldKey: string, pair: FieldPair): InspectorState {
    return {
      fieldKey,
      text: pair.text.text,
      fontFamily: pair.text.fontFamily,
      fontSize: pair.text.fontSize,
      color: pair.text.fill as string,
      maskColor: pair.mask.fill as string,
      textAlign: pair.text.textAlign,
    };
  }

  useEffect(() => {
    if (!canvasElRef.current) return;
    const pairs = pairsRef.current;
    setInspector(null);
    setBackgroundLoadFailed(false);
    setDirty(false);

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: data.width * scale,
      height: data.height * scale,
      backgroundColor: data.backgroundFill ?? "#f4f4f5",
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
          // Don't let a failed background image load block the text
          // fields from rendering — fall back to the flat backgroundColor.
          console.error("Failed to load template background image", err);
          if (!disposed) setBackgroundLoadFailed(true);
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
          // Font may not be a loadable web font; fall back silently.
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

        const text = new fabric.Textbox(field.defaultValue, {
          left: field.x * scale,
          top: field.y * scale,
          originX: "left",
          originY: "top",
          width: field.width * scale,
          fontFamily: field.fontFamily,
          fontSize: field.fontSize * scale,
          fill: field.color,
          textAlign: field.align as fabric.Textbox["textAlign"],
        });
        (text as fabric.Textbox & { fieldKey: string }).fieldKey =
          field.fieldKey;

        text.on("moving", () => syncMaskToText(text, mask));
        text.on("scaling", () => syncMaskToText(text, mask));
        text.on("changed", () => syncMaskToText(text, mask));
        text.on("modified", () => {
          syncMaskToText(text, mask);
          canvas.requestRenderAll();
          setDirty(true);
        });

        pairs.set(field.fieldKey, { text, mask });
        canvas.add(mask);
        canvas.add(text);
        syncMaskToText(text, mask);
      }

      canvas.requestRenderAll();
    }

    setup();

    function handleSelection(e: { selected?: fabric.Object[] }) {
      const obj = e.selected?.[0] as
        | (fabric.Object & { fieldKey?: string })
        | undefined;
      if (obj?.fieldKey) {
        const pair = pairs.get(obj.fieldKey);
        if (pair) {
          setInspector(inspectorFromPair(obj.fieldKey, pair));
          return;
        }
      }
      setInspector(null);
    }

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", () => setInspector(null));

    return () => {
      disposed = true;
      canvas.dispose();
      pairs.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, resetKey]);

  function mutateSelectedText(mutator: (text: fabric.Textbox) => void) {
    if (!inspector) return;
    const pair = pairsRef.current.get(inspector.fieldKey);
    if (!pair) return;
    mutator(pair.text);
    syncMaskToText(pair.text, pair.mask);
    fabricCanvasRef.current?.requestRenderAll();
    setInspector(inspectorFromPair(inspector.fieldKey, pair));
    setDirty(true);
  }

  function mutateSelectedMask(color: string) {
    if (!inspector) return;
    const pair = pairsRef.current.get(inspector.fieldKey);
    if (!pair) return;
    pair.mask.set({ fill: color });
    fabricCanvasRef.current?.requestRenderAll();
    setInspector(inspectorFromPair(inspector.fieldKey, pair));
    setDirty(true);
  }

  function revertToLastSaved() {
    if (dirty && !window.confirm("Discard unsaved changes and revert to the last saved version?")) {
      return;
    }
    setResetKey((k) => k + 1);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const fields = data.fields.map((field) => {
      const pair = pairsRef.current.get(field.fieldKey);
      if (!pair || !editableSet.has(field.fieldKey)) return field;

      const { text, mask } = pair;

      return {
        ...field,
        x: (text.left ?? 0) / scale,
        y: (text.top ?? 0) / scale,
        width: text.getScaledWidth() / scale,
        height: text.getScaledHeight() / scale,
        fontFamily: text.fontFamily ?? field.fontFamily,
        fontSize: (text.fontSize ?? field.fontSize) / scale,
        color: (text.fill as string) ?? field.color,
        align: text.textAlign ?? field.align,
        maskColor: (mask.fill as string) ?? field.maskColor,
        defaultValue: text.text ?? field.defaultValue,
      };
    });

    const res = await fetch(`/api/templates/variants/${variantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setDirty(false);
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
    return `${templateName}-${variantLabel}`.replace(/[^a-z0-9]+/gi, "-");
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
      triggerDownload(dataUrl, `${safeName()}.${format === "jpeg" ? "jpg" : "png"}`);
      setExportError(null);
      showExportMessage(`${format === "jpeg" ? "JPG" : "PNG"} downloaded`);
      fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          variantId,
          format: format === "jpeg" ? "JPG" : "PNG",
        }),
      }).catch(() => {});
    } catch (err) {
      console.error(err);
      setExportError(
        "Couldn't export an image — the background may have failed to load safely for export.",
      );
    }
  }

  async function exportPdf() {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    setExporting(true);
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
          dpi,
          templateId,
          variantId,
        }),
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${safeName()}.pdf`);
      URL.revokeObjectURL(url);
      showExportMessage("PDF downloaded");
    } catch (err) {
      console.error(err);
      setExportError("Couldn't generate a PDF for this design.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-zinc-900">
            Editing: {templateName}{" "}
            <span className="font-normal text-zinc-500">
              — {variantLabel}
            </span>
          </h1>
          <p className="text-sm text-zinc-500">
            Drag fields to reposition, resize by their corner handles. Click
            a field to edit its text and style on the right.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved</span>}
          {exportMessage && (
            <span className="text-sm text-green-600">{exportMessage}</span>
          )}
          <div className="flex items-center overflow-hidden rounded-md border border-zinc-300">
            <button
              onClick={() => exportImage("png")}
              className="px-3 py-2 text-sm hover:bg-zinc-50"
            >
              PNG
            </button>
            <span className="h-full w-px bg-zinc-300" />
            <button
              onClick={() => exportImage("jpeg")}
              className="px-3 py-2 text-sm hover:bg-zinc-50"
            >
              JPG
            </button>
            <span className="h-full w-px bg-zinc-300" />
            <button
              onClick={exportPdf}
              disabled={exporting}
              className="px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              {exporting ? "PDF…" : "PDF"}
            </button>
          </div>
          {dirty && (
            <Button variant="secondary" onClick={revertToLastSaved}>
              Revert
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              if (
                dirty &&
                !window.confirm(
                  "You have unsaved changes. Leave without saving?",
                )
              ) {
                return;
              }
              router.push(`/app/templates/${templateId}`);
            }}
          >
            Back
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {exportError && (
        <p className="mb-4 -mt-2 text-sm text-red-600">{exportError}</p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_min(280px,32%)]">
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
            <canvas ref={canvasElRef} />
          </div>
        </div>

        <Card>
          {!inspector ? (
            <p className="text-sm text-zinc-500">
              Select a field on the canvas to edit it.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Text
                </label>
                <textarea
                  value={inspector.text}
                  onChange={(e) =>
                    mutateSelectedText((t) =>
                      t.set({ text: e.target.value }),
                    )
                  }
                  rows={2}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Font
                </label>
                <select
                  value={inspector.fontFamily}
                  onChange={(e) => {
                    loadGoogleFont(e.target.value);
                    mutateSelectedText((t) =>
                      t.set({ fontFamily: e.target.value }),
                    );
                  }}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
                >
                  {!CURATED_GOOGLE_FONTS.includes(inspector.fontFamily) && (
                    <option value={inspector.fontFamily}>
                      {inspector.fontFamily} (from Figma)
                    </option>
                  )}
                  {CURATED_GOOGLE_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Font size
                </label>
                <input
                  type="number"
                  value={Math.round(inspector.fontSize / scale)}
                  onChange={(e) =>
                    mutateSelectedText((t) =>
                      t.set({ fontSize: Number(e.target.value) * scale }),
                    )
                  }
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700">
                    Text color
                  </label>
                  <input
                    type="color"
                    value={inspector.color}
                    onChange={(e) =>
                      mutateSelectedText((t) =>
                        t.set({ fill: e.target.value }),
                      )
                    }
                    className="h-8 w-full rounded-md border border-zinc-300"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-700">
                    Mask color
                  </label>
                  <input
                    type="color"
                    value={inspector.maskColor}
                    onChange={(e) => mutateSelectedMask(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-300"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Covers the original Figma text behind this field.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Alignment
                </label>
                <div className="flex gap-2">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() =>
                        mutateSelectedText((t) => t.set({ textAlign: align }))
                      }
                      className={`flex-1 rounded-md border px-2 py-1 text-xs capitalize ${
                        inspector.textAlign === align
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
