import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ user: await getCustomerSession() });
}
