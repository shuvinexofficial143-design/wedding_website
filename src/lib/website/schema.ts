import { z } from "zod";
export const sectionNames = [
  "story",
  "gallery",
  "events",
  "contact",
  "gifts",
] as const;
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const websiteTemplateSchema = z
  .object({
    version: z.literal(1),
    workflow: z.literal("self-service"),
    layout: z.enum(["heritage", "garden", "editorial", "celebration"]),
    background: color,
    ink: color,
    accent: color,
    sections: z.array(z.enum(sectionNames)).max(5),
  })
  .strict();
const photo = z.string().regex(/^\/api\/assets\/[a-f0-9-]{36}$/);
const maps = z
  .string()
  .max(1000)
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return (
        u.protocol === "https:" &&
        [
          "maps.google.com",
          "www.google.com",
          "google.com",
          "maps.app.goo.gl",
        ].includes(u.hostname)
      );
    } catch {
      return false;
    }
  }, "Use an HTTPS Google Maps link");
export const eventSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(80),
    dateTime: z.string().datetime({ offset: true }),
    venue: z.string().trim().max(200),
    address: z.string().max(400),
    maps,
  })
  .strict();
export const websiteDataSchema = z
  .object({
    partnerA: z.string().trim().min(1).max(100),
    partnerB: z.string().trim().min(1).max(100),
    introduction: z.string().max(800),
    story: z.string().max(4000),
    message: z.string().max(1200),
    couplePhoto: z.union([photo, z.literal("")]),
    gallery: z.array(photo).max(12),
    events: z.array(eventSchema).min(1).max(12),
    contact: z.string().max(400),
    gifts: z.string().max(600),
    sections: z.array(z.enum(sectionNames)).max(5),
  })
  .strict()
  .superRefine((d, c) => {
    if (new Set(d.events.map((e) => e.id)).size !== d.events.length)
      c.addIssue({ code: "custom", message: "Event IDs must be unique" });
  });
export type WebsiteData = z.infer<typeof websiteDataSchema>;
export type WebsiteTemplate = z.infer<typeof websiteTemplateSchema>;
export const websitePublicationSchema = z
  .object({
    kind: z.literal("wedding-site"),
    version: z.number().int().positive(),
    data: websiteDataSchema,
  })
  .strict();
export const sampleWebsite = (): WebsiteData => ({
  partnerA: "Ananya",
  partnerB: "Aarav",
  introduction: "Two hearts. One beautiful beginning.",
  story:
    "A chance meeting became a friendship, and a friendship became our forever. We cannot wait to celebrate this next chapter with you.",
  message: "Your presence will make our celebration complete.",
  couplePhoto: "",
  gallery: [],
  events: [
    {
      id: "b1000000-0000-4000-8000-000000000001",
      name: "Wedding",
      dateTime: "2027-02-21T18:00:00+05:30",
      venue: "The Rose Palace",
      address: "Jaipur, Rajasthan",
      maps: "",
    },
  ],
  contact: "",
  gifts: "",
  sections: ["story", "gallery", "events", "contact"],
});
export function websiteAssets(data: WebsiteData) {
  return [
    ...new Set(
      [
        data.couplePhoto,
        ...(data.sections.includes("gallery") ? data.gallery : []),
      ]
        .filter(Boolean)
        .map((v) => v.split("/").at(-1)!),
    ),
  ];
}
