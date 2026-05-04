import { loginCustomer } from "@/lib/customer-auth";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const user = await loginCustomer({
      email: body.email || "",
      password: body.password || "",
    });

    return Response.json({ user });
  } catch {
    return Response.json(
      { error: "Login failed. Please check your details and try again." },
      { status: 401 }
    );
  }
}
