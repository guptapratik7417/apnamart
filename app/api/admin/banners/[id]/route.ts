import { isSuperAdminSession } from "@/lib/admin-auth";
import { deleteBannerImage, updateBannerImage } from "@/lib/store";
import type { CreateBannerImageInput } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const input = (await request.json()) as Partial<CreateBannerImageInput>;
    const banner = await updateBannerImage(id, input);
    return Response.json({ banner });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Banner update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await deleteBannerImage(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Banner delete failed" },
      { status: 400 }
    );
  }
}
