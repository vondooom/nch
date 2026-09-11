import Link from "next/link";
import { StatusBadge } from "@/components/admin/shell";
import { getStore } from "@/lib/store";

export const metadata = { title: "Issues" };

export default function AdminIssues() {
  const issues = getStore().issues;
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="font-heading text-[36px] font-bold uppercase">Issues</h1>
        <Link href="/admin/issues/new" className="bg-[#C75B12] px-4 py-2 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
          New issue
        </Link>
      </div>
      <div className="grid gap-2">
        {issues.map((i) => (
          <Link key={i.id} href={`/admin/issues/${i.id}`} className="flex flex-wrap items-center justify-between gap-3 border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3">
            <div>
              <div className="font-heading text-[18px] font-bold">
                #{i.number} {i.title}
              </div>
              <div className="text-[13px] text-[#8A8163]">{i.date}</div>
            </div>
            <StatusBadge status={i.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
