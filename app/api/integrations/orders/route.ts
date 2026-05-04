import { verifyIntegrationRequest } from "@/lib/integration-auth";
import { getOrderStatusLabel } from "@/lib/order-journey";
import { getOrders } from "@/lib/store";
import type { OrderStatus } from "@/types";

function serializeOrder(order: Awaited<ReturnType<typeof getOrders>>[number]) {
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

export async function GET(request: Request) {
  const auth = verifyIntegrationRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as OrderStatus | null;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);
  const orders = await getOrders();
  const filteredOrders = status
    ? orders.filter((order) => order.status === status)
    : orders;

  return Response.json({
    orders: filteredOrders.slice(0, limit).map(serializeOrder),
  });
}
