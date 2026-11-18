import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { originForRedirect } from "@/lib/site";
import { recordPublicSubmission } from "@/lib/store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const kind = recordPublicSubmission(formData);
  revalidatePath("/admin/submissions");
  const next =
    kind === "dog" ? "/dog-of-the-week/nominated" : kind === "contact" ? "/contact/thanks" : "/field-stories/submitted";
  return NextResponse.redirect(new URL(next, originForRedirect(request)), 303);
}
