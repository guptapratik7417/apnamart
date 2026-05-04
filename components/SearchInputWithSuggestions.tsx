"use client";

import { useMemo, useState } from "react";

type SearchInputWithSuggestionsProps = {
  name?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  suggestions: string[];
  placeholder: string;
  className?: string;
  inputClassName?: string;
};

export default function SearchInputWithSuggestions({
  name,
  value,
  onValueChange,
  suggestions,
  placeholder,
  className = "",
  inputClassName = "input",
}: SearchInputWithSuggestionsProps) {
  const [internalValue, setInternalValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputValue = value ?? internalValue;
  const normalizedValue = inputValue.trim().toLowerCase();
  const filteredSuggestions = useMemo(() => {
    if (!normalizedValue) return [];

    return suggestions
      .filter((item) => item.toLowerCase().includes(normalizedValue))
      .slice(0, 8);
  }, [normalizedValue, suggestions]);

  function setValue(nextValue: string) {
    onValueChange?.(nextValue);
    if (value === undefined) setInternalValue(nextValue);
  }

  return (
    <div className={`relative ${className}`}>
      <input
        name={name}
        value={inputValue}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onChange={(event) => setValue(event.target.value)}
      />
      {focused && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-[0_14px_32px_rgba(233,30,99,0.16)]">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[#fff1f6] hover:text-[var(--color-primary)]"
              onMouseDown={(event) => {
                event.preventDefault();
                setValue(suggestion);
                setFocused(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
