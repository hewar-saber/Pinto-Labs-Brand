"use client";

import { useActionState } from "react";

import { signIn, type SignInState } from "../auth-actions";

const EMPTY: SignInState = {};

export default function SignInForm({ from }: { from: string }) {
  const [state, action, pending] = useActionState(signIn, EMPTY);

  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <input type="hidden" name="from" value={from} />
      <label
        htmlFor="password"
        className="text-[16px] leading-[1.2] font-medium text-black/70"
      >
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        aria-describedby={state.error ? "signin-error" : undefined}
        className="border border-black/25 px-3 py-2 text-[16px] leading-[1.4] text-black outline-none focus:border-black"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-brand mt-1 cursor-pointer px-3 py-2 text-[16px] leading-[1.2] font-bold text-white transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Checking" : "Enter"}
      </button>
      {state.error ? (
        <p
          id="signin-error"
          role="alert"
          className="text-brand text-[16px] leading-[1.3] font-medium"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
