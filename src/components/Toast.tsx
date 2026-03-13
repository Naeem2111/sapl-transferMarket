"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  show: boolean;
  onDone: () => void;
  durationMs?: number;
};

export default function Toast({ message, show, onDone, durationMs = 2500 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 300); // wait for fade-out
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [show, durationMs, onDone]);

  if (!show && !visible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {message}
    </div>
  );
}
