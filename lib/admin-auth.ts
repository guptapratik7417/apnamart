import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2/promise";

import { appProperties, getAdminRuntimeProperties } from "@/config/app-properties";
import { getDatabasePool, queryRows } from "@/lib/mariadb";
import { verifyPassword } from "@/lib/customer-auth";
import type { AdminAccountConfig, AdminRole } from "@/types";

export type AdminSession = AdminAccountConfig;

type DbAdminUserRow = RowDataPacket & {
  id: string;
  username: string;
  full_name?: string | null;
  password_hash?: string | null;
  role: AdminRole;
};

function sessionSecret() {
  return getAdminRuntimeProperties().sessionSecret;
}

function sign(value: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error(appProperties.admin.sessionSecretMissingMessage);
  return createHmac("sha256", secret).update(value).digest("hex");
}

function isValidSignature(value: string, signature: string) {
  if (!sessionSecret()) return false;
  const expected = sign(value);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  return left.length === right.length && timingSafeEqual(left, right);
}

function adminAccounts(): AdminAccountConfig[] {
  const runtime = getAdminRuntimeProperties();
  const accounts: AdminAccountConfig[] = [];

  if (runtime.password) {
    accounts.push({
      username: runtime.username || "admin",
      role: "super_admin",
      displayName: "Super Admin",
    });
  }

  if (runtime.readUsername && runtime.readPassword) {
    accounts.push({
      username: runtime.readUsername,
      role: "admin",
      displayName: "Admin",
    });
  }

  return accounts;
}

function passwordFor(username: string) {
  const runtime = getAdminRuntimeProperties();
  if (username === (runtime.username || "admin")) return runtime.password;
  if (username === runtime.readUsername) return runtime.readPassword;
  return "";
}

async function adminUserByUsername(username: string) {
  if (!getDatabasePool()) return null;

  const rows = await queryRows<DbAdminUserRow[]>(
    "SELECT * FROM admin_users WHERE username = ? LIMIT 1",
    [username.trim()]
  );

  return rows[0] || null;
}

export async function verifyAdminCredentials(input: {
  username: string;
  password: string;
}) {
  const username = input.username.trim();
  const dbUser = await adminUserByUsername(username).catch(() => null);

  if (dbUser) {
    if (dbUser.password_hash && verifyPassword(input.password, dbUser.password_hash)) {
      return {
        username: dbUser.username,
        role: dbUser.role,
        displayName: dbUser.full_name || dbUser.username,
      };
    }
    return null;
  }

  const account = adminAccounts().find((item) => item.username === username);
  const configuredPassword = account ? passwordFor(account.username) : "";

  if (!account || !configuredPassword || input.password !== configuredPassword) {
    return null;
  }

  return account;
}

export async function verifyAdminPassword(password: string) {
  const runtime = getAdminRuntimeProperties();
  if (!runtime.password || password !== runtime.password) return null;

  return {
    username: runtime.username || "admin",
    role: "super_admin" as AdminRole,
    displayName: "Super Admin",
  };
}

export async function createAdminSession(account: AdminAccountConfig) {
  const issuedAt = Date.now().toString();
  const payload = `${account.username}.${account.role}.${issuedAt}`;
  const cookieStore = await cookies();

  cookieStore.set(appProperties.admin.cookieName, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: getAdminRuntimeProperties().secureCookie,
    path: "/",
    maxAge: appProperties.admin.sessionSeconds,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(appProperties.admin.cookieName);
}

export async function isAdminSession() {
  return Boolean(await getAdminSession());
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(appProperties.admin.cookieName)?.value;
  if (!raw) return null;

  const [username, role, issuedAt, signature] = raw.split(".");
  const payload = `${username}.${role}.${issuedAt}`;
  if (
    !username ||
    !role ||
    !issuedAt ||
    !signature ||
    !["super_admin", "admin", "client_admin", "seller_admin"].includes(role) ||
    !isValidSignature(payload, signature)
  ) {
    return null;
  }

  const ageMs = Date.now() - Number(issuedAt);
  if (ageMs < 0 || ageMs >= appProperties.admin.sessionSeconds * 1000) {
    return null;
  }

  return {
    username,
    role: role as AdminRole,
    displayName:
      role === "super_admin"
        ? "Super Admin"
        : role === "client_admin"
          ? "Client Admin"
          : role === "seller_admin"
            ? "Seller Admin"
            : "Admin",
  };
}

export async function isSuperAdminSession() {
  const session = await getAdminSession();
  return session?.role === "super_admin";
}

export async function canManageCatalogSession() {
  const session = await getAdminSession();
  return Boolean(
    session &&
      ["super_admin", "client_admin", "seller_admin"].includes(session.role)
  );
}

export async function canManageSupportSession() {
  return Boolean(await getAdminSession());
}
