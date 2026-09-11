import { notFound } from "next/navigation";
import { saveDogAction } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { DeleteButton, StatusField, fieldClass } from "@/components/admin/controls";
import { getStore } from "@/lib/store";

export default async function EditDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const existing = id === "new" ? null : getStore().dogs.find((i) => i.id === id);
  if (id !== "new" && !existing) notFound();
  const dog = existing ?? {
    id: "",
    slug: "",
    name: "",
    breed: "",
    week: "",
    story: "",
    image: "",
    credit: "",
    status: "draft" as const,
  };
  return (
    <form action={saveDogAction} className="grid max-w-3xl gap-3">
      <h1 className="font-heading text-[36px] font-bold uppercase">{existing ? "Edit dog" : "New dog"}</h1>
      {dog.id ? <input type="hidden" name="id" value={dog.id} /> : null}
      <input name="name" required defaultValue={dog.name} placeholder="Name" className={fieldClass} />
      <input name="slug" defaultValue={dog.slug} placeholder="Slug" className={fieldClass} />
      <input name="breed" defaultValue={dog.breed} placeholder="Breed" className={fieldClass} />
      <input name="week" defaultValue={dog.week} placeholder="Week label" className={fieldClass} />
      <textarea name="story" rows={5} defaultValue={dog.story} placeholder="Story" className={fieldClass} />
      <input name="image" defaultValue={dog.image} placeholder="Image URL" className={fieldClass} />
      <input name="credit" defaultValue={dog.credit} placeholder="Photo credit" className={fieldClass} />
      <StatusField role={session.role} current={existing?.status ?? "draft"} />
      <div className="flex flex-wrap gap-3">
        <button className="bg-[#C75B12] py-3 px-5 font-heading text-[16px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
          Save
        </button>
        <DeleteButton collection="dogs" id={existing?.id} role={session.role} />
      </div>
    </form>
  );
}
