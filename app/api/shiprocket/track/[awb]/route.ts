import { isAdminSession } from "@/lib/admin-auth";
import { trackShiprocketAwb } from "@/lib/shiprocket";

type ShiprocketTrackRouteContext = {
  params: Promise<{ awb: string }>;
};

export async function GET(
  _request: Request,
  context: ShiprocketTrackRouteContext
) {
  if (!(await isAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { awb } = await context.params;
  if (!awb.trim()) {
    return Response.json({ error: "AWB code is required." }, { status: 400 });
  }

  try {
    const tracking = await trackShiprocketAwb(awb);
    return Response.json({ tracking });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Shiprocket tracking failed.",
      },
      { status: 400 }
    );
  }
}
