import { S3Client } from "bun";

const bucket = process.env.BUCKET_NAME;
const accessKeyId = process.env.BUCKET_ACCESS_KEY_ID;
const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY;
const endpoint = process.env.BUCKET_ENDPOINT_URL || "https://storage.railway.app";

function getClient(): S3Client | null {
  if (!bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return new S3Client({
    bucket,
    accessKeyId,
    secretAccessKey,
    endpoint,
  });
}

export function isStorageConfigured(): boolean {
  return !!(bucket && accessKeyId && secretAccessKey);
}

export async function uploadFile(
  collectionId: string,
  fileName: string,
  content: string
): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("Storage not configured");

  const key = `${collectionId}/${fileName}`;
  await client.write(key, content, { type: "text/markdown" });
}

export async function listCollectionFiles(
  collectionId: string
): Promise<string[]> {
  const client = getClient();
  if (!client) throw new Error("Storage not configured");

  const prefix = `${collectionId}/`;
  const result = await client.list({ prefix });

  if (!result.contents) return [];

  return result.contents
    .map((obj) => obj.key?.replace(prefix, "") || "")
    .filter((name) => name.length > 0)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export async function getFileContent(
  collectionId: string,
  fileName: string
): Promise<string | null> {
  const client = getClient();
  if (!client) throw new Error("Storage not configured");

  const key = `${collectionId}/${fileName}`;
  const file = client.file(key);

  try {
    const exists = await file.exists();
    if (!exists) return null;
    return await file.text();
  } catch {
    return null;
  }
}

export async function listAllCollections(): Promise<Record<string, string[]>> {
  const client = getClient();
  if (!client) throw new Error("Storage not configured");

  const result = await client.list({});
  if (!result.contents) return {};

  const collections: Record<string, string[]> = {};

  for (const obj of result.contents) {
    if (!obj.key) continue;
    const [collectionId, ...rest] = obj.key.split("/");
    const fileName = rest.join("/");
    if (!collectionId || !fileName) continue;

    if (!collections[collectionId]) {
      collections[collectionId] = [];
    }
    collections[collectionId].push(fileName);
  }

  // Sort files naturally within each collection
  for (const id of Object.keys(collections)) {
    collections[id].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  return collections;
}

export async function deleteCollection(collectionId: string): Promise<boolean> {
  const client = getClient();
  if (!client) throw new Error("Storage not configured");

  const files = await listCollectionFiles(collectionId);
  if (files.length === 0) return false;

  for (const fileName of files) {
    const key = `${collectionId}/${fileName}`;
    await client.delete(key);
  }

  return true;
}
