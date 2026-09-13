import * as fabric from "fabric";
import { loadGoogleFont } from "@/lib/google-fonts";

export interface CanvasField {
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

export interface CanvasJson {
  backgroundImageUrl: string | null;
  backgroundFill: string | null;
  width: number;
  height: number;
  fields: CanvasField[];
}

/**
 * Loads and places the template's background image on the canvas, scaled
 * to fill it exactly. Never throws: returns false (instead of surfacing
 * an error) so the caller can fall back to backgroundFill and show a
 * banner. `isDisposed` is checked after the async image load so a
 * component that unmounted mid-fetch never mutates a torn-down canvas.
 */
export async function loadBackgroundImage(
  canvas: fabric.Canvas,
  data: Pick<CanvasJson, "backgroundImageUrl" | "width" | "height">,
  scale: number,
  isDisposed: () => boolean,
): Promise<boolean> {
  if (!data.backgroundImageUrl) return true;
  try {
    const proxiedUrl = `/api/figma-image?url=${encodeURIComponent(
      data.backgroundImageUrl,
    )}`;
    const img = await fabric.FabricImage.fromURL(proxiedUrl);
    if (isDisposed()) return true;
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
    return true;
  } catch (err) {
    console.error("Failed to load template background image", err);
    return false;
  }
}

/** Loads a field's font as a web font. Never throws — falls back silently. */
export async function loadFieldFont(
  field: Pick<CanvasField, "fontFamily" | "fontSize">,
) {
  loadGoogleFont(field.fontFamily);
  try {
    await document.fonts.load(`${field.fontSize}px "${field.fontFamily}"`);
  } catch {
    // Font may not be a loadable web font; fall back silently.
  }
}

export function createFieldMask(field: CanvasField, scale: number) {
  return new fabric.Rect({
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
}

export function createFieldText(
  field: CanvasField,
  scale: number,
  value: string,
  options?: { selectable?: boolean; evented?: boolean; clip?: boolean },
) {
  const text = new fabric.Textbox(value, {
    left: field.x * scale,
    top: field.y * scale,
    originX: "left",
    originY: "top",
    width: field.width * scale,
    fontFamily: field.fontFamily,
    fontSize: field.fontSize * scale,
    fill: field.color,
    textAlign: field.align as fabric.Textbox["textAlign"],
    selectable: options?.selectable ?? true,
    evented: options?.evented ?? true,
  });

  if (options?.clip) {
    // Clip to the field's declared box so a longer-than-expected value
    // can't visually bleed into whatever's positioned below it.
    text.clipPath = new fabric.Rect({
      left: field.x * scale,
      top: field.y * scale,
      width: field.width * scale,
      height: field.height * scale,
      originX: "left",
      originY: "top",
      absolutePositioned: true,
    });
  }

  return text;
}
