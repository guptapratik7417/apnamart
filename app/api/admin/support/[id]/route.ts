import { canManageSupportSession } from "@/lib/admin-auth";
import { updateSupportTicket } from "@/lib/store";
import type { SupportTicketStatus } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await canManageSupportSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: SupportTicketStatus;
      admin_notes?: string | null;
    };
    const ticket = await updateSupportTicket(id, body);
    return Response.json({ ticket });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Support update failed" },
      { status: 400 }
    );
  }
}
