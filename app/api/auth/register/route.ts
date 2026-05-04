import { registerCustomer } from "@/lib/customer-auth";

type RegisterBody = {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const user = await registerCustomer({
      email: body.email || "",
      password: body.password || "",
      full_name: body.full_name || "",
      phone: body.phone,
    });

    return Response.json({ user }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Registration failed. Please check your details and try again." },
      { status: 400 }
    );
  }
}
