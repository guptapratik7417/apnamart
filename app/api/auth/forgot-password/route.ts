import { requestPasswordReset } from "@/lib/customer-auth";

type ForgotPasswordBody = {
  email?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ForgotPasswordBody;
    const origin = new URL(request.url).origin;
    await requestPasswordReset(body.email || "", origin);

    return Response.json({
      ok: true,
      message:
        "If an account exists for that email, password reset instructions have been sent.",
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Password reset email could not be sent. Please try again later.",
      },
      { status: 400 }
    );
  }
}
