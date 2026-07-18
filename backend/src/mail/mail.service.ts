import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  accountLockedTemplate,
} from './templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('mail.host'),
      port: this.config.get('mail.port'),
      secure: false,
      auth: {
        user: this.config.get('mail.user'),
        pass: this.config.get('mail.password'),
      },
    });
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.config.get('mail.from'),
        to,
        subject,
        html,
      });
    } catch (err) {
      // In dev without real SMTP creds, log instead of throwing so the flow
      // isn't blocked. In production, replace with real error handling/retries.
      this.logger.warn(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const url = `${this.config.get('frontendUrl')}/verify-email?token=${token}`;
    await this.send(
      to,
      'Verify your email address',
      verifyEmailTemplate(url),
    );
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `${this.config.get('frontendUrl')}/reset-password?token=${token}`;
    await this.send(
      to,
      'Reset your password',
      resetPasswordTemplate(url),
    );
  }

  async sendAccountLockedEmail(to: string, minutes: number) {
    await this.send(
      to,
      'Your account was temporarily locked',
      accountLockedTemplate(minutes),
    );
  }
}
