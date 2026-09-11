import { requireRole, staffAccounts } from "@/lib/auth";

export default async function TeamPage() {
  await requireRole("admin");
  const accounts = staffAccounts().map((account) => ({
    email: account.email,
    name: account.name,
    role: account.role,
  }));
  return (
    <div>
      <h1 className="mb-3 font-heading text-[36px] font-bold uppercase">Team</h1>
      <p className="mb-6 max-w-[640px] font-serif text-[#5C543F]">
        Admin-only. Two starting seats: editors draft, admins publish and delete. When Clerk is connected on the Vercel
        project, map <code>publicMetadata.role</code> to <code>admin</code> or <code>editor</code> and retire the local
        passwords.
      </p>
      <div className="grid gap-2">
        {accounts.map((a) => (
          <div key={a.email} className="flex items-center justify-between border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3">
            <div>
              <div className="font-heading text-[18px] font-bold">{a.name}</div>
              <div className="text-[13px] text-[#8A8163]">{a.email}</div>
            </div>
            <span className="bg-[#1C2B1A] px-2 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-[#F2EDDD]">
              {a.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
