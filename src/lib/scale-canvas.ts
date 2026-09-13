export interface ScalableField {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export interface ScaledCanvasSize {
  scaleX: number;
  scaleY: number;
  fontScale: number;
}

/**
 * Computes the proportional scale factors for adapting a template's
 * canvas from one output size to another. Font size is scaled by the
 * geometric mean of the two axis scales so text doesn't stretch when
 * an aspect ratio changes (e.g. Letter -> IG Story).
 */
export function computeCanvasScale(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): ScaledCanvasSize {
  const scaleX = targetWidth / sourceWidth;
  const scaleY = targetHeight / sourceHeight;
  return { scaleX, scaleY, fontScale: Math.sqrt(scaleX * scaleY) };
}

export function scaleField<T extends ScalableField>(
  field: T,
  { scaleX, scaleY, fontScale }: ScaledCanvasSize,
): T {
  return {
    ...field,
    x: field.x * scaleX,
    y: field.y * scaleY,
    width: field.width * scaleX,
    height: field.height * scaleY,
    fontSize: field.fontSize * fontScale,
  };
}
