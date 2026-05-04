import { verifyIntegrationRequest } from "@/lib/integration-auth";
import { getProducts } from "@/lib/store";
import type { ProductAttribute, ProductsQueryParams } from "@/types";

function numberParam(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const auth = verifyIntegrationRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const ids = url.searchParams.get("ids");
  const query: ProductsQueryParams = {
    category: url.searchParams.get("category"),
    attribute_tag: url.searchParams.get("attribute_tag") as ProductAttribute | null,
    min_price: numberParam(url.searchParams.get("min_price")),
    max_price: numberParam(url.searchParams.get("max_price")),
    min_rating: numberParam(url.searchParams.get("min_rating")),
    q: url.searchParams.get("q"),
    sort: (url.searchParams.get("sort") || "newest") as ProductsQueryParams["sort"],
    limit: Math.min(Math.max(Number(url.searchParams.get("limit") || 48), 1), 100),
    ids: ids ? ids.split(",").filter(Boolean) : undefined,
  };

  const products = await getProducts(query);
  return Response.json({ products });
}
