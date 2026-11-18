import { redirect, notFound } from "next/navigation";
import { user, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { templateById, versionById } from "@/lib/studio/repository";
import { Designer } from "@/components/studio/designer";
export default async function Design({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await user();
  if (!u) redirect("/login?next=/admin/cards");
  if (!isAdmin(u)) notFound();
  const { id } = await params;
  if (id === "new") return <Designer />;
  const t = await templateById(id);
  if (!t) notFound();
  const v = await versionById(id, t.head_version);
  const history = (await db()
    .prepare(
      "SELECT version FROM template_versions WHERE template_id=? ORDER BY version DESC",
    )
    .all(id)) as { version: number }[];
  return (
    <Designer
      id={id}
      initial={v?.content}
      revision={t.revision}
      featured={!!t.featured}
      sortOrder={t.sort_order}
      style={t.style_number}
      history={history.map((v) => v.version)}
    />
  );
}
