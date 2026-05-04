import { isSuperAdminSession } from "@/lib/admin-auth";
import { createAdminUser, getAdminUsers } from "@/lib/store";
import type { CreateAdminUserInput } from "@/types";

export async function GET() {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  return Response.json({ users: await getAdminUsers() });
}

export async function POST(request: Request) {
  if (!(await isSuperAdminSession())) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const input = (await request.json()) as CreateAdminUserInput;
    const user = await createAdminUser(input);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Admin user create failed" },
      { status: 400 }
    );
  }
}
