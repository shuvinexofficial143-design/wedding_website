import type { Layer, CardDocument } from "./schema";
export const graphemes = (text: string) =>
  Array.from(
    new Intl.Segmenter("hi", { granularity: "grapheme" }).segment(text),
    (s) => s.segment,
  );
export type TextLayout = {
  lines: string[];
  fontSize: number;
  overflow: boolean;
  fontFamily: string;
};
export function textFamily(layer: Layer, text: string) {
  return /[\u0900-\u097f]/.test(text)
    ? "Noto Serif Devanagari Variable"
    : layer.fontFamily;
}
export function wrapText(
  text: string,
  width: number,
  measure: (s: string) => number,
) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= width) {
        line = candidate;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      if (measure(word) <= width) {
        line = word;
        continue;
      }
      for (const glyph of graphemes(word)) {
        if (line && measure(line + glyph) > width) {
          lines.push(line);
          line = "";
        }
        line += glyph;
      }
    }
    lines.push(line);
  }
  return lines;
}
export function fitText(
  layer: Layer,
  text: string,
  measureAt: (text: string, size: number, font: string) => number,
): TextLayout {
  const fontFamily = textFamily(layer, text);
  const measure = (size: number) => (s: string) =>
    measureAt(s, size, fontFamily) +
    Math.max(0, graphemes(s).length - 1) * layer.letterSpacing;
  let low = 8,
    high = layer.fontSize,
    best: TextLayout = {
      lines: wrapText(text, layer.width, measure(8)),
      fontSize: 8,
      overflow: true,
      fontFamily,
    };
  for (let i = 0; i < 12; i++) {
    const size = (low + high) / 2;
    const lines = wrapText(text, layer.width, measure(size));
    const fits =
      lines.length * size * layer.lineHeight <= layer.height &&
      lines.every((s) => measure(size)(s) <= layer.width + 0.1);
    if (fits) {
      best = { lines, fontSize: size, overflow: false, fontFamily };
      low = size;
    } else high = size;
  }
  return best;
}
export function rotatedBounds(layer: Layer) {
  const r = (layer.rotation * Math.PI) / 180,
    w =
      Math.abs(layer.width * Math.cos(r)) +
      Math.abs(layer.height * Math.sin(r)),
    h =
      Math.abs(layer.width * Math.sin(r)) +
      Math.abs(layer.height * Math.cos(r));
  return {
    x: layer.x + (layer.width - w) / 2,
    y: layer.y + (layer.height - h) / 2,
    width: w,
    height: h,
  };
}
export function collisionPairs(layers: Layer[]) {
  const visible = layers.filter(
    (l) =>
      !l.hidden &&
      l.opacity > 0 &&
      (l.kind === "text" || (l.kind === "image" && l.editable)),
  );
  const pairs: string[][] = [];
  for (let i = 0; i < visible.length; i++)
    for (let j = i + 1; j < visible.length; j++) {
      const a = rotatedBounds(visible[i]),
        b = rotatedBounds(visible[j]);
      if (
        a.x < b.x + b.width - 0.5 &&
        a.x + a.width > b.x + 0.5 &&
        a.y < b.y + b.height - 0.5 &&
        a.y + a.height > b.y + 0.5
      )
        pairs.push([visible[i].label, visible[j].label]);
    }
  return pairs;
}
export function clampLayer(layer: Layer, doc: CardDocument) {
  const inset = layer.kind === "text" ? doc.safeInset : 0;
  const next = {
    ...layer,
    width: Math.max(20, Math.min(layer.width, doc.width - 2 * inset)),
    height: Math.max(20, Math.min(layer.height, doc.height - 2 * inset)),
  };
  let b = rotatedBounds(next);
  if (b.width > doc.width - 2 * inset || b.height > doc.height - 2 * inset) {
    next.rotation = 0;
    b = rotatedBounds(next);
  }
  next.x += Math.max(
    inset - b.x,
    Math.min(0, doc.width - inset - b.x - b.width),
  );
  next.y += Math.max(
    inset - b.y,
    Math.min(0, doc.height - inset - b.y - b.height),
  );
  return next;
}
export const sampleFields: Record<string, string> = {
  partnerA: "Ananya",
  partnerB: "Aarav",
  date: "21 February 2027",
  time: "6:00 PM",
  venue: "The Rose Palace, Jaipur",
  address: "Rajasthan, India",
  cardMessage:
    "Together with our families, we invite you to celebrate our wedding.",
  photo: "",
  custom: "",
};
export function layerText(
  layer: Layer,
  values: Record<string, string> = {},
  fields: Record<string, string> = {},
) {
  // Customer overrides win. The admin's per-layer default is shown in the
  // designer and public sample; generic sample names are the final fallback.
  return values[layer.id] ??
    (fields[layer.field] ?? (layer.value || sampleFields[layer.field] || ""));
}
