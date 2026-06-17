import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service.ts";
import { createUserSchema, CreateUserType } from "./auth.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";

export class AuthController {
  constructor(private service: AuthService) {}

  async registerUser(
    request: FastifyRequest<{ Body: CreateUserType }>,
    reply: FastifyReply,
  ): Promise<void> {
    const parseResult = createUserSchema.safeParse(request.body);

    if (!parseResult.success) {
      const errorDetails = parseResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");

      throw new ProblemDocument(
        400,
        "Validation failed",
        `The request body contains invalid data: ${errorDetails}`,
      );
    }

    const validationData = parseResult.data;
    const newUser = await this.service.registerUser(validationData);

    if (!newUser) {
      throw new ProblemDocument(
        409,
        "User Already Exists",
        "A user with this email is already registered",
      );
    }

    return reply.status(201).send({
      message: "Successfully create",
      data: newUser,
    });
  }
}
