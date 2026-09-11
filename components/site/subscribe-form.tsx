export function SubscribeForm({
  source = "subscribe",
  align = "center",
  tone = "light",
}: {
  source?: string;
  align?: "center" | "start";
  tone?: "light" | "dark";
}) {
  return (
    <form
      action="/api/subscribe"
      method="post"
      className={`flex max-w-[560px] flex-wrap gap-2.5 ${align === "center" ? "mx-auto justify-center" : ""}`}
    >
      <input type="hidden" name="source" value={source} />
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className={
          tone === "dark"
            ? "min-w-[240px] flex-1 border-2 border-[#E4DCC6] bg-[#FFFDF7] px-4 py-3.5 text-[16px] text-[#211D14]"
            : "min-w-[260px] flex-1 border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3.5 text-[16px]"
        }
      />
      <button
        type="submit"
        className="bg-[#C75B12] px-7 py-3.5 font-heading text-[17px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]"
      >
        Subscribe free
      </button>
    </form>
  );
}
