"use client";

import { useState } from "react";

type PasswordInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  minLength,
  required,
  className,
  onKeyDown,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={className || "input mt-1"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)] transition"
        tabIndex={-1}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
