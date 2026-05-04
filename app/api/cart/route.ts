import {
  clearServerCart,
  getCart,
  syncCart,
} from "@/lib/cart-store";
import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

type CartRequestBody = {
  session_id?: string;
  items?: Array<{
    product_id: string;
    quantity: number;
  }>;
};

function sessionIdFromRequest(request: Request, body?: CartRequestBody) {
  const url = new URL(request.url);
  return body?.session_id || url.searchParams.get("session_id") || "";
}

function unauthorizedCart() {
  return Response.json(
    { error: "Please login before using the cart." },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  try {
    const sessionId = sessionIdFromRequest(request);
    const user = await getCustomerSession();
    if (!user) return unauthorizedCart();

    const items = await getCart({ sessionId, userId: user.id });
    return Response.json({ items });
  } catch {
    return Response.json(
      { error: "Cart could not be loaded. Please try again." },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as CartRequestBody;
    const sessionId = sessionIdFromRequest(request, body);
    const user = await getCustomerSession();
    if (!user) return unauthorizedCart();

    const items = await syncCart({ sessionId, userId: user.id }, body.items || []);
    return Response.json({ items });
  } catch {
    return Response.json(
      { error: "Cart could not be saved. Please try again." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as CartRequestBody;
    const sessionId = sessionIdFromRequest(request, body);
    const user = await getCustomerSession();
    if (!user) return unauthorizedCart();

    const items = await clearServerCart({ sessionId, userId: user.id });
    return Response.json({ items });
  } catch {
    return Response.json(
      { error: "Cart could not be cleared. Please try again." },
      { status: 400 }
    );
  }
}
