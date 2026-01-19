"use client";

import { useId, type ChangeEvent } from "react";

type UploadFieldProps = {
  label: string;
  value?: string | null;
  accept?: string;
  uploading?: boolean;
  deleting?: boolean;
  disabled?: boolean;
  uploadDisabled?: boolean;
  removeDisabled?: boolean;
  helperText?: string;
  helperNote?: string;
  buttonLabel?: string;
  removeLabel?: string;
  className?: string;
  onSelect: (file: File) => void;
  onRemove?: () => void;
  onPreview?: (url: string, anchorRect?: DOMRect) => void;
};

const imageExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

function getFileName(url: string) {
  const cleaned = url.split("?")[0]?.split("#")[0] ?? "";
  const lastSlash = cleaned.lastIndexOf("/");
  const name = lastSlash >= 0 ? cleaned.slice(lastSlash + 1) : cleaned;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function getFileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : "";
}

function isImageUrl(url: string) {
  const cleaned = url.toLowerCase();
  if (cleaned.startsWith("data:image/")) {
    return true;
  }
  const path = cleaned.split("?")[0]?.split("#")[0] ?? "";
  return imageExtensions.some((ext) => path.endsWith(`.${ext}`));
}

function buildHelperText(accept?: string) {
  if (!accept) {
    return "Supported files up to 10MB.";
  }

  const hints: string[] = [];
  if (accept.includes("image/")) {
    hints.push("JPG, PNG, WEBP");
    if (accept.includes("image/heic") || accept.includes("image/heif")) {
      hints.push("HEIC");
    }
  }
  if (accept.includes("application/pdf")) {
    hints.push("PDF");
  }

  if (hints.length === 0) {
    return "Supported files up to 10MB.";
  }

  return `${hints.join(", ")} up to 10MB.`;
}

export default function UploadField({
  label,
  value,
  accept,
  uploading = false,
  deleting = false,
  disabled = false,
  uploadDisabled = false,
  removeDisabled = false,
  helperText,
  helperNote,
  buttonLabel,
  removeLabel = "Delete",
  className,
  onSelect,
  onRemove,
  onPreview,
}: UploadFieldProps) {
  const inputId = useId();
  const trimmedValue = value?.trim() ?? "";
  const hasValue = trimmedValue.length > 0;
  const isImage = hasValue && (isImageUrl(trimmedValue) || (!accept?.includes("application/") && accept?.includes("image/")));
  const fileName = hasValue ? getFileName(trimmedValue) : "";
  const fileExtension = fileName ? getFileExtension(fileName) : "";
  const actionLabel = buttonLabel ?? `Upload ${label}`;
  const statusLabel = uploading ? "Uploading..." : deleting ? "Deleting..." : hasValue ? "Uploaded" : "";
  const helper = helperText ?? buildHelperText(accept);
  const helperCaption = helperNote ? `${helper} ${helperNote}` : helper;
  const actionsDisabled = disabled || uploading || deleting;
  const isUploadDisabled = actionsDisabled || uploadDisabled;
  const isRemoveDisabled = actionsDisabled || removeDisabled;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onSelect(file);
    }
    event.target.value = "";
  }

  return (
    <div className={className ? `upload-field ${className}` : "upload-field"}>
      <div className="upload-field-header">
        <span className="upload-field-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M7 10h5M7 14h7" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="upload-field-title">{label}</p>
          <p className="upload-field-caption">{helperCaption}</p>
        </div>
      </div>

      <div className={`upload-preview ${hasValue ? "upload-preview-filled" : ""}`}>
        {hasValue ? (
          isImage ? (
            <button
              className="upload-preview-button"
              type="button"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                if (onPreview) {
                  onPreview(trimmedValue, rect);
                } else {
                  window.open(trimmedValue, "_blank", "noopener,noreferrer");
                }
              }}
              aria-label={`View ${label}`}
              disabled={!hasValue}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="upload-preview-image" src={trimmedValue} alt={`${label} preview`} />
            </button>
          ) : onPreview ? (
            <button
              className="upload-doc-button"
              type="button"
              onClick={(event) => onPreview(trimmedValue, event.currentTarget.getBoundingClientRect())}
              aria-label={`View ${label}`}
            >
              <div className="upload-doc">
                <div className="upload-doc-badge">{fileExtension || "FILE"}</div>
                <div className="upload-doc-info">
                  <p className="upload-doc-name">{fileName || "Document"}</p>
                  <span className="link-accent upload-doc-link">View document</span>
                </div>
              </div>
            </button>
          ) : (
            <button
              className="upload-doc-button"
              type="button"
              onClick={() => window.open(trimmedValue, "_blank", "noopener,noreferrer")}
              aria-label={`View ${label}`}
            >
              <div className="upload-doc">
                <div className="upload-doc-badge">{fileExtension || "FILE"}</div>
                <div className="upload-doc-info">
                  <p className="upload-doc-name">{fileName || "Document"}</p>
                  <span className="link-accent upload-doc-link">View document</span>
                </div>
              </div>
            </button>
          )
        ) : (
          <div className="upload-placeholder">
            <span className="upload-placeholder-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M8 14l3-3 5 5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="10" r="1.5" />
              </svg>
            </span>
            <div>
              <p className="upload-placeholder-title">No file uploaded</p>
              <p className="upload-placeholder-subtitle">Use the button below to add a file.</p>
            </div>
          </div>
        )}
      </div>

      <div className="upload-actions">
        <label className="btn upload-button" htmlFor={inputId} aria-disabled={isUploadDisabled}>
          <span className="upload-button-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 16V4" strokeLinecap="round" />
              <path d="M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20h16" strokeLinecap="round" />
            </svg>
          </span>
          <span>{actionLabel}</span>
        </label>
        <input
          id={inputId}
          className="upload-input"
          type="file"
          accept={accept}
          disabled={isUploadDisabled}
          onChange={handleChange}
        />
        {hasValue && onRemove ? (
          <button
            className="btn btn-danger-light"
            type="button"
            onClick={onRemove}
            disabled={isRemoveDisabled}
          >
            {removeLabel}
          </button>
        ) : null}
        {statusLabel ? <p className="upload-status">{statusLabel}</p> : null}
      </div>
    </div>
  );
}
