import { appProperties } from "@/config/app-properties";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type ResendResponse = {
  id?: string;
  message?: string;
  error?: string;
};

function emailProvider() {
  return process.env.EMAIL_PROVIDER || appProperties.email.provider;
}

function emailFrom() {
  return process.env.EMAIL_FROM || "";
}

export async function sendEmail(input: SendEmailInput) {
  if (emailProvider() !== "resend") {
    throw new Error(appProperties.email.missingConfigMessage);
  }

  const apiKey = process.env.RESEND_API_KEY || "";
  const from = emailFrom();
  if (!apiKey || !from) {
    throw new Error(appProperties.email.missingConfigMessage);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as ResendResponse;

  if (!response.ok) {
    throw new Error(
      payload.message || payload.error || "Password reset email could not be sent."
    );
  }

  return payload.id || "";
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
  expiresMinutes: number;
}) {
  await sendEmail({
    to: input.to,
    subject: appProperties.email.passwordResetSubject,
    text: [
      "You requested a password reset for your ApnaMart account.",
      "",
      `Open this link to set a new password: ${input.resetUrl}`,
      "",
      `This link expires in ${input.expiresMinutes} minutes.`,
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
        <h2>Reset your ApnaMart password</h2>
        <p>You requested a password reset for your ApnaMart account.</p>
        <p>
          <a href="${input.resetUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">
            Set new password
          </a>
        </p>
        <p>This link expires in ${input.expiresMinutes} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
