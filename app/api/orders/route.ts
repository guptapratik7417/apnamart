import { isAdminSession } from "@/lib/admin-auth";
import { getCustomerSession } from "@/lib/customer-auth";
import { createOrder, getOrders } from "@/lib/store";
import type { CreateOrderInput } from "@/types";

export async function GET() {
  if (!(await isAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ orders: await getOrders() });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CreateOrderInput;
    const user = await getCustomerSession();
    const order = await createOrder({ ...input, user_id: user?.id || null });
    return Response.json({ order }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Order could not be placed. Please review your cart and try again." },
      { status: 400 }
    );
  }
}
