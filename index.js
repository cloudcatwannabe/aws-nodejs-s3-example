// This is used for getting user input.
import { createInterface } from "readline/promises";
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  paginateListObjectsV2,
} from "@aws-sdk/client-s3";

export async function main() {
  const s3Client = new S3Client({ region: "us-east-1" });

  const bucketName = `test-bucket-${Date.now()}`;
  await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));

  // Put an object into an Amazon S3 bucket
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: "my-first-object.txt",
      Body: "Hello Javascript SDK!",
    }),
  );

  // Read the object
  const { Body } = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: "my-first-object.txt",
    }),
  );

  console.log(await Body.transformToString());

  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const result = await prompt.question("Empty and delete bucket? (y/n) ");
  prompt.close();

  if (result === "y") {
    const paginator = paginateListObjectsV2(
      { client: s3Client },
      { Bucket: bucketName },
    );

    for await (const page of paginator) {
      const objects = page.Contents;
      if (objects) {
        for (const object of objects) {
          await s3Client.send(
            new DeleteObjectCommand({ Bucket: bucketName, Key: object.Key }),
          );
          console.log(`Deleted ${object.Key}`);
        }
      }
    }
    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
  }
}

import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
