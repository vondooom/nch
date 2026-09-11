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
  return (
    <form action="/api/submissions" method="post" className="grid gap-4">
      <input type="hidden" name="kind" value={kind} />
      <input name="name" placeholder={namePlaceholder} required className={fieldClass} />
      <input name="email" type="email" placeholder="Email" required className={fieldClass} />
      <input name="title" placeholder={titlePlaceholder} required className={fieldClass} />
      <textarea
        name="body"
        required
        rows={kind === "dog" ? 6 : 8}
        placeholder={bodyPlaceholder}
        className={fieldClass}
      />
      <button
        type="submit"
        className="bg-[#C75B12] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]"
      >
        {submitLabel}
      </button>
    </form>
  );
}
