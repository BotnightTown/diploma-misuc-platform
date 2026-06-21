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
import { REFRESH_COOKIE_OPTIONS } from "../../constants/COOKIE.ts";
import { ProblemDocument } from "../../models/error.model.ts";

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
    reply.setCookie("refresh_token", refresh_token, REFRESH_COOKIE_OPTIONS);
    return reply.status(200).send({
      access_token,
      ...createHateoasResponse(user, loginLinks(user.id)),
    });
  }

  async refreshTokens(request: FastifyRequest<{ Body: RefreshTokenType }>, reply: FastifyReply) {
    const rawRefreshToken = request.cookies.refresh_token;
    if (!rawRefreshToken) {
      throw new ProblemDocument(401, "Unauthorized", "Refresh token cookie is missing");
    }
    const { access_token, refresh_token } = await this.service.refreshTokens(rawRefreshToken);
    reply.setCookie("refresh_token", refresh_token, REFRESH_COOKIE_OPTIONS);
    return reply.status(200).send(createHateoasResponse({ access_token }, refreshLinks()));
  }

  async logoutUser(request: FastifyRequest<{ Body: LogoutType }>, reply: FastifyReply) {
    const rawRefreshToken = request.cookies.refresh_token;
    if (!rawRefreshToken) {
      throw new ProblemDocument(401, "Unauthorized", "Refresh token cookie is missing");
    }

    const { access_token } = parseBody(logoutSchema, request.body);
    await this.service.logoutUser(rawRefreshToken, access_token);

    reply.clearCookie("refresh_token", { path: "/api/auth" });
    return reply.status(204).send();
  }
}
