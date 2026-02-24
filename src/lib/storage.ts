import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const globalForS3 = globalThis as unknown as {
  s3Client: S3Client | undefined;
};

function createS3Client() {
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  };
  if (process.env.S3_ENDPOINT) {
    config.endpoint = process.env.S3_ENDPOINT;
    config.forcePathStyle = true;
  }
  return new S3Client(config);
}

export const s3Client = globalForS3.s3Client ?? createS3Client();

if (process.env.NODE_ENV !== "production") globalForS3.s3Client = s3Client;

const BUCKET = process.env.S3_BUCKET_NAME ?? "evolve-media";

export async function uploadMedia({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<{ storagePath: string; storageUrl: string }> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const publicUrl = process.env.S3_PUBLIC_URL;
  const storageUrl = publicUrl
    ? `${publicUrl}/${key}`
    : `https://${BUCKET}.s3.${process.env.S3_REGION ?? "us-east-1"}.amazonaws.com/${key}`;

  return { storagePath: key, storageUrl };
}

export async function downloadFromUrl(url: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

export async function getSignedMediaUrl(storagePath: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: storagePath,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
