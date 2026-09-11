"use client";

import { useFormStatus } from "react-dom";

import { submitPublicAction } from "@/lib/actions";

const fieldClass = "border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="bg-[#C75B12] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8] disabled:opacity-60"
    >
      {pending ? "Sending…" : label}
    </button>
  );
}

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
  return (
    <form action={submitPublicAction} autoComplete="off" className="grid gap-4">
      <input type="hidden" name="kind" value={kind} />
      <input
        name="name"
        autoComplete="off"
        placeholder={namePlaceholder}
        required
        className={fieldClass}
      />
      <input
        name="email"
        type="email"
        autoComplete="off"
        placeholder="Email"
        required
        className={fieldClass}
      />
      <input
        name="title"
        autoComplete="off"
        placeholder={titlePlaceholder}
        required
        className={fieldClass}
      />
      <textarea
        name="body"
        required
        rows={kind === "dog" ? 6 : 8}
        placeholder={bodyPlaceholder}
        autoComplete="off"
        className={fieldClass}
      />
      <SubmitButton label={submitLabel} />
    </form>
  );
}
