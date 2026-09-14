"use client";

import { useState } from "react";

export function ContactFormClient() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setState("ok");
      form.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6 md:p-8" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input id="name" name="name" required autoComplete="name" className="field" placeholder="Your name" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field"
            placeholder="you@company.com"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="subject">
          Subject <span className="font-normal normal-case">(optional)</span>
        </label>
        <input id="subject" name="subject" className="field" placeholder="Project inquiry" />
      </div>
      <div>
        <label className="label" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="field resize-y"
          placeholder="A few lines about scope, timeline, budget…"
        />
      </div>
      {/* honeypot — hidden from humans, bots fill it, we silently drop those */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div className="flex items-center gap-4 pt-1">
        <button type="submit" disabled={state === "sending"} className="btn btn-primary disabled:opacity-60">
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
        {state === "ok" && (
          <p role="status" className="text-sm" style={{ color: "var(--accent)" }}>
            Thanks — message received.
          </p>
        )}
        {state === "error" && <p role="alert" className="text-sm text-red-500">Something went wrong. Try email instead.</p>}
      </div>
    </form>
  );
}
