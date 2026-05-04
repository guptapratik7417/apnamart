import {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
} from "@/lib/wishlist-store";
import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

type WishlistRequestBody = {
  product_id?: string;
};

function unauthorizedWishlist() {
  return Response.json(
    { error: "Please login before using the wishlist." },
    { status: 401 }
  );
}

export async function GET() {
  try {
    const user = await getCustomerSession();
    if (!user) return unauthorizedWishlist();

    const items = await getWishlist(user.id);
    return Response.json({ items });
  } catch {
    return Response.json(
      { error: "Wishlist could not be loaded. Please try again." },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as WishlistRequestBody;
    const user = await getCustomerSession();
    if (!user) return unauthorizedWishlist();
    if (!body.product_id) {
      return Response.json({ error: "product_id is required" }, { status: 400 });
    }

    const items = await addWishlistItem(user.id, body.product_id);
    return Response.json({ items });
  } catch {
    return Response.json(
      { error: "Wishlist could not be saved. Please try again." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as WishlistRequestBody;
    const user = await getCustomerSession();
    if (!user) return unauthorizedWishlist();
    if (!body.product_id) {
      return Response.json({ error: "product_id is required" }, { status: 400 });
    }

    const items = await removeWishlistItem(user.id, body.product_id);
    return Response.json({ items });
  } catch {
    return Response.json(
      { error: "Wishlist could not be updated. Please try again." },
      { status: 400 }
    );
  }
}
