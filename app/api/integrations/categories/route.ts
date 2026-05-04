import { verifyIntegrationRequest } from "@/lib/integration-auth";
import { getCategories } from "@/lib/store";

export async function GET(request: Request) {
  const auth = verifyIntegrationRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const categories = await getCategories();
  return Response.json({ categories });
}
