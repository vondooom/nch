import Link from "next/link";
import { saveGearAction } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { DeleteButton, StatusField, fieldClass } from "@/components/admin/controls";
import { StatusBadge } from "@/components/admin/shell";
import { getStore } from "@/lib/store";

export default async function AdminGear({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireSession();
  const { id } = await searchParams;
  const gear = getStore().gear;
  const existing = id ? gear.find((item) => item.id === id) : undefined;

  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">Gear</h1>
      <form action={saveGearAction} className="mb-8 grid gap-2 border-2 border-[#211D14] bg-[#FBF8F0] p-4">
        {existing ? <input type="hidden" name="id" value={existing.id} /> : null}
        <div className="font-heading text-[14px] font-semibold uppercase tracking-[0.12em]">
          {existing ? "Edit a pick" : "Add a pick"}
        </div>
        <input name="name" required defaultValue={existing?.name} placeholder="Name" className={fieldClass} />
        <input name="slug" defaultValue={existing?.slug} placeholder="Slug" className={fieldClass} />
        <input name="image" defaultValue={existing?.image} placeholder="Image URL" className={fieldClass} />
        <div className="grid gap-2 sm:grid-cols-3">
          <input name="category" defaultValue={existing?.category} placeholder="Category" className={fieldClass} />
          <input name="badge" defaultValue={existing?.badge} placeholder="Badge" className={fieldClass} />
          <input name="price" defaultValue={existing?.price} placeholder="Price" className={fieldClass} />
        </div>
        <textarea name="why" required defaultValue={existing?.why} placeholder="Why we trust it" className={fieldClass} />
        <textarea name="body" rows={6} defaultValue={existing?.body} placeholder="Full review" className={fieldClass} />
        <input name="issue" defaultValue={existing?.issue} placeholder="Issue" className={fieldClass} />
        <StatusField role={session.role} current={existing?.status} />
        <div className="flex flex-wrap gap-3">
          <button className="bg-[#C75B12] py-2 px-4 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Save gear
          </button>
          <DeleteButton collection="gear" id={existing?.id} role={session.role} />
          {existing ? (
            <Link href="/admin/gear" className="px-4 py-2 font-heading text-[13px] uppercase tracking-[0.1em]">
              Cancel
            </Link>
          ) : null}
        </div>
      </form>
      <div className="grid gap-2">
        {gear.map((g) => (
          <Link
            key={g.id}
            href={`/admin/gear?id=${g.id}`}
            className="flex items-center justify-between border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3"
          >
            <div>
              <div className="font-heading text-[18px] font-bold">{g.name}</div>
              <div className="text-[13px] text-[#8A8163]">
                {g.category} · {g.price}
              </div>
            </div>
            <StatusBadge status={g.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
