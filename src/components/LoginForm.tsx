"use client";

import { LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { loginAction } from "@/app/actions";
import { FormSubmitButton } from "@/components/FormSubmitButton";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, { ok: false, message: "" });
  return (
    <form action={action} className="login-form">
      <label className="field">
        <span>Apartment password</span>
        <div className="input-with-icon">
          <LockKeyhole size={18} />
          <input name="password" type="password" autoComplete="current-password" placeholder="Enter shared password" required autoFocus />
        </div>
      </label>
      {state.message && <div className="form-message error">{state.message}</div>}
      <FormSubmitButton className="button primary wide">Enter apartment</FormSubmitButton>
    </form>
  );
}
