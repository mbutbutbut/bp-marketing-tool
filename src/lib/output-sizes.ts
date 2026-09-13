export interface OutputPreset {
  label: string;
  widthPx: number;
  heightPx: number;
  dpi: number;
}

export const OUTPUT_PRESETS: Record<string, OutputPreset> = {
  IG_POST: {
    label: "Instagram Post (1:1)",
    widthPx: 1080,
    heightPx: 1080,
    dpi: 72,
  },
  IG_STORY: {
    label: "Instagram Story (9:16)",
    widthPx: 1080,
    heightPx: 1920,
    dpi: 72,
  },
  IG_REEL_COVER: {
    label: "Instagram Reel Cover (9:16)",
    widthPx: 1080,
    heightPx: 1920,
    dpi: 72,
  },
  FACEBOOK_POST: {
    label: "Facebook Post (1.91:1)",
    widthPx: 1200,
    heightPx: 630,
    dpi: 72,
  },
  LETTER: {
    label: 'Letter (8.5×11")',
    widthPx: 2550,
    heightPx: 3300,
    dpi: 300,
  },
  ELEVEN_BY_SEVENTEEN: {
    label: '11×17"',
    widthPx: 3300,
    heightPx: 5100,
    dpi: 300,
  },
  TWELVE_BY_EIGHTEEN: {
    label: '12×18"',
    widthPx: 3600,
    heightPx: 5400,
    dpi: 300,
  },
};

export const OUTPUT_TYPE_ORDER = [
  "IG_POST",
  "IG_STORY",
  "IG_REEL_COVER",
  "FACEBOOK_POST",
  "LETTER",
  "ELEVEN_BY_SEVENTEEN",
  "TWELVE_BY_EIGHTEEN",
  "CUSTOM",
] as const;
