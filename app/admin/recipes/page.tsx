import Link from "next/link";
import { saveRecipeAction } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { DeleteButton, StatusField, fieldClass } from "@/components/admin/controls";
import { StatusBadge } from "@/components/admin/shell";
import { getStore } from "@/lib/store";

export default async function AdminRecipes({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireSession();
  const { id } = await searchParams;
  const recipes = getStore().recipes;
  const existing = id ? recipes.find((item) => item.id === id) : undefined;

  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">Recipes</h1>
      <form action={saveRecipeAction} className="mb-8 grid gap-2 border-2 border-[#211D14] bg-[#FBF8F0] p-4">
        {existing ? <input type="hidden" name="id" value={existing.id} /> : null}
        <input name="title" required defaultValue={existing?.title} placeholder="Title" className={fieldClass} />
        <input name="slug" defaultValue={existing?.slug} placeholder="Slug" className={fieldClass} />
        <input name="image" defaultValue={existing?.image} placeholder="Image URL" className={fieldClass} />
        <textarea name="lede" defaultValue={existing?.lede} placeholder="Lede" className={fieldClass} />
        <textarea
          name="need"
          defaultValue={existing?.need.join("\n")}
          placeholder="Ingredients, one per line"
          className={fieldClass}
        />
        <textarea
          name="method"
          defaultValue={existing?.method.map((m) => `${m.h}: ${m.t}`).join("\n")}
          placeholder="Steps as Heading: detail"
          className={fieldClass}
        />
        <textarea name="note" defaultValue={existing?.note} placeholder="Note" className={fieldClass} />
        <StatusField role={session.role} current={existing?.status} />
        <div className="flex flex-wrap gap-3">
          <button className="bg-[#C75B12] py-2 px-4 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
            Save recipe
          </button>
          <DeleteButton collection="recipes" id={existing?.id} role={session.role} />
          {existing ? (
            <Link href="/admin/recipes" className="px-4 py-2 font-heading text-[13px] uppercase tracking-[0.1em]">
              Cancel
            </Link>
          ) : null}
        </div>
      </form>
      <div className="grid gap-2">
        {recipes.map((r) => (
          <Link
            key={r.id}
            href={`/admin/recipes?id=${r.id}`}
            className="flex items-center justify-between border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3"
          >
            <div className="font-heading text-[18px] font-bold">{r.title}</div>
            <StatusBadge status={r.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
