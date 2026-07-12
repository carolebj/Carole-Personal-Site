const COLORS = {
  page: "#fbf8f5",
  card: "#ffffff",
  plum: "#4b1738",
  rose: "#c86f73",
  peach: "#f4b39c",
  cream: "#f8dfbd",
  text: "#241d21",
  muted: "#70757b",
  border: "#eadfd9",
};

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatReceivedAt(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Porto-Novo",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).replace(" à ", " · ");
}

export function renderContactEmail({ name, email, subject, message, receivedAt = new Date() }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br>");
  const safeDate = escapeHtml(formatReceivedAt(receivedAt));
  const initial = escapeHtml(Array.from(name.trim())[0]?.toLocaleUpperCase("fr") || "C");
  const replyHref = escapeHtml(
    `mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}`,
  );

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.page};color:${COLORS.text};font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Nouveau message de ${safeName} depuis carolebj.com.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${COLORS.page};">
      <tr>
        <td>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
            <tr>
              <td width="20%" height="12" style="background:${COLORS.cream};font-size:0;line-height:0;">&nbsp;</td>
              <td width="30%" height="12" style="background:${COLORS.peach};font-size:0;line-height:0;">&nbsp;</td>
              <td width="30%" height="12" style="background:${COLORS.rose};font-size:0;line-height:0;">&nbsp;</td>
              <td width="20%" height="12" style="background:${COLORS.plum};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:44px 18px 34px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="58" height="58" align="center" valign="middle" style="width:58px;height:58px;border-radius:21px;background:${COLORS.plum};color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:58px;">CT</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:38px;color:${COLORS.rose};font-size:12px;line-height:18px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">
                NOUVEAU MESSAGE DEPUIS CAROLEBJ.COM
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 0 34px;color:${COLORS.plum};font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:43px;font-weight:400;">
                ${safeSubject}
              </td>
            </tr>
            <tr>
              <td style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:16px;padding:34px 36px;box-shadow:0 12px 32px rgba(75,23,56,0.06);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="72" valign="top" style="width:72px;padding-right:18px;">
                      <div style="width:64px;height:64px;border-radius:50%;background:${COLORS.cream};color:${COLORS.plum};font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:64px;text-align:center;">${initial}</div>
                    </td>
                    <td valign="middle">
                      <div style="color:${COLORS.plum};font-size:21px;line-height:28px;font-weight:700;">${safeName}</div>
                      <div style="padding-top:4px;color:${COLORS.rose};font-size:15px;line-height:22px;">${safeEmail}</div>
                      <div style="padding-top:3px;color:${COLORS.muted};font-size:14px;line-height:21px;">${safeDate}</div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top:28px;border-bottom:1px solid ${COLORS.cream};font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top:28px;color:${COLORS.text};font-size:17px;line-height:29px;">
                      ${safeMessage}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top:30px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="center" style="border-radius:9px;background:${COLORS.plum};">
                            <a href="${replyHref}" style="display:inline-block;padding:15px 24px;color:#ffffff;font-size:16px;line-height:20px;font-weight:700;text-decoration:none;border-radius:9px;">Répondre à ${safeName}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:38px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-top:1px solid ${COLORS.peach};font-size:0;line-height:0;">&nbsp;</td>
                    <td width="34" align="center" style="width:34px;color:${COLORS.peach};font-size:16px;line-height:16px;">•</td>
                    <td style="border-top:1px solid ${COLORS.peach};font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:26px;color:${COLORS.muted};font-size:12px;line-height:20px;">
                Ce message a été envoyé depuis le formulaire de contact<br>de <span style="color:${COLORS.rose};">carolebj.com</span>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
