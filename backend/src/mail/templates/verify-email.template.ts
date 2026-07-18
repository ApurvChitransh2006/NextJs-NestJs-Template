import { renderBaseTemplate, renderButton } from './base.template';

export function verifyEmailTemplate(url: string): string {
  const bodyHtml = `
    <p style="margin:0; text-align:center;">
      Welcome! Please confirm this is your email address to finish setting up your account.
    </p>
    ${renderButton('Verify email address', url)}
    <p style="margin:20px 0 0 0; text-align:center; font-size:12px; color:#6b7280;">
      This link expires in <strong>24 hours</strong>.
    </p>
  `;

  return renderBaseTemplate({
    eyebrow: 'Welcome aboard',
    heading: 'Verify your email address',
    icon: '✉️',
    bodyHtml,
  });
}
