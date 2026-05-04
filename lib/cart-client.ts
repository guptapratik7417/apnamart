"use client";

import { useEffect, useSyncExternalStore } from "react";
import { defaultSiteConfig } from "@/config/app-properties";
import type { CartLine, Product, SiteConfig } from "@/types";

const CART_KEY = "apnamart_cart";
const CART_SESSION_KEY = "apnamart_cart_session_id";
export const CART_UPDATED_EVENT = "apnamart-cart-updated";

const EMPTY_CART_LINES: CartLine[] = [];

let cartSnapshot: CartLine[] = EMPTY_CART_LINES;
let cartSnapshotRaw: string | null = null;
let hasLoadedServerCart = false;

function emitCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

function subscribeCart(callback: () => void) {
  window.addEventListener(CART_UPDATED_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getCartLines(): CartLine[] {
  if (typeof window === "undefined") return EMPTY_CART_LINES;

  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (raw === cartSnapshotRaw) return cartSnapshot;
    cartSnapshotRaw = raw;

    if (!raw) {
      cartSnapshot = EMPTY_CART_LINES;
      return cartSnapshot;
    }

    const parsed = JSON.parse(raw) as CartLine[];
    cartSnapshot = Array.isArray(parsed) ? parsed : EMPTY_CART_LINES;
    return cartSnapshot;
  } catch {
    cartSnapshotRaw = null;
    cartSnapshot = EMPTY_CART_LINES;
    return cartSnapshot;
  }
}

export function saveCartLines(lines: CartLine[]) {
  cartSnapshot = lines.map((line) => ({ ...line }));
  cartSnapshotRaw = JSON.stringify(cartSnapshot);
  window.localStorage.setItem(CART_KEY, cartSnapshotRaw);
  emitCartUpdated();
}

function clearLocalCart() {
  cartSnapshot = EMPTY_CART_LINES;
  cartSnapshotRaw = null;
  window.localStorage.removeItem(CART_KEY);
  emitCartUpdated();
}

export function clearCart() {
  clearLocalCart();
  void clearServerCart();
}

export async function isCustomerLoggedIn() {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) return false;

  const payload = (await response.json()) as { user?: unknown };
  return Boolean(payload.user);
}

export async function addProductToCart(product: Product, quantity: number) {
  if (!(await isCustomerLoggedIn())) return false;

  const lines = getCartLines().map((line) => ({ ...line }));
  const existing = lines.find((line) => line.product_id === product.id);
  const safeQuantity = Math.max(1, Math.min(quantity, product.stock_quantity));

  if (existing) {
    existing.quantity = Math.min(
      existing.quantity + safeQuantity,
      product.stock_quantity
    );
  } else {
    lines.push({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      stock_quantity: product.stock_quantity,
      image_url: product.images[0]?.image_url,
      attribute_tag: product.attribute_tag,
      weight_grams: product.weight_grams,
      quantity: safeQuantity,
    });
  }

  saveCartLines(lines);
  await saveServerCart(lines);
  return true;
}

export function updateCartQuantity(productId: string, quantity: number) {
  const lines = getCartLines()
    .map((line) =>
      line.product_id === productId
        ? {
            ...line,
            quantity: Math.max(1, Math.min(quantity, line.stock_quantity)),
          }
        : line
    )
    .filter((line) => line.quantity > 0);

  saveCartLines(lines);
  void saveServerCart(lines);
}

export function removeCartLine(productId: string) {
  const lines = getCartLines().filter((line) => line.product_id !== productId);
  saveCartLines(lines);
  void saveServerCart(lines);
}

export function getCartCount() {
  return getCartLines().reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartSubtotal(lines = getCartLines()) {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function getShippingCharge(
  subtotal: number,
  shipping: SiteConfig["shipping"] = defaultSiteConfig.shipping
) {
  return subtotal >= shipping.freeAbove || subtotal === 0
    ? 0
    : shipping.standardCharge;
}

export function useCartLines() {
  useCartServerSync();
  return useSyncExternalStore(subscribeCart, getCartLines, () => EMPTY_CART_LINES);
}

export function useCartCount() {
  const lines = useCartLines();
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartSessionId() {
  let sessionId = window.localStorage.getItem(CART_SESSION_KEY);
  if (sessionId) return sessionId;

  sessionId =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(CART_SESSION_KEY, sessionId);
  return sessionId;
}

async function readServerCart() {
  const response = await fetch(
    `/api/cart?session_id=${encodeURIComponent(getCartSessionId())}`,
    { cache: "no-store" }
  );

  if (response.status === 401) {
    clearLocalCart();
    return [];
  }

  if (!response.ok) return null;

  const payload = (await response.json()) as { items?: CartLine[] };
  return Array.isArray(payload.items) ? payload.items : null;
}

export async function refreshCartFromServer() {
  const serverLines = await readServerCart();
  if (serverLines) saveCartLines(serverLines);
  return serverLines || [];
}

async function saveServerCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;

  const response = await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getCartSessionId(),
      items: lines.map((line) => ({
        product_id: line.product_id,
        quantity: line.quantity,
      })),
    }),
  });

  if (response.status === 401) {
    clearLocalCart();
    return;
  }

  if (!response.ok) return;

  const payload = (await response.json()) as { items?: CartLine[] };
  if (Array.isArray(payload.items)) {
    saveCartLines(payload.items);
  }
}

async function clearServerCart() {
  if (typeof window === "undefined") return;

  await fetch("/api/cart", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: getCartSessionId() }),
  });
}

function useCartServerSync() {
  useEffect(() => {
    if (hasLoadedServerCart) return;
    hasLoadedServerCart = true;

    async function sync() {
      const serverLines = await readServerCart();
      if (!serverLines) return;

      saveCartLines(serverLines);
    }

    void sync();
  }, []);
}
