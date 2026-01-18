import { handleUpload } from "@vercel/blob/client";

import { uploadConfig, validateUploadPath } from "@/lib/storage/config";
import type { StorageProvider } from "@/lib/storage/types";

export function createVercelProvider(): StorageProvider {
  return {
    name: "vercel",
    handleUpload: async (request: Request) => {
      const body = await request.json();
      const response = await handleUpload({
        request,
        body,
        onBeforeGenerateToken: async (pathname) => {
          validateUploadPath(pathname);
          return {
            allowedContentTypes: uploadConfig.allowedContentTypes,
            maximumSizeInBytes: uploadConfig.maxUploadSizeInBytes,
            addRandomSuffix: true,
            cacheControlMaxAge: uploadConfig.cacheControlMaxAge,
          };
        },
      });
      return response;
    },
  };
}
