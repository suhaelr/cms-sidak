import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { env } from '../config';

const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT || undefined,
  forcePathStyle: !!env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

async function ensurePublicReadPolicy(): Promise<void> {
  if (!env.S3_ENDPOINT) return;

  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${env.S3_BUCKET}/*`],
      },
    ],
  };

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: env.S3_BUCKET,
      Policy: JSON.stringify(policy),
    }),
  );
}

export async function ensureBucket(): Promise<void> {
  if (!env.S3_ENDPOINT) {
    console.log('S3_ENDPOINT not set; skipping bucket setup.');
    return;
  }
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch (err: unknown) {
    console.warn('S3 bucket check failed, skipping bucket initialization:', err);
    return;
  }
  await ensurePublicReadPolicy();
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `${env.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
  );
}

export function buildUploadKey(folder: string, filename: string): string {
  const ext = filename.split('.').pop() || 'bin';
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return `${folder}/${safe}`;
}
