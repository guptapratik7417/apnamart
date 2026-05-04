import { canManageSupportSession, getAdminSession } from "@/lib/admin-auth";
import { saveSupportMedia } from "@/lib/support-media";
import { createSupportTicketReply } from "@/lib/store";
import type { SupportReplyVisibility } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session || !(await canManageSupportSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") || "";
    let message = "";
    let visibility: SupportReplyVisibility = "public";
    let mediaUrls: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData
        .getAll("media")
        .filter((item): item is File => item instanceof File);
      message = String(formData.get("message") || "");
      visibility =
        formData.get("visibility") === "private" ? "private" : "public";
      mediaUrls = await saveSupportMedia(files);
    } else {
      const body = (await request.json()) as {
        message?: string;
        visibility?: SupportReplyVisibility;
      };
      message = body.message || "";
      visibility = body.visibility || "public";
    }

    const reply = await createSupportTicketReply({
      ticket_id: id,
      author_type: "admin",
      author_name: session.displayName || session.username,
      visibility,
      message,
      media_urls: mediaUrls,
    });
    return Response.json({ reply }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Reply create failed" },
      { status: 400 }
    );
  }
}
