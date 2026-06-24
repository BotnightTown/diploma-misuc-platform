import { FastifyInstance } from "fastify";
import { UserRepository } from "./user.repository.ts";
import { UserService } from "./user.service.ts";
import { UserController } from "./user.controller.ts";
import { authenticate } from "../../plugins/authenticate.ts";

export const userRoutes = async (fastify: FastifyInstance) => {
  const repository = new UserRepository();
  const service = new UserService(repository);
  const controller = new UserController(service);

  fastify.addHook("preHandler", authenticate);

  fastify.get("/user/:userId", controller.getUserInfo.bind(controller));
  fastify.patch("/user/:userId/username", controller.updateUsername.bind(controller));
  fastify.patch("/user/:userId/bio", controller.updateBio.bind(controller));
  fastify.patch("/user/:userId/avatar", controller.updateAvatar.bind(controller));
  fastify.patch("/user/:userId/email", controller.changeEmail.bind(controller));
  fastify.patch("/user/:userId/password", controller.changePassword.bind(controller));
  fastify.delete("/user/:userId", controller.deleteUser.bind(controller));
};
