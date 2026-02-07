"use client";

import { createPortal } from "react-dom";

type FilePreviewModalProps = {
  open: boolean;
  url: string;
  label: string;
  kind: "image" | "pdf";
  anchorRect?: DOMRect | null;
  onClose: () => void;
};

const imageExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

function getFileExtension(target: string) {
  const cleaned = target.split("?")[0]?.split("#")[0] ?? "";
  const dotIndex = cleaned.lastIndexOf(".");
  return dotIndex >= 0 ? cleaned.slice(dotIndex + 1).toLowerCase() : "";
}

function resolveKind(url: string, fallback: "image" | "pdf") {
  if (url.startsWith("data:image/")) {
    return "image";
  }
  const extension = getFileExtension(url);
  if (extension === "pdf") {
    return "pdf";
  }
  if (imageExtensions.includes(extension)) {
    return "image";
  }
  return fallback;
}

export default function FilePreviewModal({
  open,
  url,
  label,
  kind,
  onClose,
}: FilePreviewModalProps) {
  const resolvedKind = resolveKind(url, kind);
  const previewUrl =
    resolvedKind === "pdf"
      ? url.includes("#")
        ? `${url}&view=FitH&toolbar=0&navpanes=0&zoom=page-width`
        : `${url}#view=FitH&toolbar=0&navpanes=0&zoom=page-width`
      : url;

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="modal-overlay modal-overlay-top"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} preview`}
      onClick={onClose}
    >
      <div className="modal-panel file-preview-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold">{label}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">Preview</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close preview">
            ×
          </button>
        </div>
        <div className="file-preview-body">
          <div className="file-preview-frame">
            {resolvedKind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="file-preview-image" src={previewUrl} alt={`${label} preview`} />
            ) : (
              <iframe className="file-preview-iframe" src={previewUrl} title={`${label} preview`} />
            )}
          </div>
          <div className="file-preview-actions">
            <a className="btn btn-secondary" href={url} target="_blank" rel="noreferrer">
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
