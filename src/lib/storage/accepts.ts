export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const PDF_CONTENT_TYPES = ["application/pdf"];

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  ...IMAGE_CONTENT_TYPES,
  ...PDF_CONTENT_TYPES,
];

export const IMAGE_ACCEPT = IMAGE_CONTENT_TYPES.join(",");
export const PDF_ACCEPT = PDF_CONTENT_TYPES.join(",");
export const DOCUMENT_ACCEPT = [...PDF_CONTENT_TYPES, ...IMAGE_CONTENT_TYPES].join(",");
