import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { recordSubscriber } from "@/lib/store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const ok = recordSubscriber(email, String(formData.get("source") || "subscribe"));
  revalidatePath("/admin/subscribers");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
  return NextResponse.redirect(new URL(ok ? "/subscribe/confirmed" : "/subscribe?error=1", origin), 303);
}
