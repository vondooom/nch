import Link from "next/link";
import { StatusBadge } from "@/components/admin/shell";
import { getStore } from "@/lib/store";

export const metadata = { title: "Stories" };

export default function AdminStoriesPage() {
  const stories = getStore().stories;
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="font-heading text-[36px] font-bold uppercase">Stories</h1>
        <Link
          href="/admin/stories/new"
          className="bg-[#C75B12] px-4 py-2 font-heading text-[14px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]"
        >
          New story
        </Link>
      </div>
      <div className="grid gap-2">
        {stories.map((story) => (
          <Link
            key={story.id}
            href={`/admin/stories/${story.id}`}
            className="flex flex-wrap items-center justify-between gap-3 border border-[#D8CDB4] bg-[#FBF8F0] px-4 py-3"
          >
            <div>
              <div className="font-heading text-[18px] font-bold">{story.title}</div>
              <div className="text-[13px] text-[#8A8163]">
                {story.author} · {story.species}
              </div>
            </div>
            <StatusBadge status={story.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
