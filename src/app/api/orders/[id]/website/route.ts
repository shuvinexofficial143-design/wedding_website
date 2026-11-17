import { z } from "zod";
import { user, sameOrigin } from "@/lib/auth";
import { limit } from "@/lib/db";
import { readJson } from "@/lib/validation";
import { websiteDataSchema } from "@/lib/website/schema";
import { websiteOrder, updateWebsite } from "@/lib/website/repository";
import { StudioConflict } from "@/lib/studio/repository";
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, { params }: Context) {
  const actor = await user();
  if (!actor)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const { id } = await params;
    const w = await websiteOrder(actor, id);
    return Response.json(
      { data: w.data, revision: w.order.revision, token: w.order.public_token },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Website unavailable or unpaid" },
      { status: 403 },
    );
  }
}
export async function PATCH(req: Request, { params }: Context) {
  if (!sameOrigin(req))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const actor = await user();
  if (!actor)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!(await limit("website-save:" + actor.id, 100, 60000)))
    return Response.json({ error: "Try again shortly" }, { status: 429 });
  try {
    const input = z
      .object({
        action: z.enum(["save", "publish", "unpublish"]),
        revision: z.number().int().nonnegative(),
        data: websiteDataSchema.optional(),
      })
      .strict()
      .parse(await readJson(req, 100000));
    const { id } = await params;
    return Response.json(
      await updateWebsite(actor, id, input.revision, input.action, input.data),
    );
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof StudioConflict ? 409 : 400 },
    );
  }
}
