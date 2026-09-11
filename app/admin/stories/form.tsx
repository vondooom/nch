import { saveStoryAction } from "@/lib/actions";
import { requireSession } from "@/lib/auth";
import { DeleteButton, StatusField, fieldClass } from "@/components/admin/controls";
import type { Story } from "@/lib/types";

export async function StoryForm({ story }: { story?: Story }) {
  const session = await requireSession();
  return (
    <form action={saveStoryAction} className="grid max-w-3xl gap-3">
      {story ? <input type="hidden" name="id" value={story.id} /> : null}
      <input name="title" required defaultValue={story?.title} placeholder="Title" className={fieldClass} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="author" required defaultValue={story?.author} placeholder="Author" className={fieldClass} />
        <input name="species" defaultValue={story?.species} placeholder="Species" className={fieldClass} />
        <input name="date" required defaultValue={story?.date} placeholder="Date" className={fieldClass} />
      </div>
      <input name="slug" required defaultValue={story?.slug} placeholder="Slug" className={fieldClass} />
      <textarea name="excerpt" required rows={3} defaultValue={story?.excerpt} placeholder="Excerpt" className={fieldClass} />
      <textarea name="body" required rows={10} defaultValue={story?.body} placeholder="Body" className={fieldClass} />
      <input name="image" defaultValue={story?.image} placeholder="Image URL" className={fieldClass} />
      <StatusField role={session.role} current={story?.status} />
      <div className="flex flex-wrap gap-3">
        <button className="bg-[#C75B12] px-5 py-3 font-heading text-[16px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
          Save story
        </button>
        <DeleteButton collection="stories" id={story?.id} role={session.role} />
      </div>
    </form>
  );
}
