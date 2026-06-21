import { FastifyRequest, FastifyReply } from "fastify";
import { ProblemDocument } from "../models/error.model.ts";

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.user.role !== "admin") {
    throw new ProblemDocument(403, "Forbidden", "Only administrators can perform this action");
  }
}
