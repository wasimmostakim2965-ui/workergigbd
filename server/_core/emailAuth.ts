import { COOKIE_NAME, ONE_DAY_MS } from "@shared/const";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const BCRYPT_ROUNDS = 10;
const EMAIL_VERIFY_TTL_MS = 1000 * 60 * 60 * 24; // 24h to click the verification link

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function checkPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Mints the 24h session JWT and sets it as the session cookie on the response. */
export async function issueSession(res: Response, req: Request, openId: string, name: string) {
  const token = await sdk.signSession(
    { openId, appId: ENV.appId, name },
    { expiresInMs: ONE_DAY_MS }
  );
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_DAY_MS });
}

export function generateEmailVerifyToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

/**
 * Stub for sending the verification email. Wire this up to a real provider
 * (Resend, SES, Nodemailer+SMTP, etc.) before going to production — for now
 * it just logs the link so you can test the flow end-to-end locally.
 */
export async function sendVerificationEmail(email: string, token: string) {
  const link = `/verify-email?token=${token}`;
  console.log(`[EmailAuth] Verification link for ${email}: ${link}`);
  // TODO: replace with real transactional email send.
}

export async function createEmailAccountAndSession(
  req: Request,
  res: Response,
  params: { name: string; email: string; password: string }
) {
  const email = params.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new Error("INVALID_EMAIL");
  }
  if (params.password.length < 8) {
    throw new Error("WEAK_PASSWORD");
  }

  const passwordHash = await hashPassword(params.password);
  const openId = `email_${crypto.randomUUID()}`;

  const user = await db.createEmailUser({
    openId,
    name: params.name.trim(),
    email,
    passwordHash,
  });
  if (!user) throw new Error("USER_CREATE_FAILED");

  // Withdrawals are gated on verified email, but the user can use the rest of
  // the site (browse/complete jobs) immediately — no confirmation code at signup.
  const verifyToken = generateEmailVerifyToken();
  await db.setEmailVerifyToken(user.id, verifyToken, new Date(Date.now() + EMAIL_VERIFY_TTL_MS));
  await sendVerificationEmail(email, verifyToken);

  await issueSession(res, req, openId, user.name || "");
  return user;
}

export async function loginWithEmail(
  req: Request,
  res: Response,
  params: { email: string; password: string }
) {
  const email = params.email.trim().toLowerCase();
  const user = await db.getUserByEmail(email);
  if (!user || !user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const ok = await checkPassword(params.password, user.passwordHash);
  if (!ok) {
    throw new Error("INVALID_CREDENTIALS");
  }
  await db.touchLastSignedIn(user.id);
  await issueSession(res, req, user.openId, user.name || "");
  return user;
}
