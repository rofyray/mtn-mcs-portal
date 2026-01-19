import type { UploadResult } from "@/lib/storage/types";

type UploadParams = {
  file: File;
  pathname: string;
  contentType?: string;
  access?: "public";
};

const provider =
  (process.env.NEXT_PUBLIC_STORAGE_PROVIDER as "vercel" | "azure" | undefined) ??
  "vercel";

export async function uploadFile({
  file,
  pathname,
  contentType,
  access = "public",
}: UploadParams): Promise<UploadResult> {
  if (provider === "vercel") {
    const { upload } = await import("@vercel/blob/client");
    const result = await upload(pathname, file, {
      access,
      handleUploadUrl: "/api/uploads",
      contentType: contentType ?? file.type,
    });
    return { url: result.url };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("pathname", pathname);
  formData.append("contentType", contentType ?? file.type);
  formData.append("access", access);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Upload failed.");
  }

  const data = (await response.json()) as UploadResult;
  if (!data.url) {
    throw new Error("Upload did not return a file URL.");
  }

  return data;
}

export async function deleteUploadedFile(url: string) {
  const response = await fetch("/api/uploads", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Delete failed.");
  }
}
