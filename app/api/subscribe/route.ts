import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { originForRedirect } from "@/lib/site";
import { recordSubscriber } from "@/lib/store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const ok = recordSubscriber(email, String(formData.get("source") || "subscribe"));
  revalidatePath("/admin/subscribers");
  const origin = originForRedirect(request);
  return NextResponse.redirect(new URL(ok ? "/subscribe/confirmed" : "/subscribe?error=1", origin), 303);
}
