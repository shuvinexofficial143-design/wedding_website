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
  {
    id: "traditional-hindu-wedding",
    theme: "art-traditional-hindu-wedding",
    name: "Traditional Hindu Wedding",
    category: "cards",
    thumbnail: "/card-art/traditional-hindu-wedding.svg",
    artwork: "/card-art/traditional-hindu-wedding.svg",
    price: 499,
    published: true,
    tagline: "SHUBH VIVAH COLLECTION",
    description: "A Hindu wedding card with original marigold toran, golden kalash, lotus mandala and a festive vermilion border.",
    font: {names: "Georgia,serif", supporting: "'Noto Serif Devanagari',Georgia,serif"},
    textLayers: layers(),
    layout: "hindu",
    kicker: "॥ शुभ विवाह ॥",
    overline: "With blessings and warm wishes",
    footer: "मंगलमय शुभकामनाएँ",
  },
  {
    id: "rajasthani-royal-wedding",
    theme: "art-rajasthani-royal-wedding",
    name: "Rajasthani Royal Wedding",
    category: "cards",
    thumbnail: "/card-art/rajasthani-royal-wedding.svg",
    artwork: "/card-art/rajasthani-royal-wedding.svg",
    price: 549,
    published: true,
    tagline: "RAJASTHANI MINIATURE ART",
    description: "Miniature-painting-inspired sandstone fort, royal jharokhas, elephants, desert banners and ceremonial arches.",
    font: {names: "'Palatino Linotype',Georgia,serif", supporting: "Georgia,serif"},
    textLayers: layers(),
    layout: "rajasthani",
    kicker: "PADHARO MHARE DES",
    overline: "A royal celebration in Rajasthan",
    footer: "WITH LOVE FROM OUR FAMILIES",
  },
  {
    id: "pastel-watercolor-floral",
    theme: "art-pastel-watercolor-floral",
    name: "Pastel Watercolor Floral",
    category: "cards",
    thumbnail: "/card-art/pastel-watercolor-floral.svg",
    artwork: "/card-art/pastel-watercolor-floral.svg",
    price: 449,
    published: true,
    tagline: "BOTANICAL WATERCOLOR",
    description: "Airy lavender, peach and sage watercolor blossoms, fine foliage sketches and luminous handmade paper.",
    font: {names: "'Palatino Linotype',Georgia,serif", supporting: "Georgia,serif"},
    textLayers: layers(),
    layout: "pastel",
    kicker: "JOIN US IN CELEBRATION",
    overline: "Among the flowers",
    footer: "A GARDEN OF BEAUTIFUL BEGINNINGS",
  },
  {
    id: "elegant-muslim-nikah",
    theme: "art-elegant-muslim-nikah",
    name: "Elegant Muslim Nikah Invitation",
    category: "cards",
    thumbnail: "/card-art/elegant-muslim-nikah.svg",
    artwork: "/card-art/elegant-muslim-nikah.svg",
    price: 499,
    published: true,
    tagline: "NIKAH HERITAGE COLLECTION",
    description: "Graceful teal mehrab, Islamic star mosaic, golden hanging lanterns and delicate mosque silhouettes.",
    font: {names: "Georgia,serif", supporting: "Georgia,serif"},
    textLayers: layers(),
    layout: "nikah",
    kicker: "NIKAH INVITATION",
    overline: "Bismillah · With our families",
    footer: "WITH PRAYERS & BLESSINGS",
  },
  {
    id: "south-indian-traditional",
    theme: "art-south-indian-traditional",
    name: "South Indian Traditional Wedding",
    category: "cards",
    thumbnail: "/card-art/south-indian-traditional.svg",
    artwork: "/card-art/south-indian-traditional.svg",
    price: 499,
    published: true,
    tagline: "SOUTH INDIAN HERITAGE",
    description: "A detailed temple gopuram, banana leaves, brass vilakku lamps, kolam and auspicious ivory-gold ceremony artwork.",
    font: {names: "Georgia,serif", supporting: "Georgia,serif"},
    textLayers: layers(),
    layout: "south-indian",
    kicker: "SUBHA MUHURTHAM",
    overline: "Blessings for a joyful union",
    footer: "WITH THE BLESSINGS OF OUR ELDERS",
  },
  {
    id: "luxury-dark-emerald",
    theme: "art-luxury-dark-emerald",
    name: "Luxury Dark Emerald Wedding",
    category: "cards",
    thumbnail: "/card-art/luxury-dark-emerald.svg",
    artwork: "/card-art/luxury-dark-emerald.svg",
    price: 549,
    published: true,
    tagline: "EMERALD ART DECO",
    description: "Deep emerald satin texture with original gold foil art-deco sunburst, ornate fan motifs and geometric arches.",
    font: {names: "Georgia,serif", supporting: "Georgia,serif"},
    textLayers: layers(),
    layout: "emerald",
    kicker: "AN EVENING TO REMEMBER",
    overline: "Together, forever",
    footer: "THE BEGINNING OF FOREVER",
  },
]; 
export function findArtworkTemplate(theme: string): ArtworkTemplate | undefined {
  return cardTemplates.find((template) => template.theme === theme && template.published);
}
