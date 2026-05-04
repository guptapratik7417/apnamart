import { revalidatePath } from "next/cache";
import type { SiteConfigRecord } from "@/config/app-properties";
import { isSuperAdminSession } from "@/lib/admin-auth";
import {
  getSiteConfigRecords,
  updateSiteConfigRecords,
} from "@/lib/site-config";

export async function GET() {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  return Response.json({ records: await getSiteConfigRecords() });
}

export async function PUT(request: Request) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { records?: SiteConfigRecord[] };
    if (!Array.isArray(body.records)) {
      return Response.json({ error: "records must be an array" }, { status: 400 });
    }

    await updateSiteConfigRecords(body.records);
    revalidatePath("/", "layout");
    return Response.json({ records: await getSiteConfigRecords() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Config update failed" },
      { status: 400 }
    );
  }
}
