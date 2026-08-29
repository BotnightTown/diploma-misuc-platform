import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { s3 } from "../config/storage.ts";
import { env } from "../config/env.ts";
import crypto from "crypto";
import path from "path";
import { ProblemDocument } from "../models/error.model.ts";
import { UploadDataType } from "../types/upload.types.ts";

export type StorageBucket = "tracks" | "images";
export type ImageFolder =
  "avatars/users" | "avatars/artists" | "covers/albums" | "covers/playlists" | "covers/rooms";

const BUCKET_MAP: Record<StorageBucket, string> = {
  tracks: env.MINIO_BUCKET_TRACKS,
  images: env.MINIO_BUCKET_IMAGES,
};

export const IMAGE_FOLDERS = {
  userAvatars: "avatars/users",
  artistAvatars: "avatars/artists",
  albumCovers: "covers/albums",
  playlistCovers: "covers/playlists",
  roomCovers: "covers/rooms",
} as const satisfies Record<string, ImageFolder>;

function joinStoragePath(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/flac"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function generateStorageKey(originalName: string, folder?: ImageFolder): string {
  const ext = path.extname(originalName);
  const uuid = crypto.randomUUID();
  const filename = `${uuid}${ext}`;
  return folder ? joinStoragePath(folder, filename) : filename;
}

export function getPublicUrl(bucket: StorageBucket, key: string): string {
  return `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${BUCKET_MAP[bucket]}/${key}`;
}

export interface UploadOptions {
  bucket: StorageBucket;
  key: string;
  body: Buffer;
  contentType: string;
  size: number;
}

export function validateFile(contentType: string, size: number, bucket: StorageBucket): void {
  if (bucket === "tracks") {
    if (!ALLOWED_AUDIO_TYPES.includes(contentType)) {
      throw new ProblemDocument(
        400,
        "Unsupported Audio Format",
        `Invalid audio format. Allowed: mp3, wav, flac. Received: ${contentType}`,
      );
    }
    if (size > MAX_AUDIO_SIZE) {
      const maxSizeMB = MAX_AUDIO_SIZE / (1024 * 1024);
      throw new ProblemDocument(
        400,
        "Audio File Too Large",
        `Audio file size exceeds the limit of ${maxSizeMB}MB.`,
      );
    }
  } else {
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      throw new ProblemDocument(
        400,
        "Unsupported Image Format",
        `Invalid image format. Allowed: jpeg, png, webp. Received: ${contentType}`,
      );
    }
    if (size > MAX_IMAGE_SIZE) {
      const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
      throw new ProblemDocument(
        400,
        "Image File Too Large",
        `Image file size exceeds the limit of ${maxSizeMB}MB.`,
      );
    }
  }
}

export async function uploadFile(options: UploadOptions): Promise<string> {
  const { bucket, key, body, contentType } = options;
  const bucketName = BUCKET_MAP[bucket];

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });

  await upload.done();
  return getPublicUrl(bucket, key);
}

export async function deleteFile(bucket: StorageBucket, key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_MAP[bucket],
      Key: key,
    }),
  );
}

export function extractKeyFromUrl(url: string, bucket?: StorageBucket): string {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (!bucket) {
      return pathParts.at(-1) ?? "";
    }

    const bucketName = BUCKET_MAP[bucket];
    const bucketIndex = pathParts.indexOf(bucketName);

    if (bucketIndex === -1) return "";

    return pathParts.slice(bucketIndex + 1).join("/");
  } catch {
    return url.split("/").pop() ?? "";
  }
}
// Generic type for future features maybe
export async function uploadCover<T extends UploadDataType>(
  data: T,
  folder: ImageFolder,
): Promise<string> {
  validateFile(data.contentType, data.size, "images");

  const key = generateStorageKey(data.filename, folder);
  return uploadFile({
    bucket: "images",
    key,
    body: data.file,
    contentType: data.contentType,
    size: data.size,
  });
}
