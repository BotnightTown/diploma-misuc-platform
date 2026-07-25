import { FastifyInstance } from "fastify";
import { UserRepository } from "./user.repository.ts";
import { UserService } from "./user.service.ts";
import { UserController } from "./user.controller.ts";
import { authenticate } from "../../plugins/authenticate.ts";
import { authorizeSelf } from "../../plugins/authorize-self.ts";
import { FollowType } from "./user.schema.ts";

export const userRoutes = async (fastify: FastifyInstance) => {
  const repository = new UserRepository();
  const service = new UserService(repository);
  const controller = new UserController(service);

  fastify.addHook("preHandler", authenticate);

  fastify.get("/users/:userId", controller.getUserInfo.bind(controller));

  fastify.patch(
    "/users/:userId/username",
    { preHandler: authorizeSelf },
    controller.updateUsername.bind(controller),
  );
  fastify.patch(
    "/users/:userId/bio",
    { preHandler: authorizeSelf },
    controller.updateBio.bind(controller),
  );
  fastify.patch(
    "/users/:userId/avatar",
    { preHandler: authorizeSelf },
    controller.updateAvatar.bind(controller),
  );
  fastify.patch(
    "/users/:userId/email",
    { preHandler: authorizeSelf },
    controller.changeEmail.bind(controller),
  );
  fastify.patch(
    "/users/:userId/password",
    { preHandler: authorizeSelf },
    controller.changePassword.bind(controller),
  );
  fastify.delete(
    "/users/:userId",
    { preHandler: authorizeSelf },
    controller.deleteUser.bind(controller),
  );
  fastify.get("/users/:userId/followers", controller.getFollowers.bind(controller));
  fastify.get("/users/:userId/following", controller.getFollowing.bind(controller));
  fastify.post<{ Params: { userId: number }; Body: FollowType }>(
    "/users/:userId/follow",
    { preHandler: authorizeSelf },
    controller.followUser.bind(controller),
  );
  fastify.delete<{ Params: { userId: number }; Body: FollowType }>(
    "/users/:userId/follow",
    { preHandler: authorizeSelf },
    controller.unfollowUser.bind(controller),
  );
};
