import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "./user.service.ts";
import {
  changeEmailSchema,
  ChangeEmailType,
  changePasswordSchema,
  ChangePasswordType,
  followSchema,
  FollowType,
  paginationSchema,
  updateBioSchema,
  UpdateBioType,
  updateUsernameSchema,
  UpdateUsernameType,
} from "./user.schema.ts";
import {
  isMultipartRequest,
  parseBody,
  parseMultipartFormData,
  parseUserId,
} from "../../utils/controller.utils.ts";
import {
  createHateoasResponse,
  followersLinks,
  followingLinks,
  userMutationLinks,
  userProfileLinks,
} from "../../utils/hateoas.utils.ts";

export class UserController {
  constructor(private service: UserService) {}

  async getUserInfo(request: FastifyRequest<{ Params: { userId: number } }>, reply: FastifyReply) {
    const userId = parseUserId(request.params.userId);
    const userInfo = await this.service.getUserInfo(userId);
    return reply.status(200).send(createHateoasResponse(userInfo, userProfileLinks(userId)));
  }

  async updateUsername(
    request: FastifyRequest<{
      Params: { userId: number };
      Body: UpdateUsernameType;
    }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const data = parseBody(updateUsernameSchema, request.body);
    const updatedUser = await this.service.updateUsername(userId, data);
    return reply.status(200).send(createHateoasResponse(updatedUser, userMutationLinks(userId)));
  }

  async updateBio(
    request: FastifyRequest<{
      Params: { userId: number };
      Body: UpdateBioType;
    }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const data = parseBody(updateBioSchema, request.body);
    const updatedBio = await this.service.updateBio(userId, data);
    return reply.status(200).send(createHateoasResponse(updatedBio, userMutationLinks(userId)));
  }

  async updateAvatar(request: FastifyRequest<{ Params: { userId: number } }>, reply: FastifyReply) {
    const userId = parseUserId(request.params.userId);

    if (!isMultipartRequest(request)) {
      const updatedUser = await this.service.updateAvatar(userId, null);
      return reply.status(200).send(createHateoasResponse(updatedUser, userMutationLinks(userId)));
    }

    const { file } = await parseMultipartFormData(request);
    const updatedUser = await this.service.updateAvatar(userId, file);
    return reply.status(200).send(createHateoasResponse(updatedUser, userMutationLinks(userId)));
  }

  async changeEmail(
    request: FastifyRequest<{
      Params: { userId: number };
      Body: ChangeEmailType;
    }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const data = parseBody(changeEmailSchema, request.body);

    const updatedUser = await this.service.changeEmail(userId, data);
    return reply.status(200).send(createHateoasResponse(updatedUser, userMutationLinks(userId)));
  }

  async changePassword(
    request: FastifyRequest<{
      Params: { userId: number };
      Body: ChangePasswordType;
    }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const data = parseBody(changePasswordSchema, request.body);

    await this.service.changePassword(userId, data);
    return reply.status(204).send();
  }

  async deleteUser(request: FastifyRequest<{ Params: { userId: number } }>, reply: FastifyReply) {
    const userId = parseUserId(request.params.userId);
    await this.service.deleteUser(userId);
    return reply.status(204).send();
  }

  async getFollowers(
    request: FastifyRequest<{
      Params: { userId: number };
      Querystring: { page?: number; limit?: number };
    }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const { page, limit } = paginationSchema.parse(request.query);

    const { data, total } = await this.service.getFollowers(userId, { page, limit });
    const totalPages = Math.ceil(total / limit);

    return reply.status(200).send(
      createHateoasResponse(
        data,
        followersLinks(userId, page, totalPages) as Parameters<typeof createHateoasResponse>[1],
        {
          total,
          page,
          limit,
          totalPages,
        },
      ),
    );
  }

  async getFollowing(
    request: FastifyRequest<{
      Params: { userId: number };
      Querystring: { page?: number; limit?: number };
    }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const { page, limit } = paginationSchema.parse(request.query);

    const { data, total } = await this.service.getFollowing(userId, { page, limit });
    const totalPages = Math.ceil(total / limit);

    return reply.status(200).send(
      createHateoasResponse(
        data,
        followingLinks(userId, page, totalPages) as Parameters<typeof createHateoasResponse>[1],
        {
          total,
          page,
          limit,
          totalPages,
        },
      ),
    );
  }

  async followUser(
    request: FastifyRequest<{
      Params: { userId: number };
      Body: FollowType;
    }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const data = parseBody(followSchema, request.body);

    await this.service.followUser(userId, data.followingId);
    return reply.status(204).send();
  }

  async unfollowUser(
    request: FastifyRequest<{
      Params: { userId: number };
      Body: FollowType;
    }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const data = parseBody(followSchema, request.body);

    await this.service.unfollowUser(userId, data.followingId);
    return reply.status(204).send();
  }
}
