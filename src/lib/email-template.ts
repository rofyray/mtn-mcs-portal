type EmailCta = {
  label: string;
  url: string;
};

type EmailHighlight = {
  label?: string;
  value: string;
};

type EmailTemplateOptions = {
  title: string;
  preheader?: string;
  message: string | string[];
  highlights?: EmailHighlight[];
  bullets?: string[];
  cta?: EmailCta;
  footerNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderParagraphs(message: string | string[]) {
  const lines = Array.isArray(message) ? message : [message];
  return lines
    .filter((line) => line.trim().length > 0)
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#1f2937;">${escapeHtml(
          line
        )}</p>`
    )
    .join("");
}

function renderHighlights(highlights?: EmailHighlight[]) {
  if (!highlights || highlights.length === 0) {
    return "";
  }
  const items = highlights
    .map((highlight) => {
      const label = highlight.label ? `<div style="font-size:12px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">${escapeHtml(highlight.label)}</div>` : "";
      return `
        <div style="padding:14px 16px;border:1px solid #ece2c9;border-radius:12px;background:#fff9e6;margin-bottom:12px;">
          ${label}
          <div style="font-size:20px;font-weight:700;letter-spacing:0.18em;color:#111827;">${escapeHtml(
            highlight.value
          )}</div>
        </div>
      `;
    })
    .join("");
  return `<div>${items}</div>`;
}

function renderBullets(bullets?: string[]) {
  if (!bullets || bullets.length === 0) {
    return "";
  }
  const items = bullets
    .map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`)
    .join("");
  return `<ul style="margin:0 0 12px;padding-left:20px;font-size:15px;line-height:1.6;color:#1f2937;">${items}</ul>`;
}

export function buildEmailTemplate(options: EmailTemplateOptions) {
  const {
    title,
    preheader,
    message,
    highlights,
    bullets,
    cta,
    footerNote,
  } = options;

  const safeTitle = escapeHtml(title);
  const preheaderText = preheader ? escapeHtml(preheader) : "";
  const messageHtml = renderParagraphs(message);
  const highlightHtml = renderHighlights(highlights);
  const bulletHtml = renderBullets(bullets);
  const footerCopy =
    footerNote ?? "This email was sent by MTN Community Shop Partner Management.";

  const ctaHtml = cta
    ? `
      <div style="margin:20px 0 6px;">
        <a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#ffcb05;color:#0b1120;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;">
          ${escapeHtml(cta.label)}
        </a>
      </div>
    `
    : "";

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f3ea;">
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;color:transparent;">${preheaderText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ea;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:18px;border:1px solid #eee2c9;overflow:hidden;">
            <tr>
              <td style="padding:18px 28px;border-top:6px solid #ffcb05;">
                <div style="font-size:18px;font-weight:700;color:#0b1120;margin:0;">MTN Community Shop</div>
                <div style="font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#6b7280;margin-top:4px;">Partner Management</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0b1120;">${safeTitle}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 18px;">
                ${messageHtml}
                ${highlightHtml}
                ${bulletHtml}
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px;border-top:1px solid #efe7d5;font-size:12px;line-height:1.6;color:#6b7280;">
                ${escapeHtml(footerCopy)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  const messageLines = Array.isArray(message) ? message : [message];
  const highlightLines = (highlights ?? []).map((item) =>
    item.label ? `${item.label}: ${item.value}` : item.value
  );
  const bulletLines = (bullets ?? []).map((item) => `- ${item}`);
  const text = [
    title,
    "",
    ...messageLines,
    "",
    ...highlightLines,
    ...(highlightLines.length ? [""] : []),
    ...bulletLines,
    ...(cta ? ["", `${cta.label}: ${cta.url}`] : []),
    "",
    footerCopy,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { html, text };
}
