import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const user = await getAdminSession();
  return Response.json({ authenticated: Boolean(user), user });
}
