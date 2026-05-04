import { verifyIntegrationRequest } from "@/lib/integration-auth";
import { getProductBySlug, getProducts } from "@/lib/store";

type IntegrationProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: IntegrationProductRouteContext
) {
  const auth = verifyIntegrationRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const products = await getProducts({ ids: [id], includeInactive: true, limit: 1 });
  const product = products[0] || (await getProductBySlug(id));

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  return Response.json({ product });
}
