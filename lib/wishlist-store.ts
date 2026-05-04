import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";

import {
  executeQuery,
  getDatabasePool,
  getDatabaseSetupMessage,
  queryRows,
} from "@/lib/mariadb";
import type { WishlistLine } from "@/types";

type DbWishlistLineRow = RowDataPacket & WishlistLine;

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizeWishlistLine(row: DbWishlistLineRow): WishlistLine {
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
    added_at: row.added_at,
  };
}

async function ensureWishlistStorage() {
  await executeQuery(
    `CREATE TABLE IF NOT EXISTS wishlists (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      product_id CHAR(36) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_wishlists_user_product (user_id, product_id),
      CONSTRAINT fk_wishlists_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_wishlists_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await executeQuery(
    "CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id)"
  );
  await executeQuery(
    "CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists(product_id)"
  );
}

export async function getWishlist(userId: string): Promise<WishlistLine[]> {
  if (!getDatabasePool()) return [];
  await ensureWishlistStorage();

  const rows = await queryRows<DbWishlistLineRow[]>(
    `SELECT
       w.product_id,
       w.created_at AS added_at,
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
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = ? AND p.is_active = 1
     ORDER BY w.created_at DESC`,
    [userId]
  );

  return rows.map(normalizeWishlistLine);
}

export async function addWishlistItem(userId: string, productId: string) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());
  await ensureWishlistStorage();

  await executeQuery(
    `INSERT INTO wishlists (id, user_id, product_id, created_at, updated_at)
     SELECT ?, ?, p.id, NOW(), NOW()
     FROM products p
     WHERE p.id = ? AND p.is_active = 1
     ON DUPLICATE KEY UPDATE updated_at = NOW()`,
    [randomUUID(), userId, productId]
  );

  return getWishlist(userId);
}

export async function removeWishlistItem(userId: string, productId: string) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());
  await ensureWishlistStorage();

  await executeQuery(
    "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?",
    [userId, productId]
  );

  return getWishlist(userId);
}
