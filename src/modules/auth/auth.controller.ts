import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service.ts";
import { createUserSchema, CreateUserType } from "./auth.schema.ts";
import { parseBody } from "../../utils/controller.utils.ts";

export class AuthController {
  constructor(private service: AuthService) {}

  async registerUser(
    request: FastifyRequest<{ Body: CreateUserType }>,
    reply: FastifyReply,
  ) {
    const data = parseBody(createUserSchema, request.body);
    const newUser = await this.service.registerUser(data);
    return reply
      .status(201)
      .send({ message: "Successfully created", data: newUser });
  }
}
