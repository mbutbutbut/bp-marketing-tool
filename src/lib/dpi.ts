/**
 * Converts a print DPI into the PDF points-per-pixel scale factor
 * (PDF units are always 72 points per inch, regardless of image DPI).
 * Falls back to 72 DPI for missing/invalid input so a bad request never
 * produces a zero- or negative-size PDF page.
 */
export function pointsPerPxForDpi(dpi: number | null | undefined): number {
  const effectiveDpi = dpi && dpi > 0 ? dpi : 72;
  return 72 / effectiveDpi;
}
