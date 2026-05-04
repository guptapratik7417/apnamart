import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { saveSupportMedia } from "@/lib/support-media";
import { createSupportTicket, getSupportTicketsByUserId } from "@/lib/store";
import type { CreateSupportTicketInput } from "@/types";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  return NextResponse.json({
    tickets: await getSupportTicketsByUserId(session.id),
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    const contentType = request.headers.get("content-type") || "";
    let body: CreateSupportTicketInput;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData
        .getAll("media")
        .filter((item): item is File => item instanceof File);
      body = {
        customer_name: String(formData.get("customer_name") || ""),
        customer_email: String(formData.get("customer_email") || ""),
        phone: String(formData.get("phone") || ""),
        order_id: String(formData.get("order_id") || ""),
        subject: String(formData.get("subject") || ""),
        message: String(formData.get("message") || ""),
        media_urls: await saveSupportMedia(files),
      };
    } else {
      body = (await request.json()) as CreateSupportTicketInput;
    }

    const ticket = await createSupportTicket({
      ...body,
      customer_name: session?.full_name || body.customer_name,
      customer_email: session?.email || body.customer_email,
      phone: session?.phone || body.phone,
      user_id: session?.id || null,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Support request failed" },
      { status: 400 }
    );
  }
}
