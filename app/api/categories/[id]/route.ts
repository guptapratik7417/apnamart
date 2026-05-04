import { canManageCatalogSession } from "@/lib/admin-auth";
import { deleteCategory, updateCategory } from "@/lib/store";
import type { CreateCategoryInput } from "@/types";

type CategoryRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: CategoryRouteContext) {
  if (!(await canManageCatalogSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const patch = (await request.json()) as Partial<CreateCategoryInput>;
  try {
    await updateCategory(id, patch);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Category update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: CategoryRouteContext) {
  if (!(await canManageCatalogSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    await deleteCategory(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Category delete failed" },
      { status: 400 }
    );
  }
}
