export const CURATED_GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Montserrat",
  "Poppins",
  "Oswald",
  "Bebas Neue",
  "Playfair Display",
  "Barlow Condensed",
  "Anton",
  "Archivo Black",
];

const loadedFonts = new Set<string>();

/**
 * Loads a Google Font stylesheet. Resolves true once the stylesheet has
 * actually loaded, false if the request fails — callers can then surface
 * that instead of silently rendering a fallback typeface. A failed
 * family is NOT cached, so a later call (new session, network back) can
 * retry instead of being permanently stuck.
 */
export function loadGoogleFont(family: string): Promise<boolean> {
  const trimmed = family.trim();
  if (!trimmed) return Promise.resolve(false);
  if (loadedFonts.has(trimmed)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      trimmed,
    ).replace(/%20/g, "+")}:wght@400;700&display=swap`;
    link.onload = () => {
      loadedFonts.add(trimmed);
      resolve(true);
    };
    link.onerror = () => {
      link.remove();
      resolve(false);
    };
    document.head.appendChild(link);
  });
}
