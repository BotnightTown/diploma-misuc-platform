import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "../utils/token.utils.ts";
import { redis } from "../config/redis.ts";

export async function optionalAuthenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return;

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    const isBlacklisted = await redis.get(`blacklist:${payload.jti}`);
    if (!isBlacklisted) {
      request.user = payload;
    }
  } catch {}
}
