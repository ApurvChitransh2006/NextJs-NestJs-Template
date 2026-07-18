import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService, ACCOUNT_LOCK_DURATION_MS } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { TwoFactorService } from './two-factor.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from '@prisma/client';

export interface DeviceInfo {
  deviceName?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
    private twoFactor: TwoFactorService,
  ) {}

  // ---------------- Login-activity audit trail ----------------
  private logActivity(
    userId: string,
    success: boolean,
    device: DeviceInfo,
    reason?: string,
  ) {
    // Fire-and-forget: an audit-log failure should never block auth itself.
    void this.prisma.loginActivity
      .create({
        data: {
          userId,
          success,
          reason,
          ipAddress: device.ipAddress,
          userAgent: device.deviceName,
        },
      })
      .catch(() => undefined);
  }

  async register(dto: RegisterDto) {
    const user = await this.users.createLocalUser(dto);

    const token = randomUUID();
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    await this.mail.sendVerificationEmail(user.email, token);

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.verificationToken.findUnique({ where: { token } });

    if (!record) {
      throw new BadRequestException('Invalid verification token');
    }
    if (record.expiresAt < new Date()) {
      await this.prisma.verificationToken.delete({ where: { id: record.id } });
      throw new BadRequestException('Verification token has expired');
    }

    await this.users.markEmailVerified(record.userId);
    await this.prisma.verificationToken.delete({ where: { id: record.id } });

    return { message: 'Email verified successfully' };
  }

  async validateUser(email: string, password: string, device: DeviceInfo = {}) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (this.users.isLocked(user)) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil!.getTime() - Date.now()) / 60000,
      );
      this.logActivity(user.id, false, device, 'account_locked');
      throw new ForbiddenException(
        `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const justLocked = await this.users.recordFailedLogin(user.id);
      this.logActivity(user.id, false, device, 'bad_password');
      if (justLocked) {
        void this.mail.sendAccountLockedEmail(user.email, ACCOUNT_LOCK_DURATION_MS / 60000);
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.users.resetFailedLogins(user.id);
    return user;
  }

  async login(dto: LoginDto, device: DeviceInfo) {
    const user = await this.validateUser(dto.email, dto.password, device);

    // Password verified but a second factor is required before we issue
    // any real tokens. Hand back a short-lived, single-purpose challenge
    // token the client must pair with a TOTP/backup code.
    if (user.twoFactorEnabled) {
      const challengeToken = await this.jwt.signAsync(
        { sub: user.id, purpose: '2fa-challenge' },
        { secret: this.config.get('jwt.accessSecret'), expiresIn: '5m' },
      );
      return { twoFactorRequired: true, challengeToken } as const;
    }

    const tokens = await this.issueTokenPair(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken, device);
    this.logActivity(user.id, true, device);

    return {
      twoFactorRequired: false as const,
      user: this.users.sanitize(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ---------- Two-factor authentication ----------

  /** Step 1 of enabling 2FA: generate (but don't yet activate) a secret + QR. */
  async requestTwoFactorSetup(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const { secret, qrCodeDataUrl } = await this.twoFactor.generateSetup(user.email);
    await this.users.setPendingTwoFactorSecret(userId, secret);

    return { secret, qrCodeDataUrl };
  }

  /** Step 2: prove possession of the authenticator app, then activate 2FA. */
  async confirmTwoFactorSetup(userId: string, code: string) {
    const user = await this.users.findById(userId);
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Start two-factor setup first');
    }

    if (!this.twoFactor.verifyToken(user.twoFactorSecret, code)) {
      throw new BadRequestException('Invalid verification code');
    }

    const backupCodes = this.twoFactor.generateBackupCodes();
    const hashed = await this.twoFactor.hashBackupCodes(backupCodes);
    await this.users.enableTwoFactor(userId, hashed);

    // Backup codes are shown exactly once — the server never returns the
    // plaintext codes again after this response.
    return { message: 'Two-factor authentication enabled', backupCodes };
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.users.findById(userId);
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const validTotp = this.twoFactor.verifyToken(user.twoFactorSecret, code);
    const validBackup = validTotp
      ? null
      : await this.twoFactor.consumeBackupCode(code, user.twoFactorBackupCodes);

    if (!validTotp && !validBackup) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.users.disableTwoFactor(userId);
    return { message: 'Two-factor authentication disabled' };
  }

  /** Step 3: exchange the challenge token + a valid code for real tokens. */
  async completeTwoFactorLogin(challengeToken: string, code: string, device: DeviceInfo) {
    let payload: { sub: string; purpose: string };
    try {
      payload = await this.jwt.verifyAsync(challengeToken, {
        secret: this.config.get('jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Two-factor challenge expired, please log in again');
    }
    if (payload.purpose !== '2fa-challenge') {
      throw new UnauthorizedException('Invalid challenge token');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor authentication is not available');
    }

    const validTotp = this.twoFactor.verifyToken(user.twoFactorSecret, code);
    let usedBackupCode = false;

    if (!validTotp) {
      const backupResult = await this.twoFactor.consumeBackupCode(
        code,
        user.twoFactorBackupCodes,
      );
      if (!backupResult) {
        this.logActivity(user.id, false, device, '2fa_failed');
        throw new UnauthorizedException('Invalid two-factor code');
      }
      await this.users.consumeBackupCode(user.id, backupResult.remaining);
      usedBackupCode = true;
    }

    const tokens = await this.issueTokenPair(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken, device);
    this.logActivity(user.id, true, device, usedBackupCode ? '2fa_backup_code' : undefined);

    return {
      user: this.users.sanitize(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async listLoginActivity(userId: string, take = 20) {
    return this.prisma.loginActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  private async issueTokenPair(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('jwt.accessSecret'),
      expiresIn: this.config.get('jwt.accessExpiresIn'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('jwt.refreshSecret'),
      expiresIn: this.config.get('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, rawToken: string, device: DeviceInfo) {
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const decoded: any = this.jwt.decode(rawToken);
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.refreshToken.create({
      data: {
        userId,
        hashedToken,
        expiresAt,
        deviceName: device.deviceName,
        ipAddress: device.ipAddress,
      },
    });
  }

  async refreshTokens(userId: string, rawRefreshToken: string, device: DeviceInfo) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User no longer exists');

    // Find the matching stored (non-revoked, non-expired) refresh token by
    // comparing hashes, since we never store the raw token.
    const candidates = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    let matched: RefreshToken | null = null;
    for (const candidate of candidates) {
      if (await bcrypt.compare(rawRefreshToken, candidate.hashedToken)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      // Possible token reuse/theft - revoke all sessions defensively.
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new pair, store new hash.
    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokenPair(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken, device);

    return tokens;
  }

  async logout(userId: string, rawRefreshToken?: string) {
    if (!rawRefreshToken) {
      return { message: 'Logged out' };
    }

    const candidates = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    });

    for (const candidate of candidates) {
      if (await bcrypt.compare(rawRefreshToken, candidate.hashedToken)) {
        await this.prisma.refreshToken.update({
          where: { id: candidate.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }

    return { message: 'Logged out' };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out from all devices' };
  }

  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email);

    // Always return a generic success message to avoid leaking which
    // emails are registered.
    if (!user) {
      return { message: 'If an account exists for this email, a reset link has been sent.' };
    }

    const token = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });

    await this.mail.sendPasswordResetEmail(user.email, token);

    return { message: 'If an account exists for this email, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (record.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.users.updatePasswordHash(record.userId, passwordHash);
    await this.prisma.passwordResetToken.delete({ where: { id: record.id } });

    // Force re-login everywhere after a password reset.
    await this.logoutAll(record.userId);

    return { message: 'Password reset successfully. Please log in again.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findById(userId);
    if (!user || !user.passwordHash) {
      throw new BadRequestException('Password change is not available for this account');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.users.updatePasswordHash(userId, passwordHash);
    await this.logoutAll(userId);

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async listSessions(userId: string, currentRawRefreshToken?: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    let currentSessionId: string | null = null;
    if (currentRawRefreshToken) {
      for (const s of sessions) {
        if (await bcrypt.compare(currentRawRefreshToken, s.hashedToken)) {
          currentSessionId = s.id;
          break;
        }
      }
    }

    return sessions.map((s: (typeof sessions)[number]) => ({
      id: s.id,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Session revoked' };
  }

  async loginWithOAuthUser(user: { id: string; email: string }, device: DeviceInfo) {
    const tokens = await this.issueTokenPair(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken, device);
    return tokens;
  }

  // already-logged-in user instead of logging in as a fresh/matched user) ----------

  /**
   * Short-lived, single-purpose token carried through the OAuth `state`
   * param so the callback (which the browser hits directly, with no
   * Authorization header) can prove which already-authenticated user asked
   * to link a new provider.
   */
  async createLinkState(userId: string, provider: 'google' | 'github') {
    return this.jwt.signAsync(
      { sub: userId, purpose: 'link-account', provider },
      { secret: this.config.get('jwt.accessSecret'), expiresIn: '5m' },
    );
  }

  async verifyLinkState(state: string): Promise<{ sub: string; provider: string } | null> {
    try {
      const payload = await this.jwt.verifyAsync(state, {
        secret: this.config.get('jwt.accessSecret'),
      });
      return payload?.purpose === 'link-account' ? payload : null;
    } catch {
      return null;
    }
  }
}
