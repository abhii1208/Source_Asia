import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getTicketEmailConfigState } from "@/lib/email/send-ticket-email";

type DebugEmailResponse = {
  resendConfigured: boolean;
  emailFromConfigured: boolean;
  appUrlConfigured: boolean;
  testEmailAttempted?: boolean;
  testEmailSent?: boolean;
  testEmailReason?: "missing_config" | "missing_to" | "send_failed";
};

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const configState = getTicketEmailConfigState();
  const appUrlConfigured = Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim());
  const response: DebugEmailResponse = {
    resendConfigured: configState.resendConfigured,
    emailFromConfigured: configState.emailFromConfigured,
    appUrlConfigured
  };

  const url = new URL(request.url);
  const shouldSendTest = url.searchParams.get("test") === "true";
  const recipient = url.searchParams.get("to")?.trim() ?? "";

  if (!shouldSendTest) {
    return NextResponse.json(response, { status: 200 });
  }

  response.testEmailAttempted = true;

  if (!configState.configured) {
    response.testEmailSent = false;
    response.testEmailReason = "missing_config";
    return NextResponse.json(response, { status: 200 });
  }

  if (!recipient) {
    response.testEmailSent = false;
    response.testEmailReason = "missing_to";
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "",
      to: recipient,
      subject: "FlyAhead Email Debug Test",
      html: "<p>This is a FlyAhead development email configuration test.</p>"
    });
    response.testEmailSent = true;
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("FlyAhead debug email test failed.", error);
    response.testEmailSent = false;
    response.testEmailReason = "send_failed";
    return NextResponse.json(response, { status: 200 });
  }
}
