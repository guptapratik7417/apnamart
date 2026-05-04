import { createHmac, timingSafeEqual } from "crypto";
import { updateOrder } from "@/lib/store";
import { appProperties, getRazorpayRuntimeProperties } from "@/config/app-properties";

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function POST(request: Request) {
  const { keySecret } = getRazorpayRuntimeProperties();
  const razorpayProperties = appProperties.payments.razorpay;

  if (
    !keySecret ||
    keySecret.includes(razorpayProperties.placeholderKeyToken)
  ) {
    return Response.json(
      { error: razorpayProperties.secretMissingMessage },
      { status: 400 }
    );
  }

  const body = (await request.json()) as {
    order_id?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  if (
    !body.order_id ||
    !body.razorpay_order_id ||
    !body.razorpay_payment_id ||
    !body.razorpay_signature
  ) {
    return Response.json({ error: "Missing payment fields." }, { status: 400 });
  }

  const expected = createHmac("sha256", keySecret)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest("hex");

  if (!signaturesMatch(body.razorpay_signature, expected)) {
    return Response.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  await updateOrder(body.order_id, {
    payment_status: "paid",
    razorpay_order_id: body.razorpay_order_id,
    razorpay_payment_id: body.razorpay_payment_id,
  }).catch(() => undefined);

  return Response.json({ ok: true });
}
