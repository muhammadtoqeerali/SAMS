"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function FormSubmitButton({ children, className = "button primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending}>
      {pending && <LoaderCircle size={16} className="spin" />}
      {pending ? "Saving…" : children}
    </button>
  );
}
