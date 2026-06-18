import { FastifyInstance } from "fastify";
import { UserRepository } from "./user.repository.ts";
import { UserService } from "./user.service.ts";
import { UserController } from "./user.controller.ts";

export const userRoutes = async (fastify: FastifyInstance) => {
  const repository = new UserRepository();
  const service = new UserService(repository);
  const controller = new UserController(service);

  fastify.patch(
    "/user/username/:userId",
    controller.updateUsername.bind(controller),
  );
};
