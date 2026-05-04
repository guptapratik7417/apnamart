import { getCustomerSession } from "@/lib/customer-auth";
import { saveSupportMedia } from "@/lib/support-media";
import { createSupportTicketReply } from "@/lib/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getCustomerSession();
  if (!session) {
    return Response.json({ error: "Login required" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") || "";
    let message = "";
    let mediaUrls: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData
        .getAll("media")
        .filter((item): item is File => item instanceof File);
      message = String(formData.get("message") || "");
      mediaUrls = await saveSupportMedia(files);
    } else {
      const body = (await request.json()) as { message?: string };
      message = body.message || "";
    }

    const reply = await createSupportTicketReply({
      ticket_id: id,
      author_type: "customer",
      author_name: session.full_name || session.email,
      message,
      media_urls: mediaUrls,
      user_id: session.id,
    });
    return Response.json({ reply }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Reply create failed" },
      { status: 400 }
    );
  }
}
