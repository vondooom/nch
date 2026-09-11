import Link from "next/link";
import { saveMarketAction } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { DeleteButton, StatusField, fieldClass } from "@/components/admin/controls";
import { StatusBadge } from "@/components/admin/shell";
import { getStore } from "@/lib/store";

export const metadata = { title: "Marketplace" };

export default async function AdminMarket({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireSession();
  const { id } = await searchParams;
  const listings = getStore().market;
  const existing = id ? listings.find((item) => item.id === id) : undefined;

  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">Marketplace</h1>
      <form action={saveMarketAction} className="mb-8 grid gap-2 border-2 border-[#211D14] bg-[#FBF8F0] p-4">
        {existing ? <input type="hidden" name="id" value={existing.id} /> : null}
        <div className="font-heading text-[14px] font-semibold uppercase tracking-[0.12em]">
          {existing ? "Edit listing" : "Add a listing"}
        </div>
        <input name="title" required defaultValue={existing?.title} placeholder="Title" className={fieldClass} />
        <div className="grid gap-2 sm:grid-cols-3">
          <input name="cat" defaultValue={existing?.cat} placeholder="Category" className={fieldClass} />
          <input name="where" defaultValue={existing?.where} placeholder="Where" className={fieldClass} />
          <input name="price" defaultValue={existing?.price} placeholder="Price" className={fieldClass} />
        </div>
        <textarea name="desc" required rows={3} defaultValue={existing?.desc} placeholder="Description" className={fieldClass} />
        <StatusField role={session.role} current={existing?.status} />
        <div className="flex flex-wrap gap-3">
          <button className="bg-[#C75B12] px-4 py-2 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Save listing
          </button>
          <DeleteButton collection="market" id={existing?.id} role={session.role} />
          {existing ? (
            <Link href="/admin/market" className="px-4 py-2 font-heading text-[13px] uppercase tracking-[0.1em]">
              Cancel
            </Link>
          ) : null}
        </div>
      </form>
      <div className="grid gap-2">
        {listings.map((item) => (
          <Link
            key={item.id}
            href={`/admin/market?id=${item.id}`}
            className="flex items-center justify-between border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3"
          >
            <div>
              <div className="font-heading text-[18px] font-bold">{item.title}</div>
              <div className="text-[13px] text-[#8A8163]">
                {item.cat} · {item.where} · {item.price}
              </div>
            </div>
            <StatusBadge status={item.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
