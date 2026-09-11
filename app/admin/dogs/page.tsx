import Link from "next/link";
import { StatusBadge } from "@/components/admin/shell";
import { getStore } from "@/lib/store";

export default function AdminDogs() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <h1 className="font-heading text-[36px] font-bold uppercase">Dogs</h1>
        <Link href="/admin/dogs/new" className="bg-[#C75B12] px-4 py-2 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">New dog</Link>
      </div>
      <div className="grid gap-2">
        {getStore().dogs.map((d) => (
          <Link key={d.id} href={`/admin/dogs/${d.id}`} className="flex items-center justify-between border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3">
            <div>
              <div className="font-heading text-[18px] font-bold">{d.name}</div>
              <div className="text-[13px] text-[#8A8163]">{d.breed}</div>
            </div>
            <StatusBadge status={d.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
