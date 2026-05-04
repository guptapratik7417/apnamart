import { canManageCatalogSession } from "@/lib/admin-auth";
import { deleteProduct, updateProduct } from "@/lib/store";
import type { CreateProductInput } from "@/types";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: ProductRouteContext) {
  if (!(await canManageCatalogSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const patch = (await request.json()) as Partial<CreateProductInput>;
  try {
    await updateProduct(id, patch);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Product update failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: ProductRouteContext) {
  if (!(await canManageCatalogSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    await deleteProduct(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Product delete failed" },
      { status: 400 }
    );
  }
}
