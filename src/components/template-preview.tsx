interface PreviewField {
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  align?: string;
  maskColor?: string;
  defaultValue?: string;
}

export interface PreviewCanvasJson {
  backgroundImageUrl: string | null;
  backgroundFill: string | null;
  width: number;
  height: number;
  fields?: PreviewField[];
}

/**
 * A small, scalable preview of a template's layout for use in list/grid
 * cards — not a pixel-accurate render (that's what the editor's Fabric
 * canvas is for), just enough visual identity (background + rough field
 * placement) that a card is recognizable at a glance instead of relying
 * on the template's name alone. SVG rather than an absolutely-positioned
 * HTML overlay so it scales correctly at any card width with no JS.
 */
export default function TemplatePreview({
  id,
  canvasJson,
  alt,
}: {
  id: string;
  canvasJson: PreviewCanvasJson | null;
  alt: string;
}) {
  if (!canvasJson) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 text-xs text-zinc-400">
        No preview
      </div>
    );
  }

  const { width, height, backgroundImageUrl, backgroundFill, fields } =
    canvasJson;

  return (
    <div
      className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        role="img"
        aria-label={alt}
      >
        <rect width={width} height={height} fill={backgroundFill ?? "#f4f4f5"} />
        {backgroundImageUrl && (
          <image
            href={`/api/figma-image?url=${encodeURIComponent(backgroundImageUrl)}`}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        {fields?.map((field, i) => (
          <clipPath key={`clip-${i}`} id={`preview-field-clip-${id}-${i}`}>
            <rect
              x={field.x}
              y={field.y}
              width={field.width}
              height={field.height}
            />
          </clipPath>
        ))}
        {fields?.map((field, i) =>
          field.maskColor ? (
            <rect
              key={`mask-${i}`}
              x={field.x}
              y={field.y}
              width={field.width}
              height={field.height}
              fill={field.maskColor}
            />
          ) : null,
        )}
        {fields?.map((field, i) => (
          <text
            key={i}
            x={
              field.align === "center"
                ? field.x + field.width / 2
                : field.align === "right"
                  ? field.x + field.width
                  : field.x
            }
            y={field.y + (field.fontSize ?? 16) * 0.8}
            fontFamily={field.fontFamily}
            fontSize={field.fontSize ?? 16}
            fill={field.color ?? "#18181b"}
            textAnchor={
              field.align === "center"
                ? "middle"
                : field.align === "right"
                  ? "end"
                  : "start"
            }
            clipPath={`url(#preview-field-clip-${id}-${i})`}
          >
            {field.defaultValue}
          </text>
        ))}
      </svg>
    </div>
  );
}
