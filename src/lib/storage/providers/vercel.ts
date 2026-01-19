import { del } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";

import { normalizeUploadPath, uploadConfig, validateUploadPath } from "@/lib/storage/config";
import type { StorageProvider } from "@/lib/storage/types";

function getPathnameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    return normalizeUploadPath(parsed.pathname);
  } catch {
    return normalizeUploadPath(url);
  }
}

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
    deleteFile: async (url: string) => {
      const pathname = getPathnameFromUrl(url);
      validateUploadPath(pathname);
      await del(url);
    },
  };
}
