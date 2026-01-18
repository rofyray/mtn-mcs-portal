import type { ChangeEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectDropdownProps = {
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
};

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  emptyLabel = "No options available",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const summaryText =
    selectedValues.length > 0 ? `${label} (${selectedValues.length})` : placeholder ?? label;

  function handleToggle(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  }

  function handleKeyToggle(event: ChangeEvent<HTMLInputElement>) {
    handleToggle(event.target.value);
  }

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("keydown", handleKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="multi-select" ref={containerRef}>
      <button
        type="button"
        className="multi-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{summaryText}</span>
        <span aria-hidden="true" className="multi-select-caret">
          ▾
        </span>
      </button>
      <div
        id={panelId}
        className={`multi-select-panel ${open ? "is-open" : ""}`}
        role="listbox"
        aria-label={label}
      >
        {options.length === 0 ? (
          <span className="multi-select-empty">{emptyLabel}</span>
        ) : (
          options.map((option) => (
            <label key={option.value} className="multi-select-option">
              <input
                type="checkbox"
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange={handleKeyToggle}
              />
              {option.label}
            </label>
          ))
        )}
      </div>
    </div>
  );
}
