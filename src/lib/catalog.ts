export type Category = "cards" | "animated" | "websites" | "videos";
export const categories = [
  {
    id: "cards",
    name: "Digital cards",
    description: "A keepsake, beautifully reimagined.",
    icon: "✧",
  },
  {
    id: "animated",
    name: "Animated invitations",
    description: "Let your love story come alive.",
    icon: "❋",
  },
  {
    id: "websites",
    name: "Wedding websites",
    description: "Your entire celebration. One lovely link.",
    icon: "⌘",
  },
  {
    id: "videos",
    name: "Video invitations",
    description: "A little film. A lifetime of memories.",
    icon: "▷",
  },
] as const;
export const products = [
  {
    id: "royal-gold-wedding",
    name: "Royal Gold Wedding Card",
    category: "cards" as Category,
    price: 499,
    theme: "royal-gold",
    tag: "NEW · PREMIUM ROYAL COLLECTION",
    description:
      "Midnight-blue royal palace arch, engraved golden crown and refined gold typography. Edit your names, wedding date, time, venue and photo.",
  },
  {
    id: "floral-pink-wedding",
    name: "Floral Pink Wedding Card",
    category: "cards" as Category,
    price: 449,
    theme: "floral-pink",
    tag: "NEW · PREMIUM FLORAL COLLECTION",
    description:
      "Soft blush stationery with hand-drawn rose bouquets, botanical leaves and romantic editorial lettering. Personalise every important detail.",
  },
  {
    id: "traditional-indian-wedding",
    name: "Traditional Indian Wedding Card",
    category: "cards" as Category,
    price: 499,
    theme: "traditional-indian",
    tag: "NEW · PREMIUM HERITAGE COLLECTION",
    description:
      "A vibrant Indian shubh vivah design with kumkum-red borders, marigold toran, sacred mandala and auspicious motifs.",
  },
  {
    id: "gulmohar",
    name: "Gulmohar",
    category: "cards" as Category,
    price: 299,
    theme: "rose",
    tag: "THE FLORAL COLLECTION",
    description:
      "Soft rose tones, delicate botanical details and an elegant arch for a timeless invitation.",
  },
  {
    id: "royal-noor",
    name: "Royal Noor",
    category: "cards" as Category,
    price: 399,
    theme: "royal",
    tag: "THE HERITAGE COLLECTION",
    description:
      "Deep burgundy and antique gold inspired by the warmth of an Indian celebration.",
  },
  {
    id: "olive-vows",
    name: "Olive Vows",
    category: "cards" as Category,
    price: 299,
    theme: "sage",
    tag: "THE MODERN COLLECTION",
    description:
      "Quiet greens and refined typography, designed for a naturally beautiful beginning.",
  },
  {
    id: "moonlit",
    name: "Moonlit Romance",
    category: "animated" as Category,
    price: 599,
    theme: "royal",
    tag: "AN INVITATION IN MOTION",
    description:
      "Gentle floating ornamentation and soft reveals, presented as a shareable invitation page.",
  },
  {
    id: "petal-dance",
    name: "Petal Dance",
    category: "animated" as Category,
    price: 599,
    theme: "rose",
    tag: "A SOFTLY ANIMATED CELEBRATION",
    description:
      "Blush botanical ornaments and a gentle entrance set the tone for your celebration.",
  },
  {
    id: "olive-motion",
    name: "Olive in Motion",
    category: "animated" as Category,
    price: 599,
    theme: "sage",
    tag: "NATURALLY IN MOTION",
    description:
      "Airy olive tones with delicate floating botanical details and a shareable guest page.",
  },
  {
    id: "palace-story",
    name: "Our Palace Story",
    category: "websites" as Category,
    price: 2499,
    theme: "royal",
    tag: "THE HERITAGE WEBSITE",
    description:
      "A rich burgundy wedding website prepared by our team, with your gallery, story, countdown, maps and guest replies.",
  },
  {
    id: "garden-story",
    name: "Our Garden Story",
    category: "websites" as Category,
    price: 1999,
    theme: "sage",
    tag: "YOUR OWN WEDDING WEBSITE",
    description:
      "A custom wedding website with your story, gallery, countdown, maps and RSVP. Prepared in 3–4 days after complete details.",
  },
  {
    id: "cinematic-love",
    name: "A Cinematic Love",
    category: "videos" as Category,
    price: 1499,
    theme: "rose",
    tag: "PERSONALLY CRAFTED VIDEO",
    description:
      "A manually produced invitation film. Our team prepares and uploads your finished MP4 after reviewing your details.",
  },
];
