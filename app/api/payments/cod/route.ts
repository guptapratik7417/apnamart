import { updateOrder } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { order_id?: string };

  if (!body.order_id) {
    return Response.json({ error: "order_id is required." }, { status: 400 });
  }

  await updateOrder(body.order_id, {
    payment_method: "cod",
    payment_status: "pending",
  });

  return Response.json({ ok: true });
}
