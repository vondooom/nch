import { saveIssueAction } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { DeleteButton, StatusField, fieldClass } from "@/components/admin/controls";
import type { Issue } from "@/lib/types";

export async function IssueForm({ issue }: { issue?: Issue }) {
  const session = await requireSession();
  return (
    <form action={saveIssueAction} className="grid max-w-3xl gap-3">
      {issue ? <input type="hidden" name="id" value={issue.id} /> : null}
      <input name="title" required defaultValue={issue?.title} placeholder="Title" className={fieldClass} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="number" required defaultValue={issue?.number} placeholder="Issue #" className={fieldClass} />
        <input name="date" required defaultValue={issue?.date} placeholder="Date" className={fieldClass} />
        <input name="slug" required defaultValue={issue?.slug} placeholder="Slug" className={fieldClass} />
      </div>
      <input name="read" defaultValue={issue?.read ?? "5 min read"} placeholder="Read time" className={fieldClass} />
      <textarea name="blurb" required rows={3} defaultValue={issue?.blurb} placeholder="Blurb" className={fieldClass} />
      <textarea name="body" required rows={10} defaultValue={issue?.body} placeholder="Body" className={fieldClass} />
      <input name="image" defaultValue={issue?.image} placeholder="Image URL" className={fieldClass} />
      <StatusField role={session.role} current={issue?.status} />
      <div className="flex flex-wrap gap-3">
        <button className="bg-[#C75B12] px-5 py-3 font-heading text-[16px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
          Save issue
        </button>
        <DeleteButton collection="issues" id={issue?.id} role={session.role} />
      </div>
    </form>
  );
}
