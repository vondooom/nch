import { IssueForm } from "../form";
import { missingIssueSlots } from "@/lib/schedule";
import { slugify } from "@/lib/site";
import { getStore } from "@/lib/store";

export default async function NewIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; number?: string }>;
}) {
  const query = await searchParams;
  const openSlot = missingIssueSlots(getStore().issues, new Date(), true).find((slot) => !slot.issueId);
  const date = query.date || openSlot?.date || "";
  const number = query.number || (openSlot ? String(openSlot.number) : "");
  const preset =
    date && number
      ? { date, number, slug: slugify(`issue-${number}-${date}`) }
      : undefined;
  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">New issue</h1>
      <IssueForm preset={preset} />
    </div>
  );
}
