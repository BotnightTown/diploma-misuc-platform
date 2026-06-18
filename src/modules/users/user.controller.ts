import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "./user.service.ts";
import { updateUsernameSchema, UpdateUsernameType } from "./user.schema.ts";
import { ProblemDocument } from "../../models/error.model.ts";

export class UserController {
  constructor(private service: UserService) {}

  async updateUsername(
    request: FastifyRequest<{
      Params: { userId: number };
      Body: UpdateUsernameType;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const parseResult = updateUsernameSchema.safeParse(request.body);

    if (!parseResult.success) {
      const errorDetails = parseResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");

      throw new ProblemDocument(
        400,
        "Validation Failed",
        `The request body contains invalid data: ${errorDetails}`,
      );
    }

    const userId = Number(request.params.userId);
    if (isNaN(userId)) {
      throw new ProblemDocument(400, "Bad Request", "Invalid user ID format");
    }
    const updatedUser = await this.service.updateUsername(
      userId,
      parseResult.data,
    );
    return reply
      .status(200)
      .send({ message: "Successfully updated", data: updatedUser });
  }
}
