import { FastifyInstance } from "fastify";
import { authRoutes } from "./modules/auth/auth.routes.ts";

export const apiRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(authRoutes);
};
