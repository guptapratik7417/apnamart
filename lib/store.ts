import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";

import {
  demoCategories,
  demoOrders,
  demoProducts,
  demoReviews,
} from "@/lib/demo-data";
import { hashPassword } from "@/lib/customer-auth";
import {
  executeQuery,
  getDatabasePool,
  getDatabaseSetupMessage,
  queryRows,
  withTransaction,
  type QueryValue,
} from "@/lib/mariadb";
import { getSiteConfig } from "@/lib/site-config";
import { generateOrderNumber, generateSlug } from "@/lib/utils";
import type {
  AdminRole,
  AdminUser,
  Category,
  BannerImage,
  CreateAdminUserInput,
  CreateCategoryInput,
  CreateBannerImageInput,
  CreateOrderInput,
  CreateProductInput,
  CreateSupportTicketInput,
  DashboardStats,
  Order,
  OrderItem,
  Product,
  ProductImage,
  ProductsQueryParams,
  Review,
  SupportReplyVisibility,
  SupportTicketReply,
  SupportTicket,
  SupportTicketStatus,
} from "@/types";

type DbCategory = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  created_at?: string;
};

type DbBannerImageRow = RowDataPacket & {
  id: string;
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  image_url: string;
  image_alt?: string | null;
  primary_cta_label?: string | null;
  primary_cta_href?: string | null;
  secondary_cta_label?: string | null;
  secondary_cta_href?: string | null;
  href?: string | null;
  discount_badge_text?: string | null;
  show_discount_badge?: boolean | number | null;
  display_order?: number | null;
  is_active?: boolean | number | null;
  created_at?: string;
  updated_at?: string;
};

type DbProductImage = {
  id?: string;
  product_id?: string;
  image_url?: string;
  is_primary?: boolean | number;
  display_order?: number | null;
};

type DbProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number | string;
  original_price?: number | string | null;
  category_id?: string | null;
  category?: DbCategory | DbCategory[] | null;
  categories?: DbCategory | DbCategory[] | null;
  stock_quantity?: number | null;
  is_active?: boolean | number | null;
  is_featured?: boolean | number | null;
  rating_average?: number | string | null;
  review_count?: number | null;
  attribute_tag?: Product["attribute_tag"];
  weight_grams?: number | string | null;
  product_images?: DbProductImage[] | null;
  created_at?: string;
  updated_at?: string;
};

type DbOrderItem = {
  id?: string;
  order_id?: string;
  product_id?: string | null;
  product_name: string;
  product_image?: string | null;
  price: number | string;
  quantity: number;
  total?: number | string;
};

type DbOrder = {
  id: string;
  user_id?: string | null;
  order_number: string;
  customer_email?: string | null;
  status?: Order["status"] | null;
  subtotal: number | string;
  shipping_charge?: number | string | null;
  total: number | string;
  shipping_name?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_pincode?: string | null;
  shipping_phone?: string | null;
  payment_method?: Order["payment_method"] | null;
  payment_status?: Order["payment_status"] | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  shiprocket_order_id?: string | number | null;
  shiprocket_shipment_id?: string | number | null;
  shiprocket_awb_code?: string | null;
  shiprocket_courier_name?: string | null;
  notes?: string | null;
  order_items?: DbOrderItem[] | null;
  created_at: string;
  updated_at?: string;
};

type DbCategoryRow = RowDataPacket & Required<Pick<Category, "id" | "name" | "slug">> & {
  description?: string | null;
  image_url?: string | null;
  display_order?: number | null;
  created_at?: string;
  updated_at?: string;
};

type DbProductRow = RowDataPacket & DbProduct & {
  category_name?: string | null;
  category_slug?: string | null;
};

type DbProductImageRow = RowDataPacket & Required<Pick<ProductImage, "id" | "product_id" | "image_url">> & {
  is_primary: number;
  display_order: number | null;
};

type DbOrderRow = RowDataPacket & DbOrder;
type DbOrderItemRow = RowDataPacket & DbOrderItem;

type DbReview = {
  id: string;
  product_id?: string | null;
  review_target?: "product" | "company" | null;
  user_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  rating: number;
  review_text?: string | null;
  media_urls?: string | string[] | null;
  is_verified_purchase?: boolean | number;
  created_at: string;
  updated_at?: string;
};

type DbReviewRow = RowDataPacket & DbReview;
type DbSupportTicketRow = RowDataPacket & SupportTicket;
type DbSupportTicketReplyRow = RowDataPacket & SupportTicketReply;
type DbAdminUserRow = RowDataPacket & AdminUser;

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function firstCategory(
  category?: DbCategory | DbCategory[] | null
): Pick<Category, "id" | "name" | "slug"> | null {
  const value = Array.isArray(category) ? category[0] : category;
  if (!value?.name || !value.slug) return null;

  return {
    id: value.id || value.slug,
    name: value.name,
    slug: value.slug,
  };
}

function normalizeImages(images?: DbProductImage[] | null): ProductImage[] {
  return (images || [])
    .filter((image) => Boolean(image.image_url))
    .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
    .map((image, index) => ({
      id: image.id,
      product_id: image.product_id,
      image_url: image.image_url!,
      is_primary: Boolean(image.is_primary || index === 0),
      display_order: image.display_order || index,
    }));
}

function normalizeProduct(product: DbProduct): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: toNumber(product.price),
    original_price: product.original_price
      ? toNumber(product.original_price)
      : null,
    category_id: product.category_id,
    category: firstCategory(product.category || product.categories),
    stock_quantity: Number(product.stock_quantity || 0),
    is_active: Boolean(product.is_active ?? true),
    is_featured: Boolean(product.is_featured),
    rating_average: Math.min(Math.max(toNumber(product.rating_average), 0), 5),
    review_count: Math.max(Number(product.review_count || 0), 0),
    attribute_tag: product.attribute_tag || null,
    weight_grams: product.weight_grams ? toNumber(product.weight_grams) : null,
    images: normalizeImages(product.product_images),
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

function normalizeBannerImage(row: DbBannerImageRow): BannerImage {
  return {
    id: row.id,
    eyebrow: row.eyebrow || "",
    title: row.title,
    description: row.description || "",
    imageUrl: row.image_url,
    imageAlt: row.image_alt || row.title,
    primaryCtaLabel: row.primary_cta_label || "Shop Now",
    primaryCtaHref: row.primary_cta_href || row.href || "/products",
    secondaryCtaLabel: row.secondary_cta_label || "",
    secondaryCtaHref: row.secondary_cta_href || "",
    href: row.href || row.primary_cta_href || "/products",
    discountBadgeText: row.discount_badge_text || "",
    showDiscountBadge: Boolean(row.show_discount_badge && row.discount_badge_text),
    display_order: Number(row.display_order || 0),
    is_active: Boolean(row.is_active ?? true),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeOrderItem(item: DbOrderItem): OrderItem {
  const price = toNumber(item.price);
  const total = item.total ? toNumber(item.total) : price * item.quantity;

  return {
    id: item.id,
    order_id: item.order_id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image,
    price,
    quantity: item.quantity,
    total,
  };
}

function normalizeReview(review: DbReview): Review {
  let mediaUrls: unknown = [];
  try {
    mediaUrls = Array.isArray(review.media_urls)
      ? review.media_urls
      : typeof review.media_urls === "string"
        ? JSON.parse(review.media_urls || "[]")
        : [];
  } catch {
    mediaUrls = [];
  }

  return {
    id: review.id,
    product_id: review.product_id,
    review_target: review.review_target === "company" ? "company" : "product",
    user_id: review.user_id,
    customer_name: review.customer_name,
    customer_email: review.customer_email,
    rating: review.rating,
    review_text: review.review_text,
    media_urls: Array.isArray(mediaUrls)
      ? mediaUrls.filter((url): url is string => typeof url === "string" && Boolean(url))
      : [],
    is_verified_purchase: Boolean(review.is_verified_purchase),
    created_at: review.created_at,
    updated_at: review.updated_at,
  };
}

const reviewEligibleOrderStatuses = [
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

function normalizeOrder(order: DbOrder): Order {
  return {
    id: order.id,
    user_id: order.user_id,
    order_number: order.order_number,
    customer_email: order.customer_email,
    status: order.status || "pending",
    subtotal: toNumber(order.subtotal),
    shipping_charge: toNumber(order.shipping_charge),
    total: toNumber(order.total),
    shipping_name: order.shipping_name,
    shipping_address: order.shipping_address,
    shipping_city: order.shipping_city,
    shipping_state: order.shipping_state,
    shipping_pincode: order.shipping_pincode,
    shipping_phone: order.shipping_phone,
    payment_method: order.payment_method,
    payment_status: order.payment_status || "pending",
    razorpay_order_id: order.razorpay_order_id,
    razorpay_payment_id: order.razorpay_payment_id,
    shiprocket_order_id: order.shiprocket_order_id
      ? String(order.shiprocket_order_id)
      : null,
    shiprocket_shipment_id: order.shiprocket_shipment_id
      ? String(order.shiprocket_shipment_id)
      : null,
    shiprocket_awb_code: order.shiprocket_awb_code,
    shiprocket_courier_name: order.shiprocket_courier_name,
    notes: order.notes,
    items: (order.order_items || []).map(normalizeOrderItem),
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

function applyProductFilters(products: Product[], params: ProductsQueryParams) {
  const query = params.q?.trim().toLowerCase();
  let result = [...products];

  if (!params.includeInactive) {
    result = result.filter((product) => product.is_active);
  }

  if (params.ids?.length) {
    const ids = new Set(params.ids);
    result = result.filter((product) => ids.has(product.id));
  }

  if (params.category) {
    result = result.filter((product) => product.category?.slug === params.category);
  }

  if (params.attribute_tag) {
    result = result.filter((product) => product.attribute_tag === params.attribute_tag);
  }

  if (params.min_price) {
    result = result.filter((product) => product.price >= Number(params.min_price));
  }

  if (params.max_price) {
    result = result.filter((product) => product.price <= Number(params.max_price));
  }

  if (params.min_rating) {
    result = result.filter(
      (product) => product.rating_average >= Number(params.min_rating)
    );
  }

  if (query) {
    result = result.filter((product) =>
      [product.name, product.description, product.category?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }

  switch (params.sort) {
    case "price_asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "featured":
      result.sort(numberFeaturedFirst);
      break;
    case "name":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "rating_desc":
      result.sort((a, b) => b.rating_average - a.rating_average);
      break;
    case "reviews_desc":
      result.sort((a, b) => b.review_count - a.review_count);
      break;
    default:
      result.sort((a, b) =>
        String(b.created_at || "").localeCompare(String(a.created_at || ""))
      );
  }

  const page = Math.max(Number(params.page || 1), 1);
  const limit = Math.max(Number(params.limit || result.length || 24), 1);
  const start = (page - 1) * limit;

  return result.slice(start, start + limit);
}

function numberFeaturedFirst(a: Product, b: Product) {
  return Number(b.is_featured) - Number(a.is_featured);
}

function toDateTimeString(date = new Date()) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function placeholders(values: unknown[]) {
  return values.map(() => "?").join(", ");
}

function toDbBoolean(value: boolean | undefined) {
  return value ? 1 : 0;
}

function productCategoryFromRow(row: DbProductRow) {
  if (!row.category_name || !row.category_slug) return null;

  return {
    id: row.category_id || row.category_slug,
    name: row.category_name,
    slug: row.category_slug,
  };
}

function buildUpdate(
  patch: Record<string, unknown>,
  fieldMap: Record<string, string>
) {
  const assignments: string[] = [];
  const values: QueryValue[] = [];

  Object.entries(fieldMap).forEach(([inputKey, dbColumn]) => {
    if (!(inputKey in patch)) return;

    const value = patch[inputKey];
    if (value === undefined) return;

    assignments.push(`${dbColumn} = ?`);
    values.push(value as QueryValue);
  });

  return { assignments, values };
}

async function hydrateOrders(rows: DbOrderRow[]) {
  if (!rows.length) return [];

  const orderIds = rows.map((order) => order.id);
  const itemRows = await queryRows<DbOrderItemRow[]>(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders(orderIds)})
     ORDER BY id`,
    orderIds
  );
  const itemsByOrder = new Map<string, DbOrderItem[]>();

  itemRows.forEach((item) => {
    if (!item.order_id) return;
    const items = itemsByOrder.get(item.order_id) || [];
    items.push(item);
    itemsByOrder.set(item.order_id, items);
  });

  return rows.map((order) =>
    normalizeOrder({
      ...order,
      order_items: itemsByOrder.get(order.id) || [],
    })
  );
}

async function loadProductImages(productIds: string[]) {
  if (!productIds.length) return new Map<string, DbProductImage[]>();

  const imageRows = await queryRows<DbProductImageRow[]>(
    `SELECT * FROM product_images
     WHERE product_id IN (${placeholders(productIds)})
     ORDER BY display_order ASC`,
    productIds
  );
  const imagesByProduct = new Map<string, DbProductImage[]>();

  imageRows.forEach((image) => {
    const images = imagesByProduct.get(image.product_id) || [];
    images.push(image);
    imagesByProduct.set(image.product_id, images);
  });

  return imagesByProduct;
}

export async function getCategories(): Promise<Category[]> {
  if (!getDatabasePool()) return demoCategories;

  try {
    const rows = await queryRows<DbCategoryRow[]>(
      "SELECT * FROM categories ORDER BY display_order ASC, name ASC"
    );
    return rows as Category[];
  } catch {
    return demoCategories;
  }
}

export async function getBannerImages(options: { includeInactive?: boolean } = {}) {
  if (!getDatabasePool()) return [];

  const where = options.includeInactive ? "" : "WHERE is_active = 1";
  const rows = await queryRows<DbBannerImageRow[]>(
    `SELECT * FROM banner_images ${where} ORDER BY display_order ASC, created_at ASC`
  );
  return rows.map(normalizeBannerImage);
}

export async function createBannerImage(input: CreateBannerImageInput) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const id = randomUUID();
  await executeQuery(
    `INSERT INTO banner_images
      (
        id, eyebrow, title, description, image_url, image_alt,
        primary_cta_label, primary_cta_href, secondary_cta_label,
        secondary_cta_href, href, discount_badge_text, show_discount_badge,
        display_order, is_active, created_at, updated_at
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      input.eyebrow || null,
      input.title,
      input.description || null,
      input.imageUrl,
      input.imageAlt || input.title,
      input.primaryCtaLabel || "Shop Now",
      input.primaryCtaHref || input.href || "/products",
      input.secondaryCtaLabel || null,
      input.secondaryCtaHref || null,
      input.href || input.primaryCtaHref || "/products",
      input.discountBadgeText?.trim() || null,
      input.showDiscountBadge && input.discountBadgeText?.trim() ? 1 : 0,
      Number(input.display_order || 0),
      input.is_active === false ? 0 : 1,
    ]
  );

  const rows = await queryRows<DbBannerImageRow[]>(
    "SELECT * FROM banner_images WHERE id = ? LIMIT 1",
    [id]
  );
  return normalizeBannerImage(rows[0]);
}

export async function updateBannerImage(
  id: string,
  patch: Partial<CreateBannerImageInput>
) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const dbPatch = {
    eyebrow: patch.eyebrow,
    title: patch.title,
    description: patch.description,
    image_url: patch.imageUrl,
    image_alt: patch.imageAlt,
    primary_cta_label: patch.primaryCtaLabel,
    primary_cta_href: patch.primaryCtaHref,
    secondary_cta_label: patch.secondaryCtaLabel,
    secondary_cta_href: patch.secondaryCtaHref,
    href: patch.href,
    discount_badge_text: patch.discountBadgeText,
    show_discount_badge:
      patch.showDiscountBadge === undefined
        ? undefined
        : patch.showDiscountBadge && patch.discountBadgeText?.trim()
          ? 1
          : 0,
    display_order:
      patch.display_order === undefined ? undefined : Number(patch.display_order || 0),
    is_active:
      patch.is_active === undefined ? undefined : patch.is_active === false ? 0 : 1,
  };
  const { assignments, values } = buildUpdate(dbPatch, {
    eyebrow: "eyebrow",
    title: "title",
    description: "description",
    image_url: "image_url",
    image_alt: "image_alt",
    primary_cta_label: "primary_cta_label",
    primary_cta_href: "primary_cta_href",
    secondary_cta_label: "secondary_cta_label",
    secondary_cta_href: "secondary_cta_href",
    href: "href",
    discount_badge_text: "discount_badge_text",
    show_discount_badge: "show_discount_badge",
    display_order: "display_order",
    is_active: "is_active",
  });

  if (!assignments.length) return null;

  await executeQuery(
    `UPDATE banner_images SET ${assignments.join(", ")} WHERE id = ?`,
    [...values, id]
  );
  const rows = await queryRows<DbBannerImageRow[]>(
    "SELECT * FROM banner_images WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ? normalizeBannerImage(rows[0]) : null;
}

export async function deleteBannerImage(id: string) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());
  await executeQuery("DELETE FROM banner_images WHERE id = ?", [id]);
}

export async function createCategory(input: CreateCategoryInput) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const id = randomUUID();
  const slug = input.slug || generateSlug(input.name);

  await executeQuery(
    `INSERT INTO categories
      (id, name, slug, description, image_url, display_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      input.name,
      slug,
      input.description || null,
      input.image_url || null,
      Number(input.display_order || 0),
    ]
  );

  const rows = await queryRows<DbCategoryRow[]>(
    "SELECT * FROM categories WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] as Category;
}

export async function updateCategory(
  id: string,
  patch: Partial<CreateCategoryInput>
) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const { assignments, values } = buildUpdate(patch, {
    name: "name",
    slug: "slug",
    description: "description",
    image_url: "image_url",
    display_order: "display_order",
  });

  if (!assignments.length) return;

  await executeQuery(
    `UPDATE categories SET ${assignments.join(", ")} WHERE id = ?`,
    [...values, id]
  );
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (!getDatabasePool()) {
    return demoCategories.find((category) => category.id === id) || null;
  }

  const rows = await queryRows<DbCategoryRow[]>(
    "SELECT * FROM categories WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

export async function deleteCategory(id: string) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());
  await executeQuery("DELETE FROM categories WHERE id = ?", [id]);
}

export async function getProducts(
  params: ProductsQueryParams = {}
): Promise<Product[]> {
  if (!getDatabasePool()) {
    return applyProductFilters(demoProducts, params);
  }

  try {
    const rows = await queryRows<DbProductRow[]>(
      `SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC
       LIMIT 200`
    );
    const imagesByProduct = await loadProductImages(rows.map((row) => row.id));
    const products = rows.map((row) =>
      normalizeProduct({
        ...row,
        category: productCategoryFromRow(row),
        product_images: imagesByProduct.get(row.id) || [],
      })
    );

    return applyProductFilters(products, params);
  } catch {
    return applyProductFilters(demoProducts, params);
  }
}

export async function getProductBySlug(slug: string) {
  const products = await getProducts({ includeInactive: false, limit: 200 });
  return products.find((product) => product.slug === slug) || null;
}

export async function getProductBySlugIncludingInactive(slug: string) {
  const products = await getProducts({ includeInactive: true, limit: 300 });
  return products.find((product) => product.slug === slug) || null;
}

export async function getProductById(id: string) {
  const products = await getProducts({ ids: [id], includeInactive: true, limit: 1 });
  return products[0] || null;
}

export async function getRelatedProducts(product: Product) {
  if (!product.category?.slug) return [];

  const products = await getProducts({
    category: product.category.slug,
    limit: 5,
  });

  return products.filter((item) => item.id !== product.id).slice(0, 4);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [orders, products] = await Promise.all([
    getOrders(),
    getProducts({ includeInactive: true, limit: 200 }),
  ]);

  return {
    total_orders: orders.length,
    total_revenue: orders.reduce((sum, order) => sum + order.total, 0),
    total_products: products.length,
    total_customers: new Set(orders.map((order) => order.customer_email)).size,
    recent_orders: orders.slice(0, 5),
    low_stock_products: products
      .filter((product) => product.stock_quantity <= 10)
      .sort((a, b) => a.stock_quantity - b.stock_quantity)
      .slice(0, 8),
  };
}

export async function getOrders(): Promise<Order[]> {
  if (!getDatabasePool()) return demoOrders;

  try {
    const rows = await queryRows<DbOrderRow[]>(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    return hydrateOrders(rows);
  } catch {
    return demoOrders;
  }
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  if (!getDatabasePool()) return [];

  try {
    const rows = await queryRows<DbOrderRow[]>(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return hydrateOrders(rows);
  } catch {
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!getDatabasePool()) {
    return demoOrders.find((order) => order.id === id) || null;
  }

  const rows = await queryRows<DbOrderRow[]>(
    "SELECT * FROM orders WHERE id = ? LIMIT 1",
    [id]
  );

  if (!rows.length) return null;
  const orders = await hydrateOrders(rows);
  return orders[0] || null;
}

export async function getOrderByIdOrNumber(value: string): Promise<Order | null> {
  if (!getDatabasePool()) {
    return (
      demoOrders.find(
        (order) => order.id === value || order.order_number === value
      ) || null
    );
  }

  const rows = await queryRows<DbOrderRow[]>(
    "SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
    [value, value]
  );

  if (!rows.length) return null;
  const orders = await hydrateOrders(rows);
  return orders[0] || null;
}

export async function createProduct(input: CreateProductInput) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const id = randomUUID();
  const slug = input.slug || generateSlug(input.name);

  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO products
        (
          id, name, slug, description, price, original_price, category_id,
          stock_quantity, is_active, is_featured, rating_average, review_count,
          attribute_tag, weight_grams,
          created_at, updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        input.name,
        slug,
        input.description || null,
        input.price,
        input.original_price || null,
        input.category_id || null,
        input.stock_quantity,
        toDbBoolean(input.is_active),
        toDbBoolean(input.is_featured),
        Math.min(Math.max(Number(input.rating_average || 0), 0), 5),
        Math.max(Number(input.review_count || 0), 0),
        input.attribute_tag || null,
        input.weight_grams || null,
      ]
    );

    if (input.images?.length) {
      await Promise.all(
        input.images.map((imageUrl, index) =>
          connection.execute(
            `INSERT INTO product_images
              (id, product_id, image_url, is_primary, display_order)
             VALUES (?, ?, ?, ?, ?)`,
            [randomUUID(), id, imageUrl, index === 0 ? 1 : 0, index]
          )
        )
      );
    }
  });

  const products = await getProducts({ ids: [id], includeInactive: true });
  const product = products[0];
  if (!product) throw new Error("Product was not created");
  return product;
}

export async function updateProduct(
  id: string,
  patch: Partial<CreateProductInput>
) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const normalizedPatch = {
    ...patch,
    is_active:
      typeof patch.is_active === "boolean" ? toDbBoolean(patch.is_active) : undefined,
    is_featured:
      typeof patch.is_featured === "boolean"
        ? toDbBoolean(patch.is_featured)
        : undefined,
    rating_average:
      patch.rating_average === undefined
        ? undefined
        : Math.min(Math.max(Number(patch.rating_average || 0), 0), 5),
    review_count:
      patch.review_count === undefined
        ? undefined
        : Math.max(Number(patch.review_count || 0), 0),
  };
  const { assignments, values } = buildUpdate(normalizedPatch, {
    name: "name",
    slug: "slug",
    description: "description",
    price: "price",
    original_price: "original_price",
    category_id: "category_id",
    stock_quantity: "stock_quantity",
    is_active: "is_active",
    is_featured: "is_featured",
    rating_average: "rating_average",
    review_count: "review_count",
    attribute_tag: "attribute_tag",
    weight_grams: "weight_grams",
  });

  await withTransaction(async (connection) => {
    if (assignments.length) {
      await connection.execute(
        `UPDATE products
         SET ${assignments.join(", ")}, updated_at = NOW()
         WHERE id = ?`,
        [...values, id]
      );
    }

    if (Array.isArray(patch.images)) {
      await connection.execute("DELETE FROM product_images WHERE product_id = ?", [id]);
      await Promise.all(
        patch.images
          .map((imageUrl) => imageUrl.trim())
          .filter(Boolean)
          .map((imageUrl, index) =>
            connection.execute(
              `INSERT INTO product_images
                (id, product_id, image_url, is_primary, display_order, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
              [randomUUID(), id, imageUrl, index === 0 ? 1 : 0, index]
            )
          )
      );
    }
  });
}

export async function deleteProduct(id: string) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());
  await executeQuery("DELETE FROM products WHERE id = ?", [id]);
}

export async function createSupportTicket(
  input: CreateSupportTicketInput & { user_id?: string | null }
) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const name = input.customer_name.trim();
  const email = input.customer_email.trim().toLowerCase();
  const subject = input.subject.trim();
  const message = input.message.trim();
  const orderId = input.order_id?.trim() || null;
  let orderNumber = input.order_number?.trim() || null;

  if (!name || !email || !subject || !message) {
    throw new Error("Name, email, subject, and message are required.");
  }

  if (orderId) {
    const order = await getOrderById(orderId);
    if (!order) throw new Error("Selected order was not found.");
    const ownsOrder =
      (input.user_id && order.user_id === input.user_id) ||
      order.customer_email?.toLowerCase() === email;
    if (!ownsOrder) throw new Error("Selected order does not belong to this customer.");
    orderNumber = order.order_number;
  }

  const id = randomUUID();
  await executeQuery(
    `INSERT INTO support_tickets
      (
        id, user_id, order_id, customer_name, customer_email, phone, order_number,
        subject, message, media_urls, status, created_at, updated_at
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW(), NOW())`,
    [
      id,
      input.user_id || null,
      orderId,
      name,
      email,
      input.phone?.trim() || null,
      orderNumber,
      subject,
      message,
      JSON.stringify(input.media_urls || []),
    ]
  );

  const rows = await queryRows<DbSupportTicketRow[]>(
    "SELECT * FROM support_tickets WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0];
}

export async function requestOrderRefund(orderId: string, userId: string) {
  const order = await getOrderById(orderId);
  if (!order || order.user_id !== userId) {
    throw new Error("Order not found.");
  }

  const refundableStatuses: Order["status"][] = [
    "confirmed",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
  ];
  if (!refundableStatuses.includes(order.status)) {
    throw new Error("Refund can be requested only for active or delivered orders.");
  }

  await updateOrder(order.id, { status: "refund_requested" });
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  if (!getDatabasePool()) return [];
  return queryRows<DbAdminUserRow[]>(
    `SELECT id, username, full_name, role, created_at, updated_at
     FROM admin_users
     ORDER BY created_at DESC`
  );
}

export async function createAdminUser(input: CreateAdminUserInput) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const username = input.username.trim();
  const password = input.password.trim();
  const allowedRoles: AdminRole[] = [
    "super_admin",
    "admin",
    "client_admin",
    "seller_admin",
  ];

  if (!username || !password) {
    throw new Error("Username and password are required.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  if (!allowedRoles.includes(input.role)) {
    throw new Error("Invalid admin role.");
  }

  const id = randomUUID();
  await executeQuery(
    `INSERT INTO admin_users
      (id, username, full_name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      username,
      input.full_name?.trim() || username,
      hashPassword(password),
      input.role,
    ]
  );

  const rows = await queryRows<DbAdminUserRow[]>(
    `SELECT id, username, full_name, role, created_at, updated_at
     FROM admin_users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function updateAdminUser(
  id: string,
  patch: Partial<Omit<CreateAdminUserInput, "username">>
) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const allowedRoles: AdminRole[] = [
    "super_admin",
    "admin",
    "client_admin",
    "seller_admin",
  ];
  if (patch.role && !allowedRoles.includes(patch.role)) {
    throw new Error("Invalid admin role.");
  }

  const dbPatch = {
    full_name: patch.full_name?.trim(),
    role: patch.role,
    password_hash: patch.password ? hashPassword(patch.password.trim()) : undefined,
  };
  const { assignments, values } = buildUpdate(dbPatch, {
    full_name: "full_name",
    role: "role",
    password_hash: "password_hash",
  });
  if (!assignments.length) return null;

  await executeQuery(
    `UPDATE admin_users SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = ?`,
    [...values, id]
  );
  const rows = await queryRows<DbAdminUserRow[]>(
    `SELECT id, username, full_name, role, created_at, updated_at
     FROM admin_users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function deleteAdminUser(id: string) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());
  await executeQuery("DELETE FROM admin_users WHERE id = ?", [id]);
}

export async function getSupportTickets() {
  if (!getDatabasePool()) return [];

  const tickets = await queryRows<DbSupportTicketRow[]>(
    "SELECT * FROM support_tickets ORDER BY created_at DESC"
  );
  return hydrateSupportTickets(tickets, "admin");
}

export async function getSupportTicketsByUserId(userId: string) {
  if (!getDatabasePool()) return [];

  const tickets = await queryRows<DbSupportTicketRow[]>(
    `SELECT *
     FROM support_tickets
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return hydrateSupportTickets(tickets, "customer");
}

export async function getSupportTicketById(
  id: string,
  viewer: "admin" | "customer",
  userId?: string
) {
  if (!getDatabasePool()) return null;

  const rows = await queryRows<DbSupportTicketRow[]>(
    viewer === "customer"
      ? "SELECT * FROM support_tickets WHERE id = ? AND user_id = ? LIMIT 1"
      : "SELECT * FROM support_tickets WHERE id = ? LIMIT 1",
    viewer === "customer" ? [id, userId || ""] : [id]
  );
  const tickets = await hydrateSupportTickets(rows, viewer);
  return tickets[0] || null;
}

export async function updateSupportTicket(
  id: string,
  patch: { status?: SupportTicketStatus; admin_notes?: string | null }
) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const { assignments, values } = buildUpdate(patch, {
    status: "status",
    admin_notes: "admin_notes",
  });
  if (!assignments.length) return null;

  await executeQuery(
    `UPDATE support_tickets SET ${assignments.join(", ")} WHERE id = ?`,
    [...values, id]
  );
  const rows = await queryRows<DbSupportTicketRow[]>(
    "SELECT * FROM support_tickets WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function hydrateSupportTickets(
  tickets: DbSupportTicketRow[],
  viewer: "admin" | "customer"
) {
  if (!tickets.length) return [];

  const ids = tickets.map((ticket) => ticket.id);
  const placeholders = ids.map(() => "?").join(", ");
  const visibilityClause =
    viewer === "customer" ? " AND visibility = 'public'" : "";
  const replies = await queryRows<DbSupportTicketReplyRow[]>(
    `SELECT *
     FROM support_ticket_replies
     WHERE ticket_id IN (${placeholders})${visibilityClause}
     ORDER BY created_at ASC`,
    ids
  );
  const repliesByTicket = new Map<string, SupportTicketReply[]>();
  for (const reply of replies) {
    const list = repliesByTicket.get(reply.ticket_id) || [];
    list.push({
      ...reply,
      media_urls: parseJsonArray(reply.media_urls),
    });
    repliesByTicket.set(reply.ticket_id, list);
  }

  return tickets.map((ticket) => ({
    ...ticket,
    media_urls: parseJsonArray(ticket.media_urls),
    replies: repliesByTicket.get(ticket.id) || [],
  }));
}

export async function createSupportTicketReply(input: {
  ticket_id: string;
  author_type: "customer" | "admin";
  author_name?: string | null;
  visibility?: SupportReplyVisibility;
  message: string;
  media_urls?: string[];
  user_id?: string | null;
}) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const message = input.message.trim();
  if (!message) throw new Error("Reply message is required.");

  const ticketRows = await queryRows<DbSupportTicketRow[]>(
    "SELECT * FROM support_tickets WHERE id = ? LIMIT 1",
    [input.ticket_id]
  );
  const ticket = ticketRows[0];
  if (!ticket) throw new Error("Support ticket not found.");
  if (input.author_type === "customer" && ticket.user_id !== input.user_id) {
    throw new Error("Support ticket not found.");
  }

  const visibility =
    input.author_type === "customer" ? "public" : input.visibility || "public";
  const id = randomUUID();
  await executeQuery(
    `INSERT INTO support_ticket_replies
      (id, ticket_id, author_type, author_name, visibility, message, media_urls, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      input.ticket_id,
      input.author_type,
      input.author_name?.trim() || null,
      visibility,
      message,
      JSON.stringify(input.media_urls || []),
    ]
  );

  if (input.author_type === "customer" && ticket.status === "resolved") {
    await updateSupportTicket(ticket.id, { status: "open" });
  }

  const rows = await queryRows<DbSupportTicketReplyRow[]>(
    "SELECT * FROM support_ticket_replies WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0]
    ? {
        ...rows[0],
        media_urls: parseJsonArray(rows[0].media_urls),
      }
    : null;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const productIds = input.items.map((item) => item.product_id);
  const products = await getProducts({ ids: productIds, limit: productIds.length });

  if (products.length !== productIds.length) {
    throw new Error("Some cart products are no longer available.");
  }

  const items = input.items.map((item) => {
    const product = products.find((entry) => entry.id === item.product_id);
    if (!product) throw new Error("Product not found.");
    if (product.stock_quantity < item.quantity) {
      throw new Error(`${product.name} has only ${product.stock_quantity} in stock.`);
    }

    return {
      product_id: product.id,
      product_name: product.name,
      product_image: product.images[0]?.image_url || null,
      price: product.price,
      quantity: item.quantity,
      total: product.price * item.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const siteConfig = await getSiteConfig();
  const shippingCharge =
    subtotal >= siteConfig.shipping.freeAbove ? 0 : siteConfig.shipping.standardCharge;
  const total = subtotal + shippingCharge;
  const now = toDateTimeString();
  const orderNumber = generateOrderNumber();

  if (!getDatabasePool()) {
    return {
      id: randomUUID(),
      order_number: orderNumber,
      user_id: input.user_id,
      customer_email: input.customer_email,
      status: "pending",
      subtotal,
      shipping_charge: shippingCharge,
      total,
      shipping_name: input.shipping_name,
      shipping_address: input.shipping_address,
      shipping_city: input.shipping_city,
      shipping_state: input.shipping_state,
      shipping_pincode: input.shipping_pincode,
      shipping_phone: input.shipping_phone,
      payment_method: input.payment_method,
      payment_status: "pending",
      notes: input.notes,
      items,
      created_at: now,
      updated_at: now,
    };
  }

  const orderId = randomUUID();
  const insertedItems = await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO orders
        (
          id, user_id, order_number, customer_email, status, subtotal, shipping_charge,
          total, shipping_name, shipping_address, shipping_city, shipping_state,
          shipping_pincode, shipping_phone, payment_method, payment_status,
          notes, created_at, updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        orderId,
        input.user_id || null,
        orderNumber,
        input.customer_email,
        "pending",
        subtotal,
        shippingCharge,
        total,
        input.shipping_name,
        input.shipping_address,
        input.shipping_city,
        input.shipping_state,
        input.shipping_pincode,
        input.shipping_phone,
        input.payment_method,
        "pending",
        input.notes || null,
      ]
    );

    const orderItems = items.map((item) => ({
      id: randomUUID(),
      order_id: orderId,
      ...item,
    }));

    await Promise.all(
      orderItems.map((item) =>
        connection.execute(
          `INSERT INTO order_items
            (
              id, order_id, product_id, product_name, product_image,
              price, quantity, total
            )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.order_id,
            item.product_id,
            item.product_name,
            item.product_image,
            item.price,
            item.quantity,
            item.total,
          ]
        )
      )
    );

    await Promise.all(
      input.items.map((item) =>
        connection.execute(
          `UPDATE products
           SET stock_quantity = GREATEST(stock_quantity - ?, 0),
               updated_at = NOW()
           WHERE id = ?`,
          [item.quantity, item.product_id]
        )
      )
    );

    return orderItems;
  });

  return normalizeOrder({
    id: orderId,
    user_id: input.user_id,
    order_number: orderNumber,
    customer_email: input.customer_email,
    status: "pending",
    subtotal,
    shipping_charge: shippingCharge,
    total,
    shipping_name: input.shipping_name,
    shipping_address: input.shipping_address,
    shipping_city: input.shipping_city,
    shipping_state: input.shipping_state,
    shipping_pincode: input.shipping_pincode,
    shipping_phone: input.shipping_phone,
    payment_method: input.payment_method,
    payment_status: "pending",
    notes: input.notes,
    order_items: insertedItems,
    created_at: now,
    updated_at: now,
  });
}

export async function updateOrder(
  id: string,
  patch: Partial<
    Pick<
      Order,
      | "status"
      | "payment_method"
      | "payment_status"
      | "razorpay_order_id"
      | "razorpay_payment_id"
      | "shiprocket_order_id"
      | "shiprocket_shipment_id"
      | "shiprocket_awb_code"
      | "shiprocket_courier_name"
    >
  >
) {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const normalizedPatch = {
    ...patch,
    payment_status:
      patch.payment_status === undefined && patch.status === "refunded"
        ? "refunded"
        : patch.payment_status,
  };

  const { assignments, values } = buildUpdate(normalizedPatch, {
    status: "status",
    payment_method: "payment_method",
    payment_status: "payment_status",
    razorpay_order_id: "razorpay_order_id",
    razorpay_payment_id: "razorpay_payment_id",
    shiprocket_order_id: "shiprocket_order_id",
    shiprocket_shipment_id: "shiprocket_shipment_id",
    shiprocket_awb_code: "shiprocket_awb_code",
    shiprocket_courier_name: "shiprocket_courier_name",
  });

  if (!assignments.length) return;

  await executeQuery(
    `UPDATE orders
     SET ${assignments.join(", ")}, updated_at = NOW()
     WHERE id = ?`,
    [...values, id]
  );
}

export async function getReviews(productId: string): Promise<Review[]> {
  if (!getDatabasePool()) {
    return demoReviews.filter(
      (review) =>
        review.review_target === "product" && review.product_id === productId
    );
  }

  try {
    const rows = await queryRows<DbReviewRow[]>(
      "SELECT * FROM reviews WHERE review_target = 'product' AND product_id = ? ORDER BY created_at DESC",
      [productId]
    );
    return rows.map(normalizeReview);
  } catch {
    return [];
  }
}

export async function getCompanyReviews(params: {
  minRating?: number;
  limit?: number;
} = {}): Promise<Review[]> {
  const minRating = Math.min(Math.max(Number(params.minRating || 4), 1), 5);
  const limit = Math.min(Math.max(Number(params.limit || 3), 1), 12);

  if (!getDatabasePool()) {
    return demoReviews
      .filter(
        (review) =>
          review.review_target === "company" && review.rating >= minRating
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  try {
    const rows = await queryRows<DbReviewRow[]>(
      `SELECT *
       FROM reviews
       WHERE review_target = 'company' AND rating >= ?
       ORDER BY rating DESC, created_at DESC
       LIMIT ?`,
      [minRating, limit]
    );
    return rows.map(normalizeReview);
  } catch {
    return [];
  }
}

export async function createReview(input: {
  product_id?: string | null;
  review_target?: "product" | "company";
  user_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  rating: number;
  review_text?: string | null;
  media_urls?: string[];
}): Promise<Review> {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const id = randomUUID();
  const now = toDateTimeString();
  const reviewTarget = input.review_target === "company" ? "company" : "product";

  await executeQuery(
    `INSERT INTO reviews
      (id, product_id, review_target, user_id, customer_name, customer_email, rating, review_text, media_urls, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      reviewTarget === "product" ? input.product_id || null : null,
      reviewTarget,
      input.user_id || null,
      input.customer_name || null,
      input.customer_email || null,
      input.rating,
      input.review_text || null,
      JSON.stringify(input.media_urls || []),
      now,
      now,
    ]
  );

  if (reviewTarget === "product" && input.product_id) {
    await updateProductRating(input.product_id);
  }

  const rows = await queryRows<DbReviewRow[]>(
    "SELECT * FROM reviews WHERE id = ? LIMIT 1",
    [id]
  );
  return normalizeReview(rows[0]);
}

export async function getReviewById(id: string): Promise<Review | null> {
  if (!getDatabasePool()) return null;

  const rows = await queryRows<DbReviewRow[]>(
    "SELECT * FROM reviews WHERE id = ? LIMIT 1",
    [id]
  );

  return rows[0] ? normalizeReview(rows[0]) : null;
}

export async function updateReview(
  id: string,
  patch: {
    rating?: number;
    review_text?: string | null;
    media_urls?: string[];
  }
): Promise<Review> {
  if (!getDatabasePool()) throw new Error(getDatabaseSetupMessage());

  const normalizedPatch = {
    rating:
      patch.rating === undefined
        ? undefined
        : Math.min(Math.max(Number(patch.rating || 0), 1), 5),
    review_text: patch.review_text,
    media_urls:
      patch.media_urls === undefined ? undefined : JSON.stringify(patch.media_urls),
  };
  const { assignments, values } = buildUpdate(normalizedPatch, {
    rating: "rating",
    review_text: "review_text",
    media_urls: "media_urls",
  });

  if (!assignments.length) {
    const existing = await getReviewById(id);
    if (!existing) throw new Error("Review not found.");
    return existing;
  }

  await executeQuery(
    `UPDATE reviews
     SET ${assignments.join(", ")}, updated_at = NOW()
     WHERE id = ?`,
    [...values, id]
  );

  const review = await getReviewById(id);
  if (!review) throw new Error("Review not found.");

  if (review.review_target === "product" && review.product_id) {
    await updateProductRating(review.product_id);
  }

  return review;
}

async function updateProductRating(productId: string) {
  if (!getDatabasePool()) return;

  try {
    // Calculate new average rating and count
    const [result] = await queryRows(
      `SELECT
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(*) as review_count
       FROM reviews
       WHERE review_target = 'product' AND product_id = ?`,
      [productId]
    ) as [{ avg_rating: number; review_count: number }];

    const avgRating = Math.round(result.avg_rating * 10) / 10; // Round to 1 decimal
    const reviewCount = result.review_count;

    await executeQuery(
      `UPDATE products
       SET rating_average = ?, review_count = ?, updated_at = NOW()
       WHERE id = ?`,
      [avgRating, reviewCount, productId]
    );
  } catch (error) {
    console.error("Failed to update product rating:", error);
  }
}

export async function checkUserCanReview(
  productId: string | null,
  userId?: string | null,
  email?: string | null,
  windowDays = 30,
  reviewTarget: "product" | "company" = "product"
): Promise<{
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  isWithinReviewWindow: boolean;
  reviewId?: string | null;
  canEditReview: boolean;
  reviewEditableUntil?: string | null;
  eligibleUntil?: string | null;
}> {
  if (!getDatabasePool()) {
    return {
      canReview: false,
      hasPurchased: false,
      hasReviewed: false,
      isWithinReviewWindow: false,
      reviewId: null,
      canEditReview: false,
      reviewEditableUntil: null,
      eligibleUntil: null,
    };
  }

  try {
    let hasReviewed = false;
    let hasPurchased = false;
    let reviewId: string | null = null;
    let reviewCreatedAt: string | null = null;
    let eligibleUntil: string | null = null;
    const boundedWindowDays = Math.max(1, Math.floor(windowDays));

    if (userId) {
      const reviewRows = await queryRows<DbReviewRow[]>(
        reviewTarget === "product"
          ? "SELECT id, created_at FROM reviews WHERE review_target = 'product' AND product_id = ? AND user_id = ? LIMIT 1"
          : "SELECT id, created_at FROM reviews WHERE review_target = 'company' AND user_id = ? LIMIT 1",
        reviewTarget === "product" ? [productId, userId] : [userId]
      );
      hasReviewed = reviewRows.length > 0;
      reviewId = reviewRows[0]?.id || null;
      reviewCreatedAt = reviewRows[0]?.created_at ? String(reviewRows[0].created_at) : null;

      const purchaseRows = await queryRows(
        reviewTarget === "product"
          ? `SELECT
              DATE_ADD(COALESCE(o.updated_at, o.created_at), INTERVAL ? DAY) AS eligible_until
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = ?
               AND o.user_id = ?
               AND o.status IN (${reviewEligibleOrderStatuses.map(() => "?").join(", ")})
               AND DATE_ADD(COALESCE(o.updated_at, o.created_at), INTERVAL ? DAY) >= NOW()
             ORDER BY COALESCE(o.updated_at, o.created_at) DESC
             LIMIT 1`
          : `SELECT
              DATE_ADD(COALESCE(o.updated_at, o.created_at), INTERVAL ? DAY) AS eligible_until
             FROM orders o
             WHERE o.user_id = ?
               AND o.status IN (${reviewEligibleOrderStatuses.map(() => "?").join(", ")})
               AND DATE_ADD(COALESCE(o.updated_at, o.created_at), INTERVAL ? DAY) >= NOW()
             ORDER BY COALESCE(o.updated_at, o.created_at) DESC
             LIMIT 1`,
        reviewTarget === "product"
          ? [
              boundedWindowDays,
              productId,
              userId,
              ...reviewEligibleOrderStatuses,
              boundedWindowDays,
            ]
          : [
              boundedWindowDays,
              userId,
              ...reviewEligibleOrderStatuses,
              boundedWindowDays,
            ]
      ) as Array<{ eligible_until?: string | Date | null }>;
      hasPurchased = purchaseRows.length > 0;
      const rawEligibleUntil = purchaseRows[0]?.eligible_until;
      eligibleUntil = rawEligibleUntil ? String(rawEligibleUntil) : null;
    } else if (email) {
      const reviewRows = await queryRows<DbReviewRow[]>(
        reviewTarget === "product"
          ? "SELECT id, created_at FROM reviews WHERE review_target = 'product' AND product_id = ? AND customer_email = ? LIMIT 1"
          : "SELECT id, created_at FROM reviews WHERE review_target = 'company' AND customer_email = ? LIMIT 1",
        reviewTarget === "product" ? [productId, email] : [email]
      );
      hasReviewed = reviewRows.length > 0;
      reviewId = reviewRows[0]?.id || null;
      reviewCreatedAt = reviewRows[0]?.created_at ? String(reviewRows[0].created_at) : null;
    }

    const siteConfig = await getSiteConfig();
    const editWindowDays = Math.max(
      1,
      Math.floor(siteConfig.reviews.reviewEditWindowDays)
    );
    const reviewEditableUntil = reviewCreatedAt
      ? new Date(
          new Date(reviewCreatedAt).getTime() + editWindowDays * 24 * 60 * 60 * 1000
        ).toISOString()
      : null;
    const canEditReview = Boolean(
      siteConfig.reviews.allowReviewEdits &&
        reviewId &&
        reviewEditableUntil &&
        new Date(reviewEditableUntil).getTime() >= Date.now()
    );

    return {
      canReview: Boolean(userId) && hasPurchased && !hasReviewed,
      hasPurchased,
      hasReviewed,
      isWithinReviewWindow: hasPurchased,
      reviewId,
      canEditReview,
      reviewEditableUntil,
      eligibleUntil,
    };
  } catch {
    return {
      canReview: false,
      hasPurchased: false,
      hasReviewed: false,
      isWithinReviewWindow: false,
      reviewId: null,
      canEditReview: false,
      reviewEditableUntil: null,
      eligibleUntil: null,
    };
  }
}

export async function getReviewableProductIdsForUser(userId: string, windowDays: number) {
  if (!getDatabasePool()) return new Map<string, string | null>();

  try {
    const boundedWindowDays = Math.max(1, Math.floor(windowDays));
    const rows = await queryRows<Array<RowDataPacket & { product_id: string; eligible_until?: string | Date | null }>>(
      `SELECT
        oi.product_id,
        MAX(DATE_ADD(COALESCE(o.updated_at, o.created_at), INTERVAL ? DAY)) AS eligible_until
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN reviews r
         ON r.review_target = 'product'
        AND r.product_id = oi.product_id
        AND r.user_id = o.user_id
       WHERE o.user_id = ?
         AND o.status IN (${reviewEligibleOrderStatuses.map(() => "?").join(", ")})
         AND DATE_ADD(COALESCE(o.updated_at, o.created_at), INTERVAL ? DAY) >= NOW()
         AND r.id IS NULL
       GROUP BY oi.product_id`,
      [boundedWindowDays, userId, ...reviewEligibleOrderStatuses, boundedWindowDays]
    );

    return new Map(
      rows
        .filter((row) => row.product_id)
        .map((row) => [
          row.product_id,
          row.eligible_until ? String(row.eligible_until) : null,
        ])
    );
  } catch {
    return new Map<string, string | null>();
  }
}

export async function getEditableProductReviewIdsForUser(
  userId: string,
  editWindowDays: number
) {
  if (!getDatabasePool()) return new Map<string, { reviewId: string; editableUntil: string | null }>();

  try {
    const boundedEditWindowDays = Math.max(1, Math.floor(editWindowDays));
    const rows = await queryRows<
      Array<
        RowDataPacket & {
          product_id: string;
          review_id: string;
          editable_until?: string | Date | null;
        }
      >
    >(
      `SELECT
        product_id,
        id AS review_id,
        DATE_ADD(created_at, INTERVAL ? DAY) AS editable_until
       FROM reviews
       WHERE review_target = 'product'
         AND user_id = ?
         AND product_id IS NOT NULL
         AND DATE_ADD(created_at, INTERVAL ? DAY) >= NOW()`,
      [boundedEditWindowDays, userId, boundedEditWindowDays]
    );

    return new Map(
      rows
        .filter((row) => row.product_id && row.review_id)
        .map((row) => [
          row.product_id,
          {
            reviewId: row.review_id,
            editableUntil: row.editable_until ? String(row.editable_until) : null,
          },
        ])
    );
  } catch {
    return new Map<string, { reviewId: string; editableUntil: string | null }>();
  }
}
