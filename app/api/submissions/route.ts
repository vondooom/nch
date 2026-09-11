import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { recordPublicSubmission } from "@/lib/store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const kind = recordPublicSubmission(formData);
  revalidatePath("/admin/submissions");
  const next = kind === "dog" ? "/dog-of-the-week/nominate?ok=1" : "/field-stories/submit?ok=1";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
  return NextResponse.redirect(new URL(next, origin), 303);
}
