import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getServiceMode,
  isAdminApiPath,
  isApiDocsPath,
  isIntegrationApiPath,
  isInternalApiPath,
  isProviderApiPath,
} from "@/lib/service-mode";

const storefrontApiPrefixes = [
  "/api/auth",
  "/api/cart",
  "/api/orders",
  "/api/payments",
  "/api/pincode",
  "/api/products",
  "/api/categories",
  "/api/reviews",
  "/api/site-config",
];

const adminApiPrefixes = [
  "/api/admin",
  "/api/products",
  "/api/categories",
  "/api/orders",
  "/api/shiprocket",
  "/api/site-config",
];

function isStorefrontPage(pathname: string) {
  return !pathname.startsWith("/admin") && !pathname.startsWith("/api");
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAllowed(pathname: string, mode: ReturnType<typeof getServiceMode>) {
  if (mode === "all" || isApiDocsPath(pathname)) return true;

  if (mode === "storefront") {
    return isStorefrontPage(pathname) || startsWithAny(pathname, storefrontApiPrefixes);
  }

  if (mode === "admin") {
    return pathname.startsWith("/admin") || startsWithAny(pathname, adminApiPrefixes);
  }

  if (mode === "api") {
    return isInternalApiPath(pathname) && !isAdminApiPath(pathname) && !isProviderApiPath(pathname);
  }

  if (mode === "integrations") {
    return isIntegrationApiPath(pathname);
  }

  return true;
}

function blockedResponse(request: NextRequest, mode: ReturnType<typeof getServiceMode>) {
  const payload = {
    error: "Service route disabled",
    serviceMode: mode,
    path: request.nextUrl.pathname,
  };

  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json(payload, { status: 404 });
  }

  return new NextResponse(
    `This route is disabled while SERVICE_MODE=${mode}.`,
    {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }
  );
}

export function proxy(request: NextRequest) {
  const mode = getServiceMode();
  const { pathname } = request.nextUrl;

  if (!isAllowed(pathname, mode)) {
    return blockedResponse(request, mode);
  }

  const response = NextResponse.next();
  response.headers.set("x-apnamart-service-mode", mode);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|css|js|map|txt|xml)$).*)",
  ],
};
