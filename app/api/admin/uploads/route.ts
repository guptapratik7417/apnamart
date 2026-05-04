import { NextRequest, NextResponse } from "next/server";
import { canManageCatalogSession, isSuperAdminSession } from "@/lib/admin-auth";
import { saveAdminImage } from "@/lib/admin-media";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const folder = String(formData.get("folder") || "general");
    const canUpload =
      folder === "products" || folder === "categories"
        ? await canManageCatalogSession()
        : await isSuperAdminSession();

    if (!canUpload) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
    }

    const urls = await Promise.all(files.map((file) => saveAdminImage(file, folder)));
    return NextResponse.json({ urls });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image upload failed" },
      { status: 400 }
    );
  }
}
