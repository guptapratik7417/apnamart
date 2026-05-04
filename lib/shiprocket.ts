import {
  appProperties,
  getShiprocketRuntimeProperties,
} from "@/config/app-properties";
import type { Order } from "@/types";

type ShiprocketAuthResponse = {
  token?: string;
};

type ShiprocketCreateOrderResponse = {
  order_id?: string | number;
  shipment_id?: string | number;
  awb_code?: string;
  courier_name?: string;
  message?: string;
};

type ShiprocketServiceabilityResponse = {
  data?: unknown;
  message?: string;
};

type ShiprocketTrackResponse = {
  tracking_data?: unknown;
  message?: string;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

function hasShiprocketConfig() {
  const config = getShiprocketRuntimeProperties();
  return Boolean(config.email && config.password && config.pickupLocation);
}

function assertShiprocketConfig() {
  if (!hasShiprocketConfig()) {
    throw new Error(
      appProperties.shippingIntegrations.shiprocketMissingConfigMessage
    );
  }
}

async function shiprocketFetch<T>(
  path: string,
  options: RequestInit & { authenticated?: boolean } = {}
) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.authenticated) {
    headers.set("Authorization", `Bearer ${await getShiprocketToken()}`);
  }

  const response = await fetch(`${appProperties.shippingIntegrations.baseUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.message || appProperties.shippingIntegrations.requestFailedMessage
    );
  }

  return payload;
}

export async function getShiprocketToken() {
  assertShiprocketConfig();

  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const config = getShiprocketRuntimeProperties();
  const payload = await shiprocketFetch<ShiprocketAuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: config.email,
      password: config.password,
    }),
  });

  if (!payload.token) {
    throw new Error(appProperties.shippingIntegrations.missingTokenMessage);
  }

  tokenCache = {
    token: payload.token,
    expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
  };

  return payload.token;
}

function splitName(name?: string | null) {
  const fallbackName = appProperties.shippingIntegrations.defaultCustomerName;
  const parts = (name || fallbackName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || fallbackName,
    lastName: parts.slice(1).join(" "),
  };
}

function orderDate(value: string) {
  return new Date(value).toISOString().slice(0, 19).replace("T", " ");
}

function itemSku(itemName: string, index: number) {
  return itemName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 36) || `item-${index + 1}`;
}

export async function createShiprocketOrder(order: Order) {
  assertShiprocketConfig();

  const config = getShiprocketRuntimeProperties();
  const name = splitName(order.shipping_name);
  const paymentMethod =
    order.payment_method === "cod"
      ? appProperties.shippingIntegrations.codPaymentMethod
      : appProperties.shippingIntegrations.prepaidPaymentMethod;
  const weight = Math.max(config.defaultWeightKg, 0.1);

  const body = {
    order_id: order.order_number,
    order_date: orderDate(order.created_at),
    pickup_location: config.pickupLocation,
    ...(config.channelId ? { channel_id: config.channelId } : {}),
    billing_customer_name: name.firstName,
    billing_last_name: name.lastName,
    billing_address: order.shipping_address || "",
    billing_city: order.shipping_city || "",
    billing_pincode: order.shipping_pincode || "",
    billing_state: order.shipping_state || "",
    billing_country: appProperties.shippingIntegrations.billingCountry,
    billing_email: order.customer_email || "",
    billing_phone: order.shipping_phone || "",
    shipping_is_billing: true,
    order_items: order.items.map((item, index) => ({
      name: item.product_name,
      sku: item.product_id || itemSku(item.product_name, index),
      units: item.quantity,
      selling_price: item.price,
    })),
    payment_method: paymentMethod,
    sub_total: order.subtotal,
    length: config.defaultLengthCm,
    breadth: config.defaultBreadthCm,
    height: config.defaultHeightCm,
    weight,
  };

  return shiprocketFetch<ShiprocketCreateOrderResponse>("/orders/create/adhoc", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(body),
  });
}

export async function getShiprocketServiceability(input: {
  pickupPostcode?: string;
  deliveryPostcode: string;
  weight?: number;
  cod?: boolean;
}) {
  assertShiprocketConfig();

  const params = new URLSearchParams({
    delivery_postcode: input.deliveryPostcode,
    weight: String(input.weight || getShiprocketRuntimeProperties().defaultWeightKg),
    cod: input.cod ? "1" : "0",
  });

  if (input.pickupPostcode) {
    params.set("pickup_postcode", input.pickupPostcode);
  }

  return shiprocketFetch<ShiprocketServiceabilityResponse>(
    `/courier/serviceability/?${params.toString()}`,
    { authenticated: true }
  );
}

export async function trackShiprocketAwb(awbCode: string) {
  assertShiprocketConfig();

  return shiprocketFetch<ShiprocketTrackResponse>(
    `/courier/track/awb/${encodeURIComponent(awbCode)}`,
    { authenticated: true }
  );
}
