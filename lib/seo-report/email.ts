import { Resend } from "resend";
import { optionalEnv } from "./env";
import type { SignalAudit } from "./types";

export async function sendLeadEmail(email: string, firstName: string, audit: SignalAudit): Promise<void> {
  const apiKey = optionalEnv("RESEND_API_KEY");
  const fromEmail = optionalEnv("SIGNAL_FROM_EMAIL");
  const fromName = optionalEnv("SIGNAL_FROM_NAME") || "Vince at Hubbly";
  const replyTo = optionalEnv("SIGNAL_REPLY_TO") || "vince@hubbly.io";
  if (!apiKey || !fromEmail) return;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: email,
    replyTo,
    subject: `Your Hubbly Signal audit for ${audit.domain}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b0f14;color:#f4f7fb;padding:32px">
        <h1 style="color:#ff6b35">Your audit is ready</h1>
        <p>Hi ${firstName},</p>
        <p>Your Hubbly Signal audit for <strong>${audit.domain}</strong> is ready.</p>
        <p>Open it here: <a style="color:#ff6b35" href="/audit/report/${audit.id}">/audit/report/${audit.id}</a></p>
        <p>Signal feeds Hubbly OS.</p>
      </div>
    `
  });
}
