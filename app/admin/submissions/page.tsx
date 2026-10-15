import { promoteSubmissionAction, reviewSubmissionAction } from "@/lib/actions";
import { getStore } from "@/lib/store";

export default function AdminSubmissions() {
  const rows = getStore().submissions;
  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">Inbox</h1>
      <p className="mb-6 font-serif text-[#5C543F]">
        Public stories, dog nominations, and contact notes land here. Start a draft from the good hunts — it stays
        unpublished until an admin hits publish. Contact notes are marked accepted without becoming a story.
      </p>
      {rows.length === 0 ? (
        <p className="font-serif text-[#5C543F]">Inbox is empty.</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((s) => (
            <div key={s.id} className="border border-[#D8CDB4] bg-[#FBF8F0] p-5">
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <span className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-[#C75B12]">{s.kind}</span>
                <span className="font-heading text-[20px] font-bold">{s.title}</span>
                <span className="text-[13px] text-[#8A8163]">{s.state}</span>
              </div>
              <p className="mb-1 text-[13px] text-[#8A8163]">
                {s.name} · {s.email}
              </p>
              <p className="mb-4 font-serif text-[16px] leading-relaxed">{s.body}</p>
              {s.state === "new" ? (
                <div className="flex flex-wrap gap-2">
                  {s.kind === "contact" ? null : (
                    <form action={promoteSubmissionAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="bg-[#2F4A2C] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.1em] text-[#F2EDDD]">
                        Start draft
                      </button>
                    </form>
                  )}
                  <form action={reviewSubmissionAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="state" value="accepted" />
                    <button className="border-2 border-[#211D14] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.1em]">
                      Mark accepted
                    </button>
                  </form>
                  <form action={reviewSubmissionAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="state" value="declined" />
                    <button className="border-2 border-[#211D14] px-3 py-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.1em]">
                      Decline
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
