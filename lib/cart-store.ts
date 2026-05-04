import { randomUUID } from "crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import {
  executeQuery,
  getDatabasePool,
  getDatabaseSetupMessage,
  queryRows,
  withTransaction,
} from "@/lib/mariadb";
import type { CartLine } from "@/types";

type CartInputLine = {
  product_id: string;
  quantity: number;
};

type CartOwner = {
  sessionId?: string;
  userId?: string | null;
};

type DbCartRow = RowDataPacket & {
  id: string;
};

type DbCartLineRow = RowDataPacket & {
  product_id: string;
  slug: string;
  name: string;
  price: number | string;
  original_price?: number | string | null;
  stock_quantity: number;
  image_url?: string | null;
  attribute_tag?: string | null;
  weight_grams?: number | string | null;
  quantity: number;
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizeSessionId(sessionId: string) {
  return sessionId.trim().slice(0, 255);
}

function safeSessionId(owner: CartOwner) {
  return normalizeSessionId(owner.sessionId || "");
}

function normalizeCartInput(items: CartInputLine[]) {
  const quantities = new Map<string, number>();

  items.forEach((item) => {
    const productId = item.product_id?.trim();
    const quantity = Math.floor(Number(item.quantity));
    if (!productId || quantity <= 0) return;
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  });

  return Array.from(quantities.entries()).map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }));
}

function normalizeCartLine(row: DbCartLineRow): CartLine {
  return {
    product_id: row.product_id,
    slug: row.slug,
    name: row.name,
    price: toNumber(row.price),
    original_price: row.original_price ? toNumber(row.original_price) : null,
    stock_quantity: Number(row.stock_quantity || 0),
    image_url: row.image_url || null,
    attribute_tag: row.attribute_tag || null,
    weight_grams: row.weight_grams ? toNumber(row.weight_grams) : null,
    quantity: Math.min(Number(row.quantity || 1), Number(row.stock_quantity || 1)),
  };
}

export async function getOrCreateCart(owner: CartOwner) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const sessionId = safeSessionId(owner);
  if (!owner.userId && !sessionId) throw new Error("Cart session id is required.");

  const rows = owner.userId
    ? await queryRows<DbCartRow[]>(
        "SELECT id FROM carts WHERE user_id = ? LIMIT 1",
        [owner.userId]
      )
    : await queryRows<DbCartRow[]>(
        "SELECT id FROM carts WHERE session_id = ? LIMIT 1",
        [sessionId]
      );

  if (rows[0]) return rows[0].id;

  const id = randomUUID();
  await executeQuery(
    "INSERT INTO carts (id, user_id, session_id, created_at) VALUES (?, ?, ?, NOW())",
    [id, owner.userId || null, sessionId || null]
  );
  return id;
}

export async function getCart(owner: CartOwner): Promise<CartLine[]> {
  if (!getDatabasePool()) return [];

  const sessionId = safeSessionId(owner);
  if (!owner.userId && !sessionId) return [];

  const rows = await queryRows<DbCartLineRow[]>(
    `SELECT
       ci.product_id,
       ci.quantity,
       p.slug,
       p.name,
       p.price,
       p.original_price,
       p.stock_quantity,
       p.attribute_tag,
       p.weight_grams,
       (
         SELECT pi.image_url
         FROM product_images pi
         WHERE pi.product_id = p.id
         ORDER BY pi.is_primary DESC, pi.display_order ASC
         LIMIT 1
       ) AS image_url
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     WHERE ${owner.userId ? "c.user_id = ?" : "c.session_id = ?"}
       AND p.is_active = 1
     ORDER BY ci.created_at ASC`,
    [owner.userId || sessionId]
  );

  return rows.map(normalizeCartLine);
}

export async function syncCart(owner: CartOwner, items: CartInputLine[]) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const sessionId = safeSessionId(owner);
  if (!owner.userId && !sessionId) throw new Error("Cart session id is required.");

  const normalizedItems = normalizeCartInput(items);

  await withTransaction(async (connection) => {
    const [cartRows] = owner.userId
      ? await connection.execute<DbCartRow[]>(
          "SELECT id FROM carts WHERE user_id = ? LIMIT 1",
          [owner.userId]
        )
      : await connection.execute<DbCartRow[]>(
          "SELECT id FROM carts WHERE session_id = ? LIMIT 1",
          [sessionId]
        );

    const cartId = cartRows[0]?.id || randomUUID();
    if (!cartRows[0]) {
      await connection.execute(
        "INSERT INTO carts (id, user_id, session_id, created_at) VALUES (?, ?, ?, NOW())",
        [cartId, owner.userId || null, sessionId || null]
      );
    } else if (owner.userId) {
      await connection.execute(
        "UPDATE carts SET user_id = ?, session_id = COALESCE(session_id, ?) WHERE id = ?",
        [owner.userId, sessionId || null, cartId]
      );
    }

    await connection.execute("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);

    for (const item of normalizedItems) {
      const [productRows] = await connection.execute<RowDataPacket[]>(
        "SELECT stock_quantity FROM products WHERE id = ? AND is_active = 1 LIMIT 1",
        [item.product_id]
      );
      const stockQuantity = Number(productRows[0]?.stock_quantity || 0);
      const quantity = Math.min(item.quantity, stockQuantity);
      if (quantity <= 0) continue;

      await connection.execute<ResultSetHeader>(
        `INSERT INTO cart_items
          (id, cart_id, product_id, quantity, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [randomUUID(), cartId, item.product_id, quantity]
      );
    }
  });

  return getCart(owner);
}

export async function clearServerCart(owner: CartOwner) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const sessionId = safeSessionId(owner);
  if (!owner.userId && !sessionId) return [];

  const cartId = await getOrCreateCart(owner);
  await executeQuery("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
  return [];
}
