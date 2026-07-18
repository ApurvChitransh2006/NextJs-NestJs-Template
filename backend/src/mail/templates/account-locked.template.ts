import { renderBaseTemplate, theme } from './base.template';

export function accountLockedTemplate(minutes: number): string {
  const bodyHtml = `
    <p style="margin:0; text-align:center;">
      We locked your account for <strong style="color:${theme.textPrimary};">${minutes} minutes</strong> after several failed sign-in attempts.
    </p>
    <p style="margin:16px 0 0 0; text-align:center;">
      If this wasn&apos;t you, we recommend resetting your password as soon as the lock expires.
    </p>
  `;

  return renderBaseTemplate({
    eyebrow: 'Security alert',
    heading: 'Your account was temporarily locked',
    icon: '⚠️',
    accent: 'warning',
    bodyHtml,
  });
}
