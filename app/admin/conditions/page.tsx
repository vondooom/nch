import { addConditionAction, saveConditionAction } from "@/lib/actions";
import { fieldClass } from "@/components/admin/controls";
import { getStore } from "@/lib/store";

export default function AdminConditions() {
  return (
    <div>
      <h1 className="mb-6 font-heading text-[36px] font-bold uppercase">Conditions</h1>
      <p className="mb-6 font-serif text-[#5C543F]">
        Editors and admins can both update the strip. It shows on the homepage and Conditions page immediately.
      </p>
      <form action={addConditionAction} className="mb-8 grid gap-2 border-2 border-[#211D14] bg-[#FBF8F0] p-4 sm:grid-cols-[1fr_1fr_auto]">
        <input name="label" required placeholder="New label" className={fieldClass} />
        <input name="value" required placeholder="Value" className={fieldClass} />
        <button className="bg-[#C75B12] px-4 py-2 font-heading text-[13px] font-semibold uppercase tracking-[0.1em] text-[#FFF6E8]">
          Add stat
        </button>
      </form>
      <div className="grid gap-4">
        {getStore().conditions.map((c) => (
          <form key={c.id} action={saveConditionAction} className="grid gap-2 border border-[#D8CDB4] bg-[#FBF8F0] p-4 sm:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="id" value={c.id} />
            <input name="label" defaultValue={c.label} className={fieldClass} />
            <input name="value" defaultValue={c.value} className={fieldClass} />
            <button className="bg-[#1C2B1A] px-4 py-2 font-heading text-[13px] font-semibold uppercase tracking-[0.1em] text-[#F2EDDD]">
              Update
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
