import { z } from "zod";
import { websiteTemplateSchema } from "../website/schema";
import { timelineSchema } from "../animation/timeline";
export const fontFamilies = [
  "Georgia",
  "Noto Sans Variable",
  "Noto Serif Devanagari Variable",
] as const;
export const layerFields = [
  "partnerA",
  "partnerB",
  "date",
  "time",
  "venue",
  "address",
  "cardMessage",
  "photo",
  "custom",
] as const;
const color = z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);
export const layerSchema = z
  .object({
    id: z.string().uuid(),
    kind: z.enum(["text", "image", "shape"]),
    label: z.string().trim().min(1).max(80),
    field: z.enum(layerFields).default("custom"),
    editable: z.boolean().default(false),
    value: z.string().max(2000).default(""),
    assetId: z.string().uuid().nullable().default(null),
    x: z.number().finite().min(0),
    y: z.number().finite().min(0),
    width: z.number().finite().min(20),
    height: z.number().finite().min(20),
    rotation: z.number().finite().min(-180).max(180).default(0),
    opacity: z.number().min(0).max(1).default(1),
    zIndex: z.number().int().min(0).max(999).default(0),
    locked: z.boolean().default(false),
    hidden: z.boolean().default(false),
    fontFamily: z.enum(fontFamilies).default("Noto Sans Variable"),
    fontSize: z.number().min(8).max(240).default(40),
    fontWeight: z.number().int().min(100).max(900).default(400),
    color: color.default("#382c2b"),
    align: z.enum(["left", "center", "right"]).default("center"),
    lineHeight: z.number().min(0.8).max(2).default(1.2),
    letterSpacing: z.number().min(-1).max(10).default(0),
    maxLength: z.number().int().min(1).max(1000).default(140),
    shape: z.enum(["rectangle", "ellipse"]).default("rectangle"),
    fill: color.default("#f4eee5"),
    borderColor: color.default("#d6bd8a"),
    borderWidth: z.number().min(0).max(20).default(0),
  })
  .strict();
export type Layer = z.infer<typeof layerSchema>;
export const documentSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(2000),
    category: z
      .enum(["cards", "animated", "websites", "videos"])
      .default("cards"),
    pricePaise: z.number().int().min(0).max(10000000),
    tags: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
    width: z.number().int().min(300).max(2400),
    height: z.number().int().min(300).max(3200),
    safeInset: z.number().min(0).max(200).default(40),
    backgroundColor: color.default("#faf7f2"),
    backgroundAssetId: z.string().uuid().nullable().default(null),
    thumbnailAssetId: z.string().uuid().nullable().default(null),
    layers: z.array(layerSchema).max(80),
    animation: timelineSchema.optional(),
    website: websiteTemplateSchema.optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.safeInset * 2 >= Math.min(d.width, d.height))
      ctx.addIssue({ code: "custom", message: "Safe area is too large" });
    if (d.website && (d.category !== "websites" || d.animation))
      ctx.addIssue({
        code: "custom",
        message:
          "Website configuration requires a website product without animation",
      });
    if (d.animation) {
      if (d.category !== "animated")
        ctx.addIssue({
          code: "custom",
          message: "Timeline requires animated category",
        });
      for (const track of d.animation.tracks)
        if (!d.layers.some((l) => l.id === track.layerId))
          ctx.addIssue({
            code: "custom",
            message: "Timeline targets a missing layer",
          });
    }
    const ids = new Set<string>();
    for (const l of d.layers) {
      if (ids.has(l.id))
        ctx.addIssue({ code: "custom", message: "Duplicate layer ID" });
      ids.add(l.id);
      const radians = (l.rotation * Math.PI) / 180;
      const w =
          Math.abs(l.width * Math.cos(radians)) +
          Math.abs(l.height * Math.sin(radians)),
        h =
          Math.abs(l.width * Math.sin(radians)) +
          Math.abs(l.height * Math.cos(radians));
      const cx = l.x + l.width / 2,
        cy = l.y + l.height / 2;
      const inset = l.kind === "text" ? d.safeInset : 0;
      if (
        cx - w / 2 < inset - 0.1 ||
        cy - h / 2 < inset - 0.1 ||
        cx + w / 2 > d.width - inset + 0.1 ||
        cy + h / 2 > d.height - inset + 0.1
      )
        ctx.addIssue({
          code: "custom",
          message: `Layer ${l.label} exceeds the card safe area`,
        });
      if (l.editable && l.kind === "shape")
        ctx.addIssue({
          code: "custom",
          message: "Decorative shapes cannot be customer editable",
        });
    }
  });
export type CardDocument = z.infer<typeof documentSchema>;
export type TemplateDocument = CardDocument & {
  renderer?: "layers" | "legacy";
  legacyTheme?: string;
  legacyProduct?: {
    id: string;
    name: string;
    category: string;
    price: number;
    theme: string;
    tag: string;
    description: string;
  };
  legacyArtwork?: unknown;
};
export const newDocument = (): CardDocument => ({
  name: "Untitled invitation",
  description: "",
  category: "cards",
  pricePaise: 49900,
  tags: [],
  width: 1000,
  height: 1400,
  safeInset: 50,
  backgroundColor: "#faf7f2",
  backgroundAssetId: null,
  thumbnailAssetId: null,
  layers: [],
});
export function documentAssetIds(doc: CardDocument) {
  return [
    ...new Set(
      [
        doc.backgroundAssetId,
        doc.thumbnailAssetId,
        ...doc.layers.map((l) => l.assetId),
      ].filter((id): id is string => !!id),
    ),
  ];
}
export function editableValues(
  doc: CardDocument,
  values: Record<string, unknown>,
) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    const layer = doc.layers.find((l) => l.id === key);
    if (!layer?.editable || layer.hidden || layer.kind === "shape")
      throw new Error("This layer cannot be edited");
    if (typeof value !== "string" || Array.from(value).length > layer.maxLength)
      throw new Error("Layer value exceeds maximum length");
    if (
      layer.kind === "image" &&
      value &&
      !/^\/api\/assets\/[a-f0-9-]{36}$/.test(value)
    )
      throw new Error("Use a private uploaded photo");
    out[key] = value;
  }
  return out;
}
