import { ZodSchema } from "zod";
import { ProblemDocument } from "../models/error.model.ts";

export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new ProblemDocument(
      400,
      "Validation Failed",
      `The request body contains invalid data: ${errorDetails}`,
    );
  }
  return result.data;
}

export function parseUserId(rawId: unknown): number {
  const userId = Number(rawId);
  if (isNaN(userId)) {
    throw new ProblemDocument(400, "Bad Request", "Invalid user ID format");
  }
  return userId;
}
