const FIGMA_API_BASE = "https://api.figma.com/v1";

export class FigmaImportError extends Error {}

export function parseFigmaUrl(url: string): {
  fileKey: string;
  nodeId: string | null;
} {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new FigmaImportError("That doesn't look like a valid URL.");
  }

  if (!parsed.hostname.endsWith("figma.com")) {
    throw new FigmaImportError("That URL isn't a figma.com link.");
  }

  // Matches /file/<key>/... or /design/<key>/...
  const match = parsed.pathname.match(/\/(file|design)\/([^/]+)/);
  if (!match) {
    throw new FigmaImportError(
      "Couldn't find a file key in that URL. Copy the link from Figma's \"Copy link to selection\" option.",
    );
  }
  const fileKey = match[2];

  const rawNodeId = parsed.searchParams.get("node-id");
  const nodeId = rawNodeId ? rawNodeId.replace("-", ":") : null;

  return { fileKey, nodeId };
}

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface FigmaPaint {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  opacity?: number;
}

interface FigmaTextStyle {
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  textAlignHorizontal?: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  characters?: string;
  style?: FigmaTextStyle;
  fills?: FigmaPaint[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  children?: FigmaNode[];
}

interface FigmaFileNodesResponse {
  nodes: Record<string, { document: FigmaNode } | null>;
}

async function figmaFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${FIGMA_API_BASE}${path}`, {
    headers: { "X-Figma-Token": token },
  });

  if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
      throw new FigmaImportError(
        "Figma rejected the access token, or it doesn't have permission to see this file.",
      );
    }
    if (res.status === 404) {
      throw new FigmaImportError(
        "Figma couldn't find that file or frame. Double-check the link.",
      );
    }
    throw new FigmaImportError(`Figma API error (${res.status}).`);
  }

  return res.json() as Promise<T>;
}

export function figmaColorToCss(color: FigmaColor, opacity?: number): string {
  const a = (opacity ?? 1) * color.a;
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function solidFillColor(fills?: FigmaPaint[]): string | null {
  const fill = fills?.find((f) => f.type === "SOLID" && f.visible !== false);
  if (!fill?.color) return null;
  return figmaColorToCss(fill.color, fill.opacity);
}

export interface ExtractedTextField {
  figmaNodeId: string;
  name: string;
  characters: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: string;
}

export interface ExtractedFrame {
  nodeId: string;
  name: string;
  width: number;
  height: number;
  backgroundFill: string | null;
  textFields: ExtractedTextField[];
}

function collectTextNodes(
  node: FigmaNode,
  frameOrigin: { x: number; y: number },
  out: ExtractedTextField[],
) {
  if (node.type === "TEXT" && node.absoluteBoundingBox) {
    const box = node.absoluteBoundingBox;
    out.push({
      figmaNodeId: node.id,
      name: node.name,
      characters: node.characters ?? "",
      x: box.x - frameOrigin.x,
      y: box.y - frameOrigin.y,
      width: box.width,
      height: box.height,
      fontFamily: node.style?.fontFamily ?? "Inter",
      fontSize: node.style?.fontSize ?? 16,
      color: solidFillColor(node.fills) ?? "#000000",
      align: (node.style?.textAlignHorizontal ?? "LEFT").toLowerCase(),
    });
    return;
  }

  for (const child of node.children ?? []) {
    collectTextNodes(child, frameOrigin, out);
  }
}

export async function importFigmaFrame(
  fileKey: string,
  nodeId: string,
  token: string,
): Promise<ExtractedFrame> {
  const data = await figmaFetch<FigmaFileNodesResponse>(
    `/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`,
    token,
  );

  const entry = data.nodes[nodeId];
  if (!entry) {
    throw new FigmaImportError(
      "That frame wasn't found in the file. Make sure the link points at a specific frame.",
    );
  }

  const frame = entry.document;
  const box = frame.absoluteBoundingBox;
  if (!box) {
    throw new FigmaImportError(
      "That node doesn't have a bounding box — select a frame, not a whole page.",
    );
  }

  const textFields: ExtractedTextField[] = [];
  collectTextNodes(frame, { x: box.x, y: box.y }, textFields);

  return {
    nodeId: frame.id,
    name: frame.name,
    width: Math.round(box.width),
    height: Math.round(box.height),
    backgroundFill: solidFillColor(frame.fills),
    textFields,
  };
}

export async function getFigmaFrameImageUrl(
  fileKey: string,
  nodeId: string,
  token: string,
): Promise<string | null> {
  const data = await figmaFetch<{ images: Record<string, string | null> }>(
    `/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
    token,
  );
  return data.images[nodeId] ?? null;
}
