import { isSuperAdminSession } from "@/lib/admin-auth";
import { ALL_ORDER_STATUS_OPTIONS } from "@/lib/order-journey";
import { getOrderById, updateOrder } from "@/lib/store";
import type { Order, OrderStatus, PaymentStatus } from "@/types";

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: OrderRouteContext) {
  const { id } = await context.params;
  const order = await getOrderById(id);

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json({ order });
}

export async function PATCH(request: Request, context: OrderRouteContext) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as Partial<
    Pick<
      Order,
      | "status"
      | "payment_method"
      | "payment_status"
      | "razorpay_order_id"
      | "razorpay_payment_id"
    >
  >;

  const validOrderStatuses = new Set<OrderStatus>(
    ALL_ORDER_STATUS_OPTIONS.map((status) => status.value)
  );
  const validPaymentStatuses = new Set<PaymentStatus>([
    "pending",
    "paid",
    "failed",
    "refunded",
  ]);
  const validPaymentMethods = new Set(["cod", "razorpay"]);

  if (body.status && !validOrderStatuses.has(body.status)) {
    return Response.json({ error: "Invalid order status" }, { status: 400 });
  }

  if (
    body.payment_status &&
    !validPaymentStatuses.has(body.payment_status)
  ) {
    return Response.json({ error: "Invalid payment status" }, { status: 400 });
  }

  if (
    body.payment_method &&
    !validPaymentMethods.has(body.payment_method)
  ) {
    return Response.json({ error: "Invalid payment method" }, { status: 400 });
  }

  try {
    await updateOrder(id, body);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Order update failed" },
      { status: 400 }
    );
  }
}
