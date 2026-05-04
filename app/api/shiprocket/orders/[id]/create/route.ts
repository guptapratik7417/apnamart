import { isSuperAdminSession } from "@/lib/admin-auth";
import { createShiprocketOrder } from "@/lib/shiprocket";
import { getOrderById, updateOrder } from "@/lib/store";

type ShiprocketCreateRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: ShiprocketCreateRouteContext
) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const order = await getOrderById(id);

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.shiprocket_order_id || order.shiprocket_shipment_id) {
    return Response.json(
      { error: "Shiprocket shipment already exists for this order." },
      { status: 409 }
    );
  }

  try {
    const shiprocket = await createShiprocketOrder(order);
    await updateOrder(order.id, {
      shiprocket_order_id: shiprocket.order_id
        ? String(shiprocket.order_id)
        : null,
      shiprocket_shipment_id: shiprocket.shipment_id
        ? String(shiprocket.shipment_id)
        : null,
      shiprocket_awb_code: shiprocket.awb_code || null,
      shiprocket_courier_name: shiprocket.courier_name || null,
      status: "confirmed",
    });

    return Response.json({ shiprocket });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Shiprocket order creation failed.",
      },
      { status: 400 }
    );
  }
}
