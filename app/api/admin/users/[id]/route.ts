import { isSuperAdminSession } from "@/lib/admin-auth";
import { deleteAdminUser, updateAdminUser } from "@/lib/store";
import type { CreateAdminUserInput } from "@/types";

type AdminUserRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: AdminUserRouteContext) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const patch = (await request.json()) as Partial<CreateAdminUserInput>;
    const user = await updateAdminUser(id, patch);
    return Response.json({ user });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Admin user update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: AdminUserRouteContext) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    await deleteAdminUser(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Admin user delete failed" },
      { status: 400 }
    );
  }
}
