import {websiteTemplates} from "../website/templates";
import { animatedTemplates } from "../animation/templates";
import { collisionPairs } from "./layout";
import { randomUUID } from "node:crypto";
import { db, transaction, type User } from "../db";
import { products } from "../catalog";
import { cardTemplates } from "../card-templates";
import {
  documentSchema,
  documentAssetIds,
  newDocument,
  type TemplateDocument,
  type CardDocument,
} from "./schema";
import { linkAsset } from "../storage/assets";
export type TemplateRow = {
  id: string;
  style_number: string;
  status: string;
  head_version: number;
  revision: number;
  published_version: number | null;
  sort_order: number;
  featured: number;
  created_by: string | null;
  created: number;
  updated: number;
};
export type Version = {
  template_id: string;
  version: number;
  document: string;
  created: number;
};
let seeded: Promise<void> | undefined;
export function seedLegacyTemplates() {
  return (seeded ||= transaction(async () => {
    for (const [i, p] of products.entries()) {
      const doc: TemplateDocument = {
        ...newDocument(),
        name: p.name,
        description: p.description,
        category: p.category,
        pricePaise: p.price * 100,
        renderer: "legacy",
        legacyTheme: p.theme,
        legacyProduct: p,
        legacyArtwork: cardTemplates.find((t) => t.id === p.id),
      };
      await db()
        .prepare(
          "INSERT INTO card_templates(id,style_number,status,head_version,published_version,sort_order,created,updated) VALUES(?,?,'published',1,1,?,?,?) ON CONFLICT(id) DO NOTHING",
        )
        .run(
          p.id,
          `LEGACY-${String(i + 1).padStart(3, "0")}`,
          i,
          Date.now(),
          Date.now(),
        );
      await db()
        .prepare(
          "INSERT INTO template_versions(template_id,version,document,created) VALUES(?,1,?,?) ON CONFLICT DO NOTHING",
        )
        .run(p.id, JSON.stringify(doc), Date.now());
    }
    for (const [i, t] of [...animatedTemplates(),...websiteTemplates()].entries()) {
      documentSchema.parse(t.document);
      await db()
        .prepare(
          "INSERT INTO card_templates(id,style_number,status,head_version,published_version,sort_order,created,updated) VALUES(?,?,'published',1,1,?,?,?) ON CONFLICT(id) DO NOTHING",
        )
        .run(t.id, t.style, 50 + i, Date.now(), Date.now());
      await db()
        .prepare(
          "INSERT INTO template_versions(template_id,version,document,created) VALUES(?,1,?,?) ON CONFLICT DO NOTHING",
        )
        .run(
          t.id,
          JSON.stringify({ ...t.document, renderer: "layers" }),
          Date.now(),
        );
    }
    await db()
      .prepare(
        "INSERT INTO purchased_products(order_id,template_id,template_version,created) SELECT o.id,o.product_id,1,o.created FROM orders o JOIN card_templates t ON t.id=o.product_id WHERE NOT EXISTS(SELECT 1 FROM purchased_products p WHERE p.order_id=o.id) ON CONFLICT DO NOTHING",
      )
      .run();
  }).catch((e) => {
    seeded = undefined;
    throw e;
  }));
}
export async function templateById(id: string) {
  await seedLegacyTemplates();
  return (await db()
    .prepare("SELECT * FROM card_templates WHERE id=?")
    .get(id)) as TemplateRow | undefined;
}
export async function versionById(id: string, version: number) {
  const row = (await db()
    .prepare(
      "SELECT * FROM template_versions WHERE template_id=? AND version=?",
    )
    .get(id, version)) as Version | undefined;
  return row
    ? { ...row, content: JSON.parse(row.document) as TemplateDocument }
    : undefined;
}
export async function listTemplates(admin = false) {
  await seedLegacyTemplates();
  return (await db()
    .prepare(
      `SELECT * FROM card_templates ${admin ? "" : "WHERE status='published'"} ORDER BY featured DESC,sort_order,created DESC`,
    )
    .all()) as TemplateRow[];
}
export async function catalogProducts() {
  const rows = await listTemplates();
  return Promise.all(
    rows.map(async (t) => {
      const v = await versionById(t.id, t.published_version!);
      const d = v!.content;
      return {
        id: t.id,
        name: d.name,
        category: d.category,
        price: d.pricePaise / 100,
        theme: d.legacyTheme || "studio",
        tag: t.style_number,
        description: d.description,
        document: d,
        version: v!.version,
        featured: !!t.featured,
      };
    }),
  );
}
export async function studioProduct(id: string) {
  const t = await templateById(id);
  if (!t || t.status !== "published" || !t.published_version) return undefined;
  const v = await versionById(id, t.published_version);
  if (!v) return undefined;
  return {
    id,
    name: v.content.name,
    category: v.content.category,
    price: v.content.pricePaise / 100,
    theme: v.content.legacyTheme || "studio",
    tag: t.style_number,
    description: v.content.description,
    document: v.content,
    version: v.version,
  };
}
export async function purchasedVersion(orderId: string) {
  await seedLegacyTemplates();
  const p = (await db()
    .prepare("SELECT * FROM purchased_products WHERE order_id=?")
    .get(orderId)) as
    { template_id: string; template_version: number } | undefined;
  return p ? versionById(p.template_id, p.template_version) : undefined;
}
export async function auditStudio(
  u: User,
  id: string,
  action: string,
  metadata: unknown = {},
) {
  await db()
    .prepare("INSERT INTO admin_audit_logs VALUES(?,?,?,?,?,?,?)")
    .run(
      randomUUID(),
      u.id,
      "template",
      id,
      action,
      JSON.stringify(metadata),
      Date.now(),
    );
}
async function assetsForVersion(
  u: User,
  id: string,
  version: number,
  doc: CardDocument,
) {
  for (const asset of documentAssetIds(doc))
    await linkAsset(asset, u.id, "template_version", `${id}:${version}`);
}
export async function createTemplate(u: User, style: string, input: unknown) {
  const doc = documentSchema.parse(input);
  if (!/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(style))
    throw new Error(
      "Use a unique style number: 3–40 uppercase letters, digits or hyphens",
    );
  return transaction(async () => {
    const id = randomUUID();
    await db()
      .prepare(
        "INSERT INTO card_templates(id,style_number,status,head_version,created_by,created,updated) VALUES(?,?,'draft',1,?,?,?)",
      )
      .run(id, style, u.id, Date.now(), Date.now());
    await assetsForVersion(u, id, 1, doc);
    await db()
      .prepare(
        "INSERT INTO template_versions(template_id,version,document,created_by,created) VALUES(?,1,?,?,?)",
      )
      .run(
        id,
        JSON.stringify({ ...doc, renderer: "layers" }),
        u.id,
        Date.now(),
      );
    await auditStudio(u, id, "created");
    return id;
  });
}
export class StudioConflict extends Error {}
export async function saveTemplate(
  u: User,
  id: string,
  expectedRevision: number,
  input: unknown,
) {
  const doc = documentSchema.parse(input);
  await seedLegacyTemplates();
  return transaction(async () => {
    const t = await templateById(id);
    if (!t || t.revision !== expectedRevision)
      throw new StudioConflict(
        "Another admin updated this template. Reload before saving.",
      );
    const next = t.head_version + 1;
    const changed = await db()
      .prepare(
        "UPDATE card_templates SET head_version=?,revision=revision+1,updated=? WHERE id=? AND revision=?",
      )
      .run(next, Date.now(), id, expectedRevision);
    if (!changed.changes) throw new StudioConflict("Concurrent admin update");
    await assetsForVersion(u, id, next, doc);
    await db()
      .prepare(
        "INSERT INTO template_versions(template_id,version,document,created_by,created) VALUES(?,?,?,?,?)",
      )
      .run(
        id,
        next,
        JSON.stringify({ ...doc, renderer: "layers" }),
        u.id,
        Date.now(),
      );
    await auditStudio(u, id, "version_saved", { version: next });
    return { version: next, revision: expectedRevision + 1 };
  });
}
export async function publishTemplate(
  u: User,
  id: string,
  expectedRevision: number,
  status: "published" | "unpublished" | "archived",
  sort: number,
  featured: boolean,
) {
  await seedLegacyTemplates();
  return transaction(async () => {
    const t = await templateById(id);
    if (!t || t.revision !== expectedRevision)
      throw new StudioConflict("Template changed; reload first");
    const version = await versionById(id, t.head_version);
    if (!version) throw new Error("Version missing");
    if (status === "published" && version.content.renderer !== "legacy") {
      documentSchema.parse(
        Object.fromEntries(
          Object.entries(version.content).filter(([key]) => key !== "renderer"),
        ),
      );
      if (collisionPairs(version.content.layers).length)
        throw new Error("Resolve text layer collisions before publishing");
      if (!version.content.website && !version.content.layers.length)
        throw new Error("Add at least one layer before publishing");
    }
    const result = await db()
      .prepare(
        "UPDATE card_templates SET status=?,published_version=?,sort_order=?,featured=?,revision=revision+1,updated=? WHERE id=? AND revision=?",
      )
      .run(
        status,
        status === "published" ? t.head_version : t.published_version,
        sort,
        featured ? 1 : 0,
        Date.now(),
        id,
        expectedRevision,
      );
    if (!result.changes) throw new StudioConflict("Concurrent update");
    await auditStudio(u, id, status, { version: t.head_version });
    return { revision: expectedRevision + 1, version: t.head_version };
  });
}
