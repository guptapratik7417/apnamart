import { revalidatePath } from "next/cache";
import { isSuperAdminSession } from "@/lib/admin-auth";
import {
  getSiteConfig,
  normalizeSiteConfig,
  updateSiteConfig,
} from "@/lib/site-config";

export async function GET() {
  return Response.json({ config: await getSiteConfig() });
}

export async function PUT(request: Request) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { config?: unknown };
    const config = await updateSiteConfig(normalizeSiteConfig(body.config));
    revalidatePath("/", "layout");
    return Response.json({ config });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Config update failed" },
      { status: 400 }
    );
  }
}
