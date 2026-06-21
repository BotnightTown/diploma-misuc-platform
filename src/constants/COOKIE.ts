import { env } from "../config/env.ts";

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 60 * 60 * 24 * 7,
};
