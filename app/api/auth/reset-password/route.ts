import { resetCustomerPassword } from "@/lib/customer-auth";

type ResetPasswordBody = {
  token?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordBody;
    const user = await resetCustomerPassword({
      token: body.token || "",
      password: body.password || "",
    });

    return Response.json({ user });
  } catch {
    return Response.json(
      { error: "Password reset failed. Please request a new reset link and try again." },
      { status: 400 }
    );
  }
}
