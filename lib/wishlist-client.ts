"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { WishlistLine } from "@/types";

export const WISHLIST_UPDATED_EVENT = "apnamart-wishlist-updated";

const EMPTY_WISHLIST_LINES: WishlistLine[] = [];
let wishlistSnapshot: WishlistLine[] = EMPTY_WISHLIST_LINES;
let hasLoadedServerWishlist = false;

function emitWishlistUpdated() {
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
}

function subscribeWishlist(callback: () => void) {
  window.addEventListener(WISHLIST_UPDATED_EVENT, callback);
  return () => window.removeEventListener(WISHLIST_UPDATED_EVENT, callback);
}

export function getWishlistLines() {
  return wishlistSnapshot;
}

function saveWishlistLines(lines: WishlistLine[]) {
  wishlistSnapshot = lines.map((line) => ({ ...line }));
  emitWishlistUpdated();
}

export function initializeWishlistLines(lines: WishlistLine[]) {
  if (hasLoadedServerWishlist) return;
  hasLoadedServerWishlist = true;
  saveWishlistLines(lines);
}

async function readServerWishlist() {
  const response = await fetch("/api/wishlist", { cache: "no-store" });
  if (response.status === 401) {
    saveWishlistLines([]);
    return [];
  }
  if (!response.ok) return null;

  const payload = (await response.json()) as { items?: WishlistLine[] };
  return Array.isArray(payload.items) ? payload.items : null;
}

export async function refreshWishlistFromServer() {
  const serverLines = await readServerWishlist();
  if (serverLines) saveWishlistLines(serverLines);
  return serverLines || [];
}

export async function toggleWishlistProduct(productId: string) {
  const isWishlisted = wishlistSnapshot.some(
    (line) => line.product_id === productId
  );
  const response = await fetch("/api/wishlist", {
    method: isWishlisted ? "DELETE" : "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });

  if (response.status === 401) return false;
  if (!response.ok) return false;

  const payload = (await response.json()) as { items?: WishlistLine[] };
  if (Array.isArray(payload.items)) saveWishlistLines(payload.items);
  return true;
}

export function useWishlistLines() {
  useWishlistServerSync();
  return useSyncExternalStore(
    subscribeWishlist,
    getWishlistLines,
    () => EMPTY_WISHLIST_LINES
  );
}

export function useWishlistProduct(productId: string) {
  const lines = useWishlistLines();
  return lines.some((line) => line.product_id === productId);
}

function useWishlistServerSync() {
  useEffect(() => {
    if (hasLoadedServerWishlist) return;
    hasLoadedServerWishlist = true;
    void refreshWishlistFromServer();
  }, []);
}
