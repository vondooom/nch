import Link from "next/link";
import { saveBoardAction } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { DeleteButton, StatusField, fieldClass } from "@/components/admin/controls";
import { StatusBadge } from "@/components/admin/shell";
import { getStore } from "@/lib/store";

export default async function AdminBoard({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireSession();
  const { id } = await searchParams;
  const board = getStore().board;
  const existing = id ? board.find((item) => item.id === id) : undefined;

  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">The Board</h1>
      <form action={saveBoardAction} className="mb-8 grid gap-2 border-2 border-[#211D14] bg-[#FBF8F0] p-4">
        {existing ? <input type="hidden" name="id" value={existing.id} /> : null}
        <input name="label" required defaultValue={existing?.label} placeholder="Label" className={fieldClass} />
        <textarea name="detail" required defaultValue={existing?.detail} placeholder="Detail" className={fieldClass} />
        <select name="kind" defaultValue={existing?.kind ?? "watch"} className={fieldClass}>
          <option value="open">Open</option>
          <option value="deadline">Deadline</option>
          <option value="watch">Watch</option>
        </select>
        <StatusField role={session.role} current={existing?.status} />
        <div className="flex flex-wrap gap-3">
          <button className="bg-[#C75B12] py-2 px-4 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Save item
          </button>
          <DeleteButton collection="board" id={existing?.id} role={session.role} />
          {existing ? (
            <Link href="/admin/board" className="px-4 py-2 font-heading text-[13px] uppercase tracking-[0.1em]">
              Cancel
            </Link>
          ) : null}
        </div>
      </form>
      <div className="grid gap-2">
        {board.map((b) => (
          <Link
            key={b.id}
            href={`/admin/board?id=${b.id}`}
            className="flex items-center justify-between border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3"
          >
            <div>
              <div className="font-heading text-[18px] font-bold">{b.label}</div>
              <div className="text-[13px] text-[#8A8163]">{b.kind}</div>
            </div>
            <StatusBadge status={b.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
