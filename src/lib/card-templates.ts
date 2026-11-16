/** Code-reviewed card template registry. Published is an explicit boolean; no customer-supplied paths. */
export type ArtworkTemplate = {
  id: string;
  theme: string;
  name: string;
  category: "cards";
  thumbnail: string;
  artwork: string;
  price: number;
  published: boolean;
  tagline: string;
  description: string;
  font: { names: string; supporting: string };
  textLayers: {
    bride: { align: "center" | "left"; maxLength: 70 };
    groom: { align: "center" | "left"; maxLength: 70 };
    date: { align: "center" | "left" };
    time: { align: "center" | "left" };
    venue: { align: "center" | "left"; maxLength: 200 };
    message: { align: "center" | "left"; maxLength: 140 };
    photo: { enabled: boolean };
  };
  layout: string;
  kicker?: string;
  overline?: string;
  footer?: string;
};
const layers = (align: "center" | "left" = "center"): ArtworkTemplate["textLayers"] => ({
  bride: { align, maxLength: 70 },
  groom: { align, maxLength: 70 },
  date: { align },
  time: { align },
  venue: { align, maxLength: 200 },
  message: { align, maxLength: 140 },
  photo: { enabled: true },
});
export const cardTemplates: readonly ArtworkTemplate[] = [
  {
    id: "royal-golden-palace",
    theme: "art-royal-golden-palace",
    name: "Royal Golden Palace",
    category: "cards",
    thumbnail: "/card-art/royal-golden-palace.svg",
    artwork: "/card-art/royal-golden-palace.svg",
    price: 499,
    published: true,
    tagline: "THE PALACE ART EDITION",
    description: "Original palace painting with sculpted golden arches, gilded columns, temple roofs and warm ivory parchment. All wording stays editable.",
    font: { names: "Georgia, 'Times New Roman', serif", supporting: "Georgia, 'Times New Roman', serif" },
    textLayers: layers(),
    layout: "palace",
  },
  {
    id: "pink-rose-floral",
    theme: "art-pink-rose-floral",
    name: "Pink Rose Floral",
    category: "cards",
    thumbnail: "/card-art/pink-rose-floral.svg",
    artwork: "/card-art/pink-rose-floral.svg",
    price: 449,
    published: true,
    tagline: "THE BOTANICAL ART EDITION",
    description: "An original blush watercolor floral artwork of layered roses, leaf sprays and elegant ivory stationery, with editable typesetting.",
    font: { names: "'Palatino Linotype', 'Book Antiqua', Georgia, serif", supporting: "'Palatino Linotype', Georgia, serif" },
    textLayers: layers(),
    layout: "rose",
  },
  {
    id: "luxury-maroon-heritage",
    theme: "art-luxury-maroon-heritage",
    name: "Luxury Maroon Heritage",
    category: "cards",
    thumbnail: "/card-art/luxury-maroon-heritage.svg",
    artwork: "/card-art/luxury-maroon-heritage.svg",
    price: 549,
    published: true,
    tagline: "ZARDOZI HERITAGE",
    description: "Burgundy silk-inspired zardozi paisley embroidery, jharokha arch, gilded stonework and rich royal detailing.",
    font: {names: "Georgia, 'Times New Roman', serif", supporting: "Georgia,serif"},
    textLayers: layers(),
    layout: "maroon-heritage",
    kicker: "A HERITAGE WEDDING",
    overline: "An evening written in gold",
    footer: "THE CELEBRATION OF A LIFETIME",
  },
  {
    id: "white-gold-minimal",
    theme: "art-white-gold-minimal",
    name: "White & Gold Minimal",
    category: "cards",
    thumbnail: "/card-art/white-gold-minimal.svg",
    artwork: "/card-art/white-gold-minimal.svg",
    price: 399,
    published: true,
    tagline: "MODERN GOLD ATELIER",
    description: "Modern editorial ivory invitation with restrained golden Art Deco lines, circular emblem and minimalist botanical gold engraving.",
    font: {names: "'Palatino Linotype',Georgia,serif", supporting: "Georgia,serif"},
    textLayers: layers("left"),
    layout: "white-gold",
    kicker: "THE WEDDING OF",
    overline: "An elegant beginning",
    footer: "LOVE IN ITS PUREST FORM",
  },
];
export function findArtworkTemplate(theme: string): ArtworkTemplate | undefined {
  return cardTemplates.find((template) => template.theme === theme && template.published);
}
