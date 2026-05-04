import { isSuperAdminSession } from "@/lib/admin-auth";
import {
  createBannerImage,
  getBannerImages,
} from "@/lib/store";
import type { CreateBannerImageInput } from "@/types";

export async function GET() {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  return Response.json({
    banners: await getBannerImages({ includeInactive: true }),
  });
}

export async function POST(request: Request) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const input = (await request.json()) as CreateBannerImageInput;
    const banner = await createBannerImage(input);
    return Response.json({ banner }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Banner create failed" },
      { status: 400 }
    );
  }
}
