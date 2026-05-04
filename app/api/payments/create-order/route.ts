import { updateOrder } from "@/lib/store";
import { appProperties, getRazorpayRuntimeProperties } from "@/config/app-properties";

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
};

export async function POST(request: Request) {
  const { keyId, keySecret } = getRazorpayRuntimeProperties();
  const razorpayProperties = appProperties.payments.razorpay;

  if (
    !keyId ||
    !keySecret ||
    keyId.includes(razorpayProperties.placeholderKeyToken) ||
    keySecret.includes(razorpayProperties.placeholderKeyToken)
  ) {
    return Response.json(
      { error: razorpayProperties.keysMissingMessage },
      { status: 400 }
    );
  }

  const body = (await request.json()) as { order_id?: string; amount?: number };
  if (!body.order_id || !body.amount) {
    return Response.json({ error: "order_id and amount are required." }, { status: 400 });
  }

  const amountInPaise = Math.round(body.amount * 100);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: razorpayProperties.currency,
      receipt: body.order_id,
    }),
  });

  const payload = (await response.json()) as Partial<RazorpayOrderResponse> & {
    error?: { description?: string };
  };

  if (!response.ok || !payload.id || !payload.amount) {
    return Response.json(
      { error: razorpayProperties.orderFailedMessage },
      { status: 400 }
    );
  }

  await updateOrder(body.order_id, {
    payment_method: "razorpay",
    razorpay_order_id: payload.id,
    payment_status: "pending",
  }).catch(() => undefined);

  return Response.json({
    key_id: keyId,
    razorpay_order_id: payload.id,
    amount: payload.amount,
  });
}
