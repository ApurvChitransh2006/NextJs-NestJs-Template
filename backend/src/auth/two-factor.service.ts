import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

const BACKUP_CODE_COUNT = 10;

/**
 * Wraps TOTP (RFC 6238) secret generation, QR provisioning, and one-time
 * backup-code handling. Kept separate from AuthService so the 2FA math has
 * no dependency on request/DB concerns.
 */
@Injectable()
export class TwoFactorService {
  constructor(private config: ConfigService) {}

  private get issuer() {
    return this.config.get<string>('appName') || 'NN Template';
  }

  /** Generates a new base32 TOTP secret and its otpauth:// provisioning QR. */
  async generateSetup(email: string): Promise<{ secret: string; qrCodeDataUrl: string }> {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, this.issuer, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret, qrCodeDataUrl };
  }

  /** Verifies a 6-digit TOTP code against the stored secret (±1 time-step window). */
  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.check(token, secret);
    } catch {
      return false;
    }
  }

  /** Generates N human-friendly single-use backup codes, e.g. "3F7K-9QXZ". */
  generateBackupCodes(count = BACKUP_CODE_COUNT): string[] {
    const codes: string[] = [];
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += alphabet[randomInt(alphabet.length)];
        if (j === 3) code += '-';
      }
      codes.push(code);
    }
    return codes;
  }

  async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
  }

  /**
   * Checks a submitted backup code against the stored hashes. Returns the
   * remaining (unconsumed) hash list on success, or null if it didn't match
   * anything — the caller decides what to do in each case.
   */
  async consumeBackupCode(
    submitted: string,
    hashedCodes: string[],
  ): Promise<{ remaining: string[] } | null> {
    for (let i = 0; i < hashedCodes.length; i++) {
      if (await bcrypt.compare(submitted.trim().toUpperCase(), hashedCodes[i])) {
        const remaining = [...hashedCodes];
        remaining.splice(i, 1);
        return { remaining };
      }
    }
    return null;
  }
}
