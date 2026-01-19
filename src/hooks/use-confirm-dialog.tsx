"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import ConfirmModal from "@/components/confirm-modal";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger" | "secondary";
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  inputMinLength?: number;
  inputValue?: string;
};

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputValueRef = useRef("");
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    const initialValue = next.inputValue ?? "";
    setInputValue(initialValue);
    inputValueRef.current = initialValue;
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setOptions(null);
    if (resolver) {
      resolver(result);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    handleClose(true);
  }, [handleClose]);

  const handleCancel = useCallback(() => {
    handleClose(false);
  }, [handleClose]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    inputValueRef.current = value;
  }, []);

  const getInputValue = useCallback(() => inputValueRef.current, []);

  const inputInvalid = useMemo(() => {
    if (!options?.inputLabel) {
      return false;
    }
    if (!options.inputRequired) {
      return false;
    }
    const trimmed = inputValue.trim();
    const minLength = options.inputMinLength ?? 1;
    return trimmed.length < minLength;
  }, [options, inputValue]);

  const confirmDialog = useMemo(() => {
    return (
      <ConfirmModal
        open={Boolean(options)}
        title={options?.title ?? "Confirm action"}
        description={options?.description}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        confirmVariant={options?.confirmVariant}
        inputLabel={options?.inputLabel}
        inputPlaceholder={options?.inputPlaceholder}
        inputRequired={options?.inputRequired}
        inputMinLength={options?.inputMinLength}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }, [options, inputValue, handleCancel, handleConfirm, handleInputChange]);

  return { confirm, confirmDialog, inputValue, inputInvalid, getInputValue };
}
