import { timingSafeEqual } from "crypto";

import {
  appProperties,
  getIntegrationRuntimeProperties,
} from "@/config/app-properties";

function extractToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return request.headers.get("x-api-key")?.trim() || "";
}

function secureCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function verifyIntegrationRequest(request: Request) {
  const expectedToken = getIntegrationRuntimeProperties().apiToken;
  if (!expectedToken) {
    return {
      ok: false,
      status: 503,
      error: appProperties.integrations.missingTokenMessage,
    };
  }

  const token = extractToken(request);
  if (!token || !secureCompare(token, expectedToken)) {
    return {
      ok: false,
      status: 401,
      error: appProperties.integrations.unauthorizedMessage,
    };
  }

  return { ok: true };
}
