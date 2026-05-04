import { canManageCatalogSession } from "@/lib/admin-auth";
import { createProduct, getProducts } from "@/lib/store";
import type { CreateProductInput, ProductAttribute, ProductsQueryParams } from "@/types";

function numberParam(value: string | null) {
  return value ? Number(value) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids");
  const params: ProductsQueryParams = {
    category: url.searchParams.get("category"),
    attribute_tag: url.searchParams.get("attribute_tag") as ProductAttribute | null,
    min_price: numberParam(url.searchParams.get("min_price")),
    max_price: numberParam(url.searchParams.get("max_price")),
    min_rating: numberParam(url.searchParams.get("min_rating")),
    q: url.searchParams.get("q"),
    sort: (url.searchParams.get("sort") || "newest") as ProductsQueryParams["sort"],
    limit: Number(url.searchParams.get("limit") || 48),
    ids: ids ? ids.split(",").filter(Boolean) : undefined,
  };

  const products = await getProducts(params);
  return Response.json({ products });
}

export async function POST(request: Request) {
  if (!(await canManageCatalogSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const input = (await request.json()) as CreateProductInput;
    const product = await createProduct(input);
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Product create failed" },
      { status: 400 }
    );
  }
}
