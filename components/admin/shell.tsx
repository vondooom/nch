import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import type { StaffUser } from "@/lib/types";

const links = [
  ["Overview", "/admin"],
  ["Issues", "/admin/issues"],
  ["Stories", "/admin/stories"],
  ["Dogs", "/admin/dogs"],
  ["Gear", "/admin/gear"],
  ["Recipes", "/admin/recipes"],
  ["The Board", "/admin/board"],
  ["Local Boys", "/admin/locals"],
  ["Marketplace", "/admin/market"],
  ["Conditions", "/admin/conditions"],
  ["Inbox", "/admin/submissions"],
  ["Subscribers", "/admin/subscribers"],
] as const;

export function AdminShell({
  user,
  children,
}: {
  user: StaffUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#EFE8D6]">
      <header className="flex flex-wrap items-center gap-4 border-b-2 border-[#211D14] bg-[#1C2B1A] px-6 py-3 text-[#D9D2BA]">
        <Link href="/admin" className="font-heading text-[22px] font-bold tracking-[0.02em] text-[#F7F2E4]">
          NORCAL<span className="text-[#C75B12]">HUNT</span>
          <span className="ml-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9FB18B]">Desk</span>
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 font-heading text-[13px] font-semibold uppercase tracking-[0.1em]">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-[#D9D2BA] hover:text-[#E8A05C]">
              {label}
            </Link>
          ))}
          {user.role === "admin" ? (
            <Link href="/admin/team" className="text-[#D9D2BA] hover:text-[#E8A05C]">
              Team
            </Link>
          ) : null}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-[13px]">
          <span>
            {user.name} · {user.role}
          </span>
          <Link href="/" className="text-[#E8A05C]">
            View site
          </Link>
          <form action={logoutAction}>
            <button className="uppercase tracking-[0.08em] text-[#9FB18B]">Sign out</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-[1100px] px-6 py-8">{children}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={
        status === "published"
          ? "bg-[#2F4A2C] px-2 py-0.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-[#F2EDDD]"
          : "bg-[#D8CDB4] px-2 py-0.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-[#211D14]"
      }
    >
      {status}
    </span>
  );
}
