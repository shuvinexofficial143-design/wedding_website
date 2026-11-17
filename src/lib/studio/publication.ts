import { z } from "zod";
import type { CardDocument } from "./schema";

/** Public invitations are explicit, immutable snapshots, not the current admin template. */
export const studioPublicationSchema = z.object({
  kind: z.literal("studio-card"),
  version: z.number().int().positive(),
  values: z.record(z.string().uuid(), z.string().max(2000)),
}).strict();
export type StudioPublication = z.infer<typeof studioPublicationSchema>;

/** Only assets actually displayed on this published card may be opened via its secret URL. */
export function isPublishedStudioAsset(
  doc: CardDocument,
  values: Record<string, string>,
  assetId: string,
) {
  if (doc.backgroundAssetId === assetId) return true;
  return doc.layers.some(layer => {
    if (layer.hidden || layer.opacity <= 0) return false;
    if (layer.kind !== "image") return false;
    const override = layer.editable ? values[layer.id] : undefined;
    // A personalised photo replaces the default; it must not accidentally
    // grant access to both files when only one is visible to a guest.
    if (override) return override === `/api/assets/${assetId}`;
    return layer.assetId === assetId;
  });
}
