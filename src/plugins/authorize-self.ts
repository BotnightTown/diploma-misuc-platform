import { FastifyRequest, FastifyReply } from "fastify";
import { ProblemDocument } from "../models/error.model.ts";

export async function authorizeSelf(
  request: FastifyRequest<{ Params: { userId: number } }>,
  reply: FastifyReply,
): Promise<void> {
  const targetUserId = Number(request.params.userId);

  if (request.user.sub !== targetUserId) {
    throw new ProblemDocument(
      403,
      "Forbidden",
      "You do not have permission to modify this resource",
    );
  }
}
