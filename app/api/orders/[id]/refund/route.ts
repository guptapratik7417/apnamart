import { getCustomerSession } from "@/lib/customer-auth";
import { requestOrderRefund } from "@/lib/store";

type RefundRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RefundRouteContext) {
  const user = await getCustomerSession();
  if (!user) {
    return Response.json({ error: "Login required" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await requestOrderRefund(id, user.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Refund request failed" },
      { status: 400 }
    );
  }
}
