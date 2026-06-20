import { FastifyInstance } from "fastify";
import { AuthRepository } from "./auth.repository.ts";
import { AuthService } from "./auth.service.ts";
import { AuthController } from "./auth.controller.ts";

export const authRoutes = async (fastify: FastifyInstance) => {
  const repository = new AuthRepository();
  const service = new AuthService(repository);
  const controller = new AuthController(service);

  fastify.post("/auth/register", controller.registerUser.bind(controller));
  fastify.post("/auth/login", controller.loginUser.bind(controller));
  fastify.post("/auth/refresh", controller.refreshTokens.bind(controller));
  fastify.post("/auth/logout", controller.logoutUser.bind(controller));
};
