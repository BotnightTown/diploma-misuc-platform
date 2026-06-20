import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { verifyAccessToken } from "../utils/token.utils.ts";
import { redis } from "../config/redis.ts";
import { ProblemDocument } from "../models/error.model.ts";
import { TokenPayload } from "../utils/token.utils.ts";

declare module "fastify" {
  interface FastifyRequest {
    user: TokenPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ProblemDocument(401, "Unauthorized", "Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);

  let payload: TokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ProblemDocument(401, "Unauthorized", "Access token is invalid or expired");
  }

  const isBlacklisted = await redis.get(`blacklist:${payload.jti}`);
  if (isBlacklisted) {
    throw new ProblemDocument(401, "Unauthorized", "Access token has been revoked");
  }

  request.user = payload;
}
