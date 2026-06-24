import { FastifyRequest } from "fastify";
import { ZodSchema } from "zod";
import { ProblemDocument } from "../models/error.model.ts";

export interface UploadedFileData {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
}

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

export function isMultipartRequest(request: FastifyRequest): boolean {
  const multipartRequest = request as FastifyRequest & { isMultipart?: () => boolean };
  return multipartRequest.isMultipart?.() ?? false;
}

export async function parseMultipartFormData(
  request: FastifyRequest,
): Promise<{ file: UploadedFileData | null; meta: Record<string, unknown> }> {
  const parts = request.parts();

  let file: UploadedFileData | null = null;
  const meta: Record<string, unknown> = {};

  for await (const part of parts) {
    if (part.type === "file") {
      const chunks: Buffer[] = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      file = {
        file: buffer,
        filename: part.filename,
        contentType: part.mimetype,
        size: buffer.length,
      };
    } else {
      meta[part.fieldname] = part.value;
    }
  }

  return { file, meta };
}
