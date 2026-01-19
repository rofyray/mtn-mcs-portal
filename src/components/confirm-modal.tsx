"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger" | "secondary";
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  inputRequired?: boolean;
  inputMinLength?: number;
  onInputChange?: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const variantClassMap = {
  primary: "btn btn-primary",
  danger: "btn btn-danger-light",
  secondary: "btn btn-secondary",
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  inputLabel,
  inputPlaceholder,
  inputValue = "",
  inputRequired = false,
  inputMinLength = 1,
  onInputChange,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  const trimmedValue = inputValue.trim();
  const requiresInput = Boolean(inputLabel);
  const inputInvalid =
    requiresInput && inputRequired && trimmedValue.length < inputMinLength;

  if (!open) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div className="modal-panel confirm-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? <p className="text-sm text-gray-600">{description}</p> : null}
          </div>
          <button className="modal-close" type="button" onClick={onCancel} aria-label="Close confirmation">
            ×
          </button>
        </div>
        {requiresInput ? (
          <div className="modal-body">
            <div className="space-y-2">
              <label className="label">{inputLabel}</label>
              <input
                className="input"
                value={inputValue}
                placeholder={inputPlaceholder}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (onInputChange) {
                    onInputChange(nextValue);
                  }
                }}
              />
            </div>
          </div>
        ) : null}
        <div className="modal-footer">
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={variantClassMap[confirmVariant]}
            type="button"
            onClick={onConfirm}
            disabled={inputInvalid}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
