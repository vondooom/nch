import { IssueForm } from "../form";

export default function NewIssuePage() {
  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">New issue</h1>
      <IssueForm />
    </div>
  );
}
