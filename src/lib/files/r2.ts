import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const getR2Config = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
  };
};

let client: S3Client | null = null;

const getR2Client = () => {
  if (client) {
    return client;
  }

  const config = getR2Config();

  client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return client;
};

const getBucketName = () => getR2Config().bucketName;

interface UploadR2ObjectInput {
  body: Buffer;
  contentType: string;
  key: string;
}

export const uploadR2Object = async ({ body, contentType, key }: UploadR2ObjectInput) => {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
};

export const getR2Object = async (key: string) =>
  getR2Client().send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
  );

export const deleteR2Object = async (key: string) => {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
  );
};
