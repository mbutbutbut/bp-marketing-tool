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

export function loadGoogleFont(family: string) {
  const trimmed = family.trim();
  if (!trimmed || loadedFonts.has(trimmed)) return;
  loadedFonts.add(trimmed);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    trimmed,
  ).replace(/%20/g, "+")}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}
