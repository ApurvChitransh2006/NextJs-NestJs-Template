import { renderBaseTemplate, renderButton } from './base.template';

export function resetPasswordTemplate(url: string): string {
  const bodyHtml = `
    <p style="margin:0; text-align:center;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    ${renderButton('Reset password', url)}
    <p style="margin:20px 0 0 0; text-align:center; font-size:12px; color:#6b7280;">
      This link expires in <strong>1 hour</strong>. If you didn&apos;t request this, you can safely ignore this email.
    </p>
  `;

  return renderBaseTemplate({
    eyebrow: 'Account security',
    heading: 'Reset your password',
    icon: '🔑',
    bodyHtml,
  });
}
