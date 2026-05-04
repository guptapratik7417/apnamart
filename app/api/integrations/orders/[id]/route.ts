import { verifyIntegrationRequest } from "@/lib/integration-auth";
import { ALL_ORDER_STATUS_OPTIONS, getOrderStatusLabel } from "@/lib/order-journey";
import { getOrderByIdOrNumber, updateOrder } from "@/lib/store";
import type { OrderStatus } from "@/types";

type IntegrationOrderRouteContext = {
  params: Promise<{ id: string }>;
};

const validOrderStatuses = new Set<OrderStatus>(
  ALL_ORDER_STATUS_OPTIONS.map((status) => status.value)
);

function serializeOrder(order: NonNullable<Awaited<ReturnType<typeof getOrderByIdOrNumber>>>) {
  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    status_label: getOrderStatusLabel(order.status),
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    customer_email: order.customer_email,
    shipping_name: order.shipping_name,
    shipping_phone: order.shipping_phone,
    shipping_address: order.shipping_address,
    shipping_city: order.shipping_city,
    shipping_state: order.shipping_state,
    shipping_pincode: order.shipping_pincode,
    subtotal: order.subtotal,
    shipping_charge: order.shipping_charge,
    total: order.total,
    items: order.items,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

export async function GET(
  request: Request,
  context: IntegrationOrderRouteContext
) {
  const auth = verifyIntegrationRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const order = await getOrderByIdOrNumber(id);

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json({ order: serializeOrder(order) });
}

export async function PATCH(
  request: Request,
  context: IntegrationOrderRouteContext
) {
  const auth = verifyIntegrationRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const order = await getOrderByIdOrNumber(id);

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const body = (await request.json()) as { status?: OrderStatus };
  if (!body.status || !validOrderStatuses.has(body.status)) {
    return Response.json({ error: "Invalid order status" }, { status: 400 });
  }

  try {
    await updateOrder(order.id, { status: body.status });
    const updatedOrder = await getOrderByIdOrNumber(order.id);
    return Response.json({
      order: updatedOrder ? serializeOrder(updatedOrder) : null,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Order status update failed",
      },
      { status: 400 }
    );
  }
}
