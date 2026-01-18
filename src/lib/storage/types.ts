export type StorageProviderName = "vercel" | "azure";

export type UploadResult = {
  url: string;
};

export type UploadResponse = Record<string, unknown>;

export type StorageProvider = {
  name: StorageProviderName;
  handleUpload: (request: Request) => Promise<UploadResponse>;
  deleteFile?: (url: string) => Promise<void>;
};
