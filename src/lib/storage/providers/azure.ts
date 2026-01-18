import { env } from "@/lib/env";
import {
  addRandomSuffix,
  validateUploadContentType,
  validateUploadPath,
  validateUploadSize,
} from "@/lib/storage/config";
import type { StorageProvider } from "@/lib/storage/types";

async function getContainerClient() {
  const connectionString = env.azureStorageConnectionString;
  if (!connectionString) {
    throw new Error("Missing AZURE_STORAGE_CONNECTION_STRING.");
  }

  const containerName = env.azureStorageContainer ?? "mtn-community-shop";

  let BlobServiceClient: { fromConnectionString: (connection: string) => { getContainerClient: (name: string) => { createIfNotExists: () => Promise<void>; getBlockBlobClient: (name: string) => { uploadData: (data: ArrayBuffer, options?: { blobHTTPHeaders?: { blobContentType?: string } }) => Promise<void>; url: string; }; }; }; };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ BlobServiceClient } = require("@azure/storage-blob"));
  } catch {
    throw new Error(
      "Azure storage provider requires @azure/storage-blob. Install it with pnpm add @azure/storage-blob."
    );
  }

  const serviceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = serviceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();
  return containerClient;
}

export function createAzureProvider(): StorageProvider {
  return {
    name: "azure",
    handleUpload: async (request: Request) => {
      const formData = await request.formData();
      const file = formData.get("file");
      const pathname = String(formData.get("pathname") ?? "").trim();
      const contentType = String(formData.get("contentType") ?? "").trim();

      if (!(file instanceof File)) {
        throw new Error("Missing upload file.");
      }

      if (!pathname) {
        throw new Error("Missing upload pathname.");
      }

      const normalizedPath = validateUploadPath(pathname);
      const resolvedContentType = contentType || file.type;

      validateUploadContentType(resolvedContentType);
      validateUploadSize(file.size);

      const containerClient = await getContainerClient();
      const blobName = addRandomSuffix(normalizedPath);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(await file.arrayBuffer(), {
        blobHTTPHeaders: resolvedContentType
          ? { blobContentType: resolvedContentType }
          : undefined,
      });

      return { url: blockBlobClient.url };
    },
  };
}
