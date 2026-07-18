/**
 * Shared HTML shell for all transactional emails.
 *
 * Mirrors the visual language of the app's auth UI (page.tsx):
 * - dark, glassy rounded card
 * - primary + emerald glow accents
 * - circular icon badge
 * - uppercase eyebrow label
 * - rounded, shadowed CTA button
 *
 * Email clients don't support Tailwind or most modern CSS (gradients,
 * backdrop-blur, box-shadow are inconsistently supported), so everything
 * here is inlined and table-based with safe fallbacks.
 */

export interface BaseTemplateOptions {
  /** Small uppercase label above the heading, e.g. "WELCOME BACK" */
  eyebrow: string;
  /** Main heading, e.g. "Verify your email address" */
  heading: string;
  /** Icon badge glyph/emoji shown in the circular badge (keep it simple, emoji render everywhere) */
  icon?: string;
  /** Accent used for the icon badge + eyebrow color. Defaults to the primary brand color. */
  accent?: 'primary' | 'warning';
  /** Inner body content (HTML string) - paragraphs, button, etc. */
  bodyHtml: string;
  /** Optional small print / footer note below the divider */
  footerNote?: string;
  /** Product name shown in header + footer */
  productName?: string;
}

// Design tokens, kept close to the app's CSS variables.
export const theme = {
  bg: '#0b0d12',
  cardBg: '#12141b',
  border: 'rgba(255,255,255,0.08)',
  primary: '#6366f1',
  primarySoft: 'rgba(99,102,241,0.12)',
  primaryBorder: 'rgba(99,102,241,0.25)',
  emerald: '#10b981',
  textPrimary: '#f4f4f5',
  textMuted: '#9ca3af',
  destructive: '#f87171',
};

export function renderBaseTemplate({
  eyebrow,
  heading,
  icon = '🔐',
  bodyHtml,
  footerNote,
  productName = 'YourApp',
  accent = 'primary',
}: BaseTemplateOptions): string {
  const accentColor = accent === 'warning' ? theme.destructive : theme.primary;
  const accentSoft =
    accent === 'warning' ? 'rgba(248,113,113,0.12)' : theme.primarySoft;
  const accentBorder =
    accent === 'warning' ? 'rgba(248,113,113,0.25)' : theme.primaryBorder;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>${heading}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${theme.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${theme.bg}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

            <!-- Top glow strip, approximates the primary gradient line in page.tsx -->
            <tr>
              <td style="height:2px; background-color:${accentColor}; border-radius:2px; opacity:0.6; font-size:0; line-height:0;">&nbsp;</td>
            </tr>

            <tr>
              <td style="height:16px; font-size:0; line-height:0;">&nbsp;</td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="background-color:${theme.cardBg}; border:1px solid ${theme.border}; border-radius:24px; padding:40px 32px;">

                <!-- Icon badge -->
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 24px auto;">
                  <tr>
                    <td align="center" valign="middle" width="80" height="80" style="width:80px; height:80px; border-radius:24px; background-color:${accentSoft}; border:1px solid ${accentBorder}; font-size:34px;">
                      ${icon}
                    </td>
                  </tr>
                </table>

                <!-- Eyebrow -->
                <p style="margin:0 0 12px 0; text-align:center; font-size:11px; font-weight:600; letter-spacing:2.5px; text-transform:uppercase; color:${accentColor};">
                  ${eyebrow}
                </p>

                <!-- Heading -->
                <h1 style="margin:0 0 12px 0; text-align:center; font-size:24px; line-height:1.3; font-weight:600; letter-spacing:-0.02em; color:${theme.textPrimary};">
                  ${heading}
                </h1>

                <!-- Body -->
                <div style="margin-top:20px; font-size:14px; line-height:1.7; color:${theme.textMuted};">
                  ${bodyHtml}
                </div>

              </td>
            </tr>

            <tr>
              <td style="height:28px; font-size:0; line-height:0;">&nbsp;</td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:0 8px;">
                <p style="margin:0 0 6px 0; font-size:12px; color:${theme.textMuted};">
                  ${footerNote ?? `Sent by ${productName}. If you have questions, just reply to this email.`}
                </p>
                <p style="margin:0; font-size:12px; color:${theme.textMuted};">
                  &copy; ${new Date().getFullYear()} ${productName}. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Primary CTA button, styled like the rounded-xl shadowed buttons in page.tsx */
export function renderButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px auto;">
    <tr>
      <td align="center" style="border-radius:12px; background-color:${theme.primary};">
        <a href="${url}" target="_blank"
           style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:12px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:14px 0 0 0; font-size:12px; line-height:1.6; color:${theme.textMuted}; text-align:center; word-break:break-all;">
    Or copy and paste this link into your browser:<br />
    <a href="${url}" target="_blank" style="color:${theme.primary}; text-decoration:underline;">${url}</a>
  </p>`;
}
