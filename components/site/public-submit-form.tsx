"use client";

import { useState } from "react";

import { submitPublicAction } from "@/lib/actions";

const fieldClass = "border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3";

export function PublicSubmitForm({
  kind,
  namePlaceholder,
  titlePlaceholder,
  bodyPlaceholder,
  submitLabel,
}: {
  kind: "story" | "dog";
  namePlaceholder: string;
  titlePlaceholder: string;
  bodyPlaceholder: string;
  submitLabel: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        await submitPublicAction(formData);
      }}
      className="grid gap-4"
    >
      <input type="hidden" name="kind" value={kind} />
      <input
        id={`${kind}-name`}
        name="name"
        autoComplete="name"
        placeholder={namePlaceholder}
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        className={fieldClass}
      />
      <input
        id={`${kind}-email`}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className={fieldClass}
      />
      <input
        id={`${kind}-title`}
        name="title"
        autoComplete="off"
        placeholder={titlePlaceholder}
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className={fieldClass}
      />
      <textarea
        id={`${kind}-body`}
        name="body"
        required
        rows={kind === "dog" ? 6 : 8}
        placeholder={bodyPlaceholder}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className={fieldClass}
      />
      <button
        disabled={pending}
        className="bg-[#C75B12] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8] disabled:opacity-60"
      >
        {pending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
