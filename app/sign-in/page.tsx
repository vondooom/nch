import { loginAction } from "@/lib/actions";

export const metadata = { title: "Staff sign-in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1C2B1A] px-6 py-16">
      <div className="w-full max-w-md border-2 border-[#33422F] bg-[#F5F1E8] p-8">
        <div className="mb-1 font-heading text-[28px] font-bold tracking-[0.02em] text-[#1C2B1A]">
          NORCAL<span className="text-[#C75B12]">HUNT</span>
        </div>
        <p className="mb-6 font-heading text-[14px] font-semibold uppercase tracking-[0.16em] text-[#8A8163]">
          Staff desk
        </p>
        <form action={loginAction} className="grid gap-3">
          <input name="email" type="email" required placeholder="Email" className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
          <input name="password" type="password" required placeholder="Password" className="border-2 border-[#211D14] bg-[#FFFDF7] px-4 py-3" />
          {error ? <p className="text-[14px] text-[#8C2F14]">That login didn&apos;t match.</p> : null}
          <button className="bg-[#C75B12] py-3 font-heading text-[16px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Sign in
          </button>
        </form>
        <p className="mt-5 text-[13px] leading-relaxed text-[#8A8163]">
          Local desk: <code>admin@norcalhunt.local</code> / <code>hunt-admin</code> or{" "}
          <code>editor@norcalhunt.local</code> / <code>hunt-editor</code>. Connect Clerk on Vercel when you want
          production accounts.
        </p>
      </div>
    </main>
  );
}
