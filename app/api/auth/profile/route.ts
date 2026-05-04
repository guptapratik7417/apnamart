import {
  getCustomerSession,
  updateCustomerProfile,
} from "@/lib/customer-auth";

export async function GET() {
  const user = await getCustomerSession();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({ user });
}

export async function PUT(request: Request) {
  const user = await getCustomerSession();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      full_name?: string;
      phone?: string;
    };
    const updatedUser = await updateCustomerProfile(user.id, {
      full_name: body.full_name || "",
      phone: body.phone,
    });

    return Response.json({ user: updatedUser });
  } catch {
    return Response.json(
      { error: "Profile could not be updated. Please check your details and try again." },
      { status: 400 }
    );
  }
}
