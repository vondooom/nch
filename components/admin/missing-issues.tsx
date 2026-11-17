import Link from "next/link";
import { missingIssueSlots } from "@/lib/schedule";
import { getStore } from "@/lib/store";

export function MissingIssues({ compact = false }: { compact?: boolean }) {
  const slots = missingIssueSlots(getStore().issues, new Date(), true);
  if (slots.length === 0) return null;
  return (
    <div className="mb-8 border-2 border-[#C75B12] bg-[#FBF8F0] p-5">
      <h2 className="mb-2 font-heading text-[22px] font-bold uppercase">Sunday issues not on the site</h2>
      <p className="mb-4 max-w-[680px] font-serif text-[15px] leading-relaxed text-[#5C543F]">
        The briefing goes out every Sunday at 7am. These dates have no published issue in the archive. Open a draft and
        paste the briefing that already went out.
      </p>
      <div className="grid gap-2">
        {slots.map((slot) => (
          <div
            key={slot.dateKey}
            className="flex flex-wrap items-center justify-between gap-3 border border-[#D8CDB4] px-4 py-3"
          >
            <div>
              <div className="font-heading text-[18px] font-bold">
                Issue #{slot.number}
                {slot.status === "draft" ? " · draft started" : ""}
              </div>
              <div className="text-[13px] text-[#8A8163]">{slot.date} · Sunday at 7am</div>
            </div>
            {compact ? null : slot.issueId ? (
              <Link
                href={`/admin/issues/${slot.issueId}`}
                className="bg-[#2F4A2C] px-4 py-2 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]"
              >
                Open draft
              </Link>
            ) : (
              <Link
                href={`/admin/issues/new?date=${encodeURIComponent(slot.date)}&number=${slot.number}`}
                className="bg-[#C75B12] px-4 py-2 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]"
              >
                Start draft
              </Link>
            )}
          </div>
        ))}
      </div>
      {compact ? (
        <Link
          href="/admin/issues"
          className="mt-4 inline-block font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#C75B12]"
        >
          Add them on the issues desk →
        </Link>
      ) : null}
    </div>
  );
}
