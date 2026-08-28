import { FastifyRequest } from "fastify";
import { ZodSchema } from "zod";
import { ProblemDocument } from "../models/error.model.ts";
import { ParsedMultipart } from "../types/upload.types.ts";

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

export async function parseMultipartFormData(body: Record<string, any>): Promise<ParsedMultipart> {
  const fields: Record<string, string> = {};
  const files: Record<string, UploadedFileData> = {};

  for (const [key, part] of Object.entries(body ?? {})) {
    const isRealFile = part?.type === "file" && part.filename;

    if (isRealFile) {
      const buffer = await part.toBuffer();
      files[key] = {
        file: buffer,
        filename: part.filename,
        contentType: part.mimetype,
        size: buffer.length,
      };
    } else if (part?.type === "field" || part?.type === "file") {
      // текстове поле, або "файл" без імені (Postman-квірк) — обидва трактуємо як текст
      const value = part.type === "file" ? (await part.toBuffer()).toString("utf-8") : part.value;
      fields[key] = value;
    }
  }

  return { fields, files };
}

export function assertSelfOrForbidden(request: FastifyRequest, targetUserId: number) {
  if (request.user.sub !== targetUserId) {
    throw new ProblemDocument(403, "Forbidden", "You can only modify your own account");
  }
}
