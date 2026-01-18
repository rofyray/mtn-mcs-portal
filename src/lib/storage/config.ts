export const uploadConfig = {
  allowedContentTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  maxUploadSizeInBytes: 10 * 1024 * 1024,
  uploadPathPrefix: "onboarding/",
  cacheControlMaxAge: 60 * 60 * 24 * 30,
};

export function normalizeUploadPath(pathname: string) {
  return pathname.replace(/^\/+/, "");
}

export function validateUploadPath(pathname: string) {
  const normalized = normalizeUploadPath(pathname);
  if (!normalized.startsWith(uploadConfig.uploadPathPrefix)) {
    throw new Error("Invalid upload path.");
  }
  return normalized;
}

export function validateUploadContentType(contentType?: string | null) {
  if (!contentType) {
    return;
  }
  if (!uploadConfig.allowedContentTypes.includes(contentType)) {
    throw new Error("Unsupported content type.");
  }
}

export function validateUploadSize(size: number) {
  if (size > uploadConfig.maxUploadSizeInBytes) {
    throw new Error("File exceeds the maximum allowed size.");
  }
}

export function addRandomSuffix(pathname: string) {
  const normalized = normalizeUploadPath(pathname);
  const lastSlash = normalized.lastIndexOf("/");
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash + 1) : "";
  const base = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
  const dot = base.lastIndexOf(".");
  const name = dot >= 0 ? base.slice(0, dot) : base;
  const ext = dot >= 0 ? base.slice(dot) : "";
  const suffix = crypto.randomUUID();
  return `${dir}${name}-${suffix}${ext}`;
}
