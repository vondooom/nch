import { notFound } from "next/navigation";

import { StoryForm } from "../form";
import { getStore } from "@/lib/store";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = getStore().stories.find((item) => item.id === id);
  if (!story) notFound();

  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">Edit story</h1>
      <StoryForm story={story} />
    </div>
  );
}
