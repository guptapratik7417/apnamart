import {
  createAdminSession,
  verifyAdminCredentials,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  const account = body.username && body.password
    ? await verifyAdminCredentials({
        username: body.username,
        password: body.password,
      })
    : body.password
      ? await verifyAdminPassword(body.password)
      : null;

  if (!account) {
    return Response.json({ error: "Invalid admin credentials" }, { status: 401 });
  }

  await createAdminSession(account);
  return Response.json({ ok: true, user: account });
}
