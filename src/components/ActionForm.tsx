"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionState } from "@/app/actions";
import { FormSubmitButton } from "@/components/FormSubmitButton";

type ServerAction = (state: ActionState, data: FormData) => Promise<ActionState>;

export function ActionForm({
  action,
  children,
  submitLabel,
  className = "form-stack",
  resetOnSuccess = true,
}: {
  action: ServerAction;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, { ok: false, message: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      {state.message && <div className={`form-message ${state.ok ? "success" : "error"}`}>{state.message}</div>}
      <FormSubmitButton>{submitLabel}</FormSubmitButton>
    </form>
  );
}
