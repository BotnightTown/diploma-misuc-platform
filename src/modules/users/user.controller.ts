import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "./user.service.ts";
import {
  changeEmailSchema,
  ChangeEmailType,
  changePasswordSchema,
  ChangePasswordType,
  updateBioSchema,
  UpdateBioType,
  updateUsernameSchema,
  UpdateUsernameType,
} from "./user.schema.ts";
import { parseBody, parseUserId } from "../../utils/controller.utils.ts";

export class UserController {
  constructor(private service: UserService) {}

  async getUserInfo(
    request: FastifyRequest<{ Params: { userId: number } }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    const userInfo = await this.service.getUserInfo(userId);
    return reply.status(200).send({ data: userInfo });
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
    return reply
      .status(200)
      .send({ message: "Successfully updated", data: updatedUser });
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
    return reply
      .status(200)
      .send({ message: "Successfully updated", data: updatedBio });
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
    return reply
      .status(200)
      .send({ message: "Email successfully changed", data: updatedUser });
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

  async deleteUser(
    request: FastifyRequest<{ Params: { userId: number } }>,
    reply: FastifyReply,
  ) {
    const userId = parseUserId(request.params.userId);
    await this.service.deleteUser(userId);
    return reply.status(204).send();
  }
}
