interface InviteEmailProps {
    inviteeName?: string;
    orgName: string;
    orgSlug: string;
    inviterName: string;
    role: string;
    inviteUrl: string;
}

export function renderInviteEmail({
    inviteeName,
    orgName,
    orgSlug,
    inviterName,
    role,
    inviteUrl,
}: InviteEmailProps): { subject: string; html: string; text: string } {
    const greeting = inviteeName ? `Hi ${inviteeName},` : "Hello,";
    const subject = `${inviterName} invited you to join ${orgName} on NexusFlow`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">NexusFlow</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Project Management Reimagined</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#111827;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on NexusFlow as a <strong>${role}</strong>.
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.6;">
                NexusFlow is a powerful project management tool that helps engineering teams ship faster with Kanban boards, sprints, AI assistance, and real-time collaboration.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:#6366f1;border-radius:8px;padding:14px 32px;">
                    <a href="${inviteUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;letter-spacing:-0.2px;">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">
                Or copy this link: <a href="${inviteUrl}" style="color:#6366f1;">${inviteUrl}</a>
              </p>
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} NexusFlow · <a href="https://nexusflow.app" style="color:#6366f1;text-decoration:none;">nexusflow.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    const text = `${greeting}\n\n${inviterName} has invited you to join ${orgName} on NexusFlow as a ${role}.\n\nAccept your invitation: ${inviteUrl}\n\nIf you didn't expect this, you can ignore this email.\n\n— The NexusFlow Team`;

    return { subject, html, text };
}
