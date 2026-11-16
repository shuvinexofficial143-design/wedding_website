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
];
export function findArtworkTemplate(theme: string): ArtworkTemplate | undefined {
  return cardTemplates.find((template) => template.theme === theme && template.published);
}
