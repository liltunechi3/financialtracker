"use client";

import { useFormState } from "react-dom";
import { login, signup } from "@/lib/actions";

export default function LoginPage() {
  const [loginState, loginAction] = useFormState(login, null);
  const [signupState, signupAction] = useFormState(signup, null);
  const state = signupState ?? loginState;

  return (
    <main className="auth">
      <h1>💰 FinTrack</h1>
      <p className="muted">Masuk untuk melihat keuanganmu.</p>
      <form className="stack">
        <input name="email" type="email" placeholder="Email" required autoComplete="email" />
        <input name="password" type="password" placeholder="Password (min. 6 karakter)" minLength={6} required autoComplete="current-password" />
        <button formAction={loginAction}>Masuk</button>
        <button formAction={signupAction} className="ghost">Daftar akun baru</button>
        {state?.error && <p className="err">{state.error}</p>}
        {state?.info && <p className="ok">{state.info}</p>}
      </form>
    </main>
  );
}
