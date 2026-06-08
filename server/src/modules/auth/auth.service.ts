import { User } from "@prisma/client";
import { PublicUser } from "@devboard/shared";
import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../lib/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  newJti,
  hashToken,
} from "../../lib/jwt";
import { ttlToMs } from "../../lib/cookies";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

export const toPublicUser = (u: User): PublicUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  createdAt: u.createdAt.toISOString(),
});

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

/** Issue a fresh access token + a rotated refresh token persisted (hashed). */
async function issueTokens(user: User): Promise<IssuedTokens> {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  const jti = newJti();
  const refreshToken = signRefreshToken({ sub: user.id, jti });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + ttlToMs(env.REFRESH_TOKEN_TTL)),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: PublicUser } & IssuedTokens> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser } & IssuedTokens> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Same error whether the email or the password is wrong (no user enumeration).
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

/**
 * Rotate a refresh token: verify signature, ensure the stored record exists
 * and is not revoked/expired, revoke it, and issue a new pair.
 *
 * Reuse detection: if a valid-signature token is presented but its stored
 * record is already revoked, every session for that user is revoked.
 */
export async function rotateRefreshToken(
  presentedToken: string
): Promise<{ user: PublicUser } & IssuedTokens> {
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(presentedToken);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const tokenHash = hashToken(presentedToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored) {
    throw ApiError.unauthorized("Refresh token not recognized");
  }

  if (stored.revokedAt) {
    // Token reuse — a previously rotated token was replayed. Nuke all sessions.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized("Refresh token reuse detected");
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized("Refresh token expired");
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw ApiError.unauthorized("User no longer exists");

  // Revoke the presented token, then issue a new pair (rotation).
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

/** Revoke a single refresh token (logout). Safe if it's unknown/missing. */
export async function logout(presentedToken?: string): Promise<void> {
  if (!presentedToken) return;
  const tokenHash = hashToken(presentedToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized("User no longer exists");
  return toPublicUser(user);
}
