"use client";

import { useState } from "react";

export function NewsletterForm({ buttonLabel, successMessage }: { buttonLabel: string; successMessage: string }) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState("sending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      if (!response.ok) throw new Error();
      form.reset();
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row" noValidate>
      <label className="sr-only" htmlFor="newsletter-email">Email address</label>
      <input id="newsletter-email" name="email" type="email" required className="field min-w-0 flex-1" placeholder="you@example.com" />
      <button type="submit" disabled={state === "sending"} className="btn btn-primary whitespace-nowrap disabled:opacity-60">
        {state === "sending" ? "Joining…" : buttonLabel}
      </button>
      {state === "success" && <p role="status" className="basis-full text-xs" style={{ color: "var(--accent)" }}>{successMessage}</p>}
      {state === "error" && <p role="alert" className="basis-full text-xs text-red-500">Please enter a valid email and try again.</p>}
    </form>
  );
}