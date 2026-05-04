import {
  createHash,
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2/promise";

import { appProperties, getAdminRuntimeProperties } from "@/config/app-properties";
import { sendPasswordResetEmail } from "@/lib/email";
import { executeQuery, getDatabaseSetupMessage, queryRows } from "@/lib/mariadb";
import type { User } from "@/types";

const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = "sha256";

type DbUserRow = RowDataPacket & User & {
  password_hash?: string | null;
};

type DbPasswordResetTokenRow = RowDataPacket & {
  id: string;
  user_id: string;
};

export type CustomerSessionUser = Pick<
  User,
  "id" | "email" | "full_name" | "phone" | "role" | "created_at"
>;

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(
    password,
    salt,
    PASSWORD_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    PASSWORD_DIGEST
  ).toString("hex");

  return `${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;

  const [iterations, salt, hash] = storedHash.split(":");
  if (!iterations || !salt || !hash) return false;

  const candidate = pbkdf2Sync(
    password,
    salt,
    Number(iterations),
    PASSWORD_KEY_LENGTH,
    PASSWORD_DIGEST
  ).toString("hex");
  const left = Buffer.from(candidate);
  const right = Buffer.from(hash);

  return left.length === right.length && timingSafeEqual(left, right);
}

function publicUser(user: DbUserRow): CustomerSessionUser {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
  };
}

async function userByEmail(email: string) {
  const rows = await queryRows<DbUserRow[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [normalizeEmail(email)]
  );
  return rows[0] || null;
}

async function userById(id: string) {
  const rows = await queryRows<DbUserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}) {
  const email = normalizeEmail(input.email);
  if (!email || !input.password || !input.full_name.trim()) {
    throw new Error("Name, email, and password are required.");
  }
  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const existing = await userByEmail(email);
  if (existing) throw new Error("An account already exists for this email.");

  await executeQuery(
    `INSERT INTO users
      (id, email, full_name, phone, password_hash, role, created_at)
     VALUES (UUID(), ?, ?, ?, ?, 'customer', NOW())`,
    [
      email,
      input.full_name.trim(),
      input.phone?.trim() || null,
      hashPassword(input.password),
    ]
  );

  const user = await userByEmail(email);
  if (!user) throw new Error(getDatabaseSetupMessage());
  await createCustomerSession(user.id);
  return publicUser(user);
}

export async function loginCustomer(input: { email: string; password: string }) {
  const user = await userByEmail(input.email);
  if (!user || !verifyPassword(input.password, user.password_hash)) {
    throw new Error("Invalid email or password.");
  }

  await createCustomerSession(user.id);
  return publicUser(user);
}

export async function updateCustomerProfile(
  userId: string,
  input: { full_name: string; phone?: string }
) {
  const fullName = input.full_name.trim();
  const phone = input.phone?.trim() || null;

  if (!fullName) throw new Error("Name is required.");

  await executeQuery(
    "UPDATE users SET full_name = ?, phone = ? WHERE id = ? AND role = 'customer'",
    [fullName, phone, userId]
  );

  const user = await userById(userId);
  if (!user) throw new Error("Profile update failed.");
  return publicUser(user);
}

export async function requestPasswordReset(emailInput: string, origin: string) {
  await ensurePasswordResetStorage();

  const email = normalizeEmail(emailInput);
  const user = email ? await userByEmail(email) : null;
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(
    Date.now() + appProperties.customer.passwordResetMinutes * 60 * 1000
  );

  await executeQuery(
    `INSERT INTO password_reset_tokens
      (id, user_id, token_hash, expires_at, created_at)
     VALUES (UUID(), ?, ?, ?, NOW())`,
    [user.id, tokenHash, toMysqlDateTime(expiresAt)]
  );

  await sendPasswordResetEmail({
    to: email,
    resetUrl: `${origin}/reset-password?token=${token}`,
    expiresMinutes: appProperties.customer.passwordResetMinutes,
  });
}

export async function resetCustomerPassword(input: {
  token: string;
  password: string;
}) {
  await ensurePasswordResetStorage();

  if (!input.token || !input.password) {
    throw new Error("Reset token and new password are required.");
  }
  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const rows = await queryRows<DbPasswordResetTokenRow[]>(
    `SELECT id, user_id
     FROM password_reset_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [hashResetToken(input.token)]
  );
  const resetToken = rows[0];
  if (!resetToken) throw new Error("Reset link is invalid or expired.");

  await executeQuery(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [hashPassword(input.password), resetToken.user_id]
  );
  await executeQuery(
    "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?",
    [resetToken.id]
  );
  await createCustomerSession(resetToken.user_id);

  const user = await userById(resetToken.user_id);
  if (!user) throw new Error("Password reset completed, but login failed.");
  return publicUser(user);
}

export async function createCustomerSession(userId: string) {
  const issuedAt = Date.now().toString();
  const value = `${userId}.${issuedAt}`;
  const cookieStore = await cookies();

  cookieStore.set(appProperties.customer.cookieName, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: getAdminRuntimeProperties().secureCookie,
    path: "/",
    maxAge: appProperties.customer.sessionSeconds,
  });
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(appProperties.customer.cookieName);
}

export async function getCustomerSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(appProperties.customer.cookieName)?.value;
  if (!raw) return null;

  const [userId, issuedAt, signature] = raw.split(".");
  const value = `${userId}.${issuedAt}`;
  if (!userId || !issuedAt || !signature || !isValidSignature(value, signature)) {
    return null;
  }

  const ageMs = Date.now() - Number(issuedAt);
  if (ageMs < 0 || ageMs >= appProperties.customer.sessionSeconds * 1000) {
    return null;
  }

  const user = await userById(userId);
  return user ? publicUser(user) : null;
}

function toMysqlDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function ensurePasswordResetStorage() {
  await executeQuery(
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      token_hash VARCHAR(128) UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
  await executeQuery(
    "CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id)"
  );
  await executeQuery(
    "CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at)"
  );
}
