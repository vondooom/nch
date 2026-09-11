import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { dashboardCounts, getStore } from "@/lib/store";

export const metadata = { title: "Desk" };

export default async function AdminHome() {
  const user = await requireSession();
  const counts = dashboardCounts();
  const inbox = getStore().submissions.filter((s) => s.state === "new");
  return (
    <div>
      <h1 className="mb-2 font-heading text-[42px] font-bold uppercase">The desk</h1>
      <p className="mb-8 max-w-[720px] font-serif text-[17px] text-[#5C543F]">
        Signed in as <strong>{user.role}</strong>. Editors write and revise drafts, update conditions, and work the
        inbox. Admins publish, unpublish, delete, and manage the team.
      </p>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Open drafts", counts.drafts, "/admin/issues"],
          ["Published issues", counts.publishedIssues, "/admin/issues"],
          ["Inbox", counts.openSubmissions, "/admin/submissions"],
          ["Live recipes", counts.recipes, "/admin/recipes"],
        ].map(([label, n, href]) => (
          <Link key={label} href={String(href)} className="border-2 border-[#211D14] bg-[#FBF8F0] p-5">
            <div className="font-heading text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8A8163]">
              {label}
            </div>
            <div className="font-heading text-[40px] font-bold">{n}</div>
          </Link>
        ))}
      </div>
      <h2 className="mb-3 font-heading text-[22px] font-bold uppercase">Needs a look</h2>
      {inbox.length === 0 ? (
        <p className="font-serif text-[#5C543F]">Inbox is clear.</p>
      ) : (
        <div className="grid gap-2">
          {inbox.map((s) => (
            <Link key={s.id} href="/admin/submissions" className="border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3">
              <span className="mr-2 font-heading text-[12px] font-bold uppercase text-[#C75B12]">{s.kind}</span>
              {s.title} <span className="text-[#8A8163]">· {s.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
