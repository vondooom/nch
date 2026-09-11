import Link from "next/link";
import { saveLocalAction } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { DeleteButton, StatusField, fieldClass } from "@/components/admin/controls";
import { StatusBadge } from "@/components/admin/shell";
import { getStore } from "@/lib/store";

export const metadata = { title: "Local Boys" };

export default async function AdminLocals({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireSession();
  const { id } = await searchParams;
  const locals = getStore().locals;
  const existing = id ? locals.find((item) => item.id === id) : undefined;

  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">Local Boys</h1>
      <form action={saveLocalAction} className="mb-8 grid gap-2 border-2 border-[#211D14] bg-[#FBF8F0] p-4">
        {existing ? <input type="hidden" name="id" value={existing.id} /> : null}
        <div className="font-heading text-[14px] font-semibold uppercase tracking-[0.12em]">
          {existing ? "Edit listing" : "Add a listing"}
        </div>
        <input name="name" required defaultValue={existing?.name} placeholder="Name" className={fieldClass} />
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="group" defaultValue={existing?.group} placeholder="Group" className={fieldClass} />
          <input name="where" defaultValue={existing?.where} placeholder="Where" className={fieldClass} />
        </div>
        <textarea name="desc" required rows={3} defaultValue={existing?.desc} placeholder="Why we send people here" className={fieldClass} />
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" name="featured" defaultChecked={existing?.featured} />
          Featured
        </label>
        <StatusField role={session.role} current={existing?.status} />
        <div className="flex flex-wrap gap-3">
          <button className="bg-[#C75B12] px-4 py-2 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Save listing
          </button>
          <DeleteButton collection="locals" id={existing?.id} role={session.role} />
          {existing ? (
            <Link href="/admin/locals" className="px-4 py-2 font-heading text-[13px] uppercase tracking-[0.1em]">
              Cancel
            </Link>
          ) : null}
        </div>
      </form>
      <div className="grid gap-2">
        {locals.map((item) => (
          <Link
            key={item.id}
            href={`/admin/locals?id=${item.id}`}
            className="flex items-center justify-between border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3"
          >
            <div>
              <div className="font-heading text-[18px] font-bold">{item.name}</div>
              <div className="text-[13px] text-[#8A8163]">
                {item.group} · {item.where}
              </div>
            </div>
            <StatusBadge status={item.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
