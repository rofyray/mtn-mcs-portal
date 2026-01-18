import { env } from "@/lib/env";
import { createAzureProvider } from "@/lib/storage/providers/azure";
import { createVercelProvider } from "@/lib/storage/providers/vercel";
import type { StorageProvider, StorageProviderName } from "@/lib/storage/types";

const providerFallback: StorageProviderName = "vercel";

export function getStorageProvider(): StorageProvider {
  const configured = (env.storageProvider ?? providerFallback).toLowerCase() as StorageProviderName;

  switch (configured) {
    case "azure":
      return createAzureProvider();
    case "vercel":
      return createVercelProvider();
    default:
      return createVercelProvider();
  }
}
