import { FastifyInstance } from "fastify";
import { authRoutes } from "./modules/auth/auth.routes.ts";
import { userRoutes } from "./modules/users/user.routes.ts";

export const apiRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(authRoutes);
  await fastify.register(userRoutes);
};
