import { deleteRecordFormAction } from "@/lib/actions";
import { canDelete, canPublish } from "@/lib/auth";
import type { PublishStatus, Role } from "@/lib/types";

export const fieldClass = "border-2 border-[#211D14] bg-[#FFFDF7] px-3 py-2";

export function StatusField({
  role,
  current,
}: {
  role: Role;
  current?: PublishStatus;
}) {
  if (!canPublish(role)) {
    return (
      <p className="text-[13px] text-[#8A8163]">
        Status stays <strong>{current ?? "draft"}</strong>. Admins publish and unpublish.
        <input type="hidden" name="status" value={current === "published" ? "published" : "draft"} />
      </p>
    );
  }
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8A8163]">
        Status
      </span>
      <select name="status" defaultValue={current ?? "draft"} className={fieldClass}>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </label>
  );
}

export function DeleteButton({
  collection,
  id,
  role,
}: {
  collection: string;
  id?: string;
  role: Role;
}) {
  if (!id || !canDelete(role)) return null;
  return (
    <form action={deleteRecordFormAction}>
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="id" value={id} />
      <button className="border-2 border-[#8C2F14] px-4 py-2 font-heading text-[13px] font-semibold uppercase tracking-[0.1em] text-[#8C2F14]">
        Delete
      </button>
    </form>
  );
}
