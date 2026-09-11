import { notFound } from "next/navigation";

import { IssueForm } from "../form";
import { getStore } from "@/lib/store";

export default async function EditIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = getStore().issues.find((item) => item.id === id);
  if (!issue) notFound();

  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">Edit issue</h1>
      <IssueForm issue={issue} />
    </div>
  );
}
