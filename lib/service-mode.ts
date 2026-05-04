export type ServiceMode = "all" | "storefront" | "admin" | "api" | "integrations";

export const serviceModes: ServiceMode[] = [
  "all",
  "storefront",
  "admin",
  "api",
  "integrations",
];

export function getServiceMode(value = process.env.SERVICE_MODE): ServiceMode {
  return serviceModes.includes(value as ServiceMode)
    ? (value as ServiceMode)
    : "all";
}

export function isApiDocsPath(pathname: string) {
  return pathname === "/api/docs" || pathname === "/api/openapi";
}

export function isIntegrationApiPath(pathname: string) {
  return pathname.startsWith("/api/integrations");
}

export function isAdminApiPath(pathname: string) {
  return pathname.startsWith("/api/admin");
}

export function isProviderApiPath(pathname: string) {
  return pathname.startsWith("/api/shiprocket");
}

export function isInternalApiPath(pathname: string) {
  return pathname.startsWith("/api") && !isIntegrationApiPath(pathname);
}
