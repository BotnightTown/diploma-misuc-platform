import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service.ts";
import {
  createUserSchema,
  CreateUserType,
  loginUserSchema,
  LoginUserType,
  logoutSchema,
  LogoutType,
  refreshTokenSchema,
  RefreshTokenType,
} from "./auth.schema.ts";
import { parseBody } from "../../utils/controller.utils.ts";
import {
  createHateoasResponse,
  loginLinks,
  refreshLinks,
  registerLinks,
} from "../../utils/hateoas.utils.ts";

export class AuthController {
  constructor(private service: AuthService) {}

  async registerUser(request: FastifyRequest<{ Body: CreateUserType }>, reply: FastifyReply) {
    const data = parseBody(createUserSchema, request.body);
    const newUser = await this.service.registerUser(data);
    return reply.status(201).send(createHateoasResponse(newUser, registerLinks()));
  }

  async loginUser(request: FastifyRequest<{ Body: LoginUserType }>, reply: FastifyReply) {
    const data = parseBody(loginUserSchema, request.body);
    const { access_token, refresh_token, user } = await this.service.loginUser(data);
    return reply.status(200).send({
      access_token,
      refresh_token,
      ...createHateoasResponse(user, loginLinks(user.id)),
    });
  }

  async refreshTokens(request: FastifyRequest<{ Body: RefreshTokenType }>, reply: FastifyReply) {
    const { refresh_token } = parseBody(refreshTokenSchema, request.body);
    const tokens = await this.service.refreshTokens(refresh_token);
    return reply.status(200).send(createHateoasResponse(tokens, refreshLinks()));
  }

  async logoutUser(request: FastifyRequest<{ Body: LogoutType }>, reply: FastifyReply) {
    const { refresh_token, access_token } = parseBody(logoutSchema, request.body);
    await this.service.logoutUser(refresh_token, access_token);
    return reply.status(204).send();
  }
}
