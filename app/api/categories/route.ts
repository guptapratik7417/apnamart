import { canManageCatalogSession } from "@/lib/admin-auth";
import { getCategories } from "@/lib/store";
import { createCategory } from "@/lib/store";
import type { CreateCategoryInput } from "@/types";

export async function GET() {
  return Response.json({ categories: await getCategories() });
}

export async function POST(request: Request) {
  if (!(await canManageCatalogSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const input = (await request.json()) as CreateCategoryInput;
    const category = await createCategory(input);
    return Response.json({ category }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Category create failed" },
      { status: 400 }
    );
  }
}
