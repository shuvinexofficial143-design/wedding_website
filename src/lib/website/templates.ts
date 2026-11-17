import { newDocument, type CardDocument } from "../studio/schema";
import type { WebsiteTemplate } from "./schema";
export function websiteTemplates() {
  return (["heritage", "garden", "editorial", "celebration"] as const).map(
    (layout, i) => ({
      id: "website-studio-" + (i + 1),
      style: "SITE-0" + (i + 1),
      document: {
        ...newDocument(),
        name: [
          "Royal Indian Heritage",
          "Romantic Floral Garden",
          "Modern Editorial Wedding",
          "Traditional Indian Celebration",
        ][i],
        description:
          "Self-service wedding website. Personalise events, story and photos after verified sandbox payment. Existing managed website packages remain a separate service.",
        category: "websites",
        pricePaise: 149900,
        website: {
          version: 1,
          workflow: "self-service",
          layout,
          background: ["#fff9f4", "#f4e7e9", "#ffffff", "#7a2e3a"][i],
          ink: i === 3 ? "#fff9f4" : "#2b1c1f",
          accent: "#c9a55c",
          sections: ["story", "gallery", "events", "contact", "gifts"],
        } as WebsiteTemplate,
      } as CardDocument,
    }),
  );
}
