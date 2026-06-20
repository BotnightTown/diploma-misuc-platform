import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.ts";

const ACCESS_SECRET = env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const ACCESS_TTL = env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"];
const REFRESH_TTL = env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"];

export interface TokenPayload {
  sub: number;
  jti: string;
  exp?: number;
}

interface JwtTokenPayload extends jwt.JwtPayload {
  sub: string;
  jti: string;
}

function generateToken(
  userId: number,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
): string {
  const payload: JwtTokenPayload = {
    sub: String(userId),
    jti: crypto.randomUUID(),
  };

  return jwt.sign(payload, secret, { expiresIn });
}

function normalizeTokenPayload(payload: string | jwt.JwtPayload): TokenPayload {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string"
  ) {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }

  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new jwt.JsonWebTokenError("Invalid token subject");
  }

  return {
    sub: userId,
    jti: payload.jti,
  };
}

export function generateAccessToken(userId: number): string {
  return generateToken(userId, ACCESS_SECRET, ACCESS_TTL);
}

export function generateRefreshToken(userId: number): string {
  return generateToken(userId, REFRESH_SECRET, REFRESH_TTL);
}

export function verifyAccessToken(token: string): TokenPayload {
  return normalizeTokenPayload(jwt.verify(token, ACCESS_SECRET));
}

export function verifyRefreshToken(token: string): TokenPayload {
  return normalizeTokenPayload(jwt.verify(token, REFRESH_SECRET));
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
