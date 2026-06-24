import { S3Client, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { env } from "./env.ts";

export const s3 = new S3Client({
  endpoint: `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: env.MINIO_ROOT_USER,
    secretAccessKey: env.MINIO_ROOT_PASSWORD,
  },
  forcePathStyle: true,
});

async function ensureBucket(name: string): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: name }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: name }));
    console.log(`Bucket "${name}" created`);
  }
}

export async function initStorage(): Promise<void> {
  await ensureBucket(env.MINIO_BUCKET_TRACKS);
  await ensureBucket(env.MINIO_BUCKET_IMAGES);
  console.log("MinIO storage initialized");
}
