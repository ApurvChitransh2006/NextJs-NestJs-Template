import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthProvider, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

export interface OAuthProfile {
  email: string;
  name: string;
  avatar?: string;
  provider: AuthProvider;
  providerId: string;
}

/** Brute-force protection thresholds (OWASP ASVS V2.2). */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createLocalUser(params: { name: string; email: string; password: string }) {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(params.password, 12);

    return this.prisma.user.create({
      data: {
        name: params.name,
        email: params.email,
        passwordHash,
        provider: AuthProvider.LOCAL,
      },
    });
  }

  /**
   * Called on every Google/GitHub login. Resolution order:
   *  1. An existing LinkedAccount for this exact provider+providerId -> that's
   *     a returning user, just return their account.
   *  2. No linked identity yet, but a User already exists with this email
   *     (e.g. they originally signed up with a password, or via a different
   *     provider) -> merge: attach a new LinkedAccount to that existing User
   *     instead of creating a duplicate account.
   *  3. Neither exists -> brand new User + its first LinkedAccount.
   */
  async findOrCreateOAuthUser(params: OAuthProfile) {
    const linked = await this.prisma.linkedAccount.findUnique({
      where: { provider_providerId: { provider: params.provider, providerId: params.providerId } },
    });
    if (linked) {
      const user = await this.findById(linked.userId);
      if (user) return user;
      // Linked row pointed at a deleted user; fall through and re-provision.
    }

    const existingByEmail = await this.findByEmail(params.email);
    if (existingByEmail) {
      await this.prisma.linkedAccount.upsert({
        where: { userId_provider: { userId: existingByEmail.id, provider: params.provider } },
        update: { providerId: params.providerId, email: params.email, avatar: params.avatar },
        create: {
          userId: existingByEmail.id,
          provider: params.provider,
          providerId: params.providerId,
          email: params.email,
          avatar: params.avatar,
        },
      });

      if (!existingByEmail.avatar && params.avatar) {
        return this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: { avatar: params.avatar },
        });
      }
      return existingByEmail;
    }

    return this.prisma.user.create({
      data: {
        name: params.name,
        email: params.email,
        avatar: params.avatar,
        provider: params.provider,
        providerId: params.providerId,
        isEmailVerified: true, // OAuth providers already verify email ownership
        linkedAccounts: {
          create: {
            provider: params.provider,
            providerId: params.providerId,
            email: params.email,
            avatar: params.avatar,
          },
        },
      },
    });
  }

  /**
   * Explicit "Connect account" flow: link a new provider identity to an
   * already-authenticated user, rather than resolving by email match.
   */
  async linkOAuthAccount(userId: string, params: Omit<OAuthProfile, 'name'>) {
    const owner = await this.prisma.linkedAccount.findUnique({
      where: { provider_providerId: { provider: params.provider, providerId: params.providerId } },
    });

    if (owner && owner.userId === userId) {
      return this.findById(userId); // already linked, nothing to do
    }
    if (owner && owner.userId !== userId) {
      throw new ConflictException(
        `This ${params.provider.toLowerCase()} account is already linked to another user`,
      );
    }

    const existingForProvider = await this.prisma.linkedAccount.findUnique({
      where: { userId_provider: { userId, provider: params.provider } },
    });
    if (existingForProvider) {
      throw new ConflictException(`You already have a ${params.provider.toLowerCase()} account linked`);
    }

    await this.prisma.linkedAccount.create({
      data: {
        userId,
        provider: params.provider,
        providerId: params.providerId,
        email: params.email,
        avatar: params.avatar,
      },
    });

    return this.findById(userId);
  }

  async listLinkedAccounts(userId: string) {
    const [user, accounts] = await Promise.all([
      this.findById(userId),
      this.prisma.linkedAccount.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    ]);

    return {
      hasPassword: !!user?.passwordHash,
      accounts: accounts.map((a) => ({
        id: a.id,
        provider: a.provider,
        email: a.email,
        avatar: a.avatar,
        createdAt: a.createdAt,
      })),
    };
  }

  async unlinkAccount(userId: string, linkedAccountId: string) {
    const account = await this.prisma.linkedAccount.findFirst({
      where: { id: linkedAccountId, userId },
    });
    if (!account) {
      throw new NotFoundException('Linked account not found');
    }

    const user = await this.findById(userId);
    const remaining = await this.prisma.linkedAccount.count({ where: { userId } });

    // Never let someone lock themselves out: they need a password OR at
    // least one other linked provider left after this unlink.
    if (remaining <= 1 && !user?.passwordHash) {
      throw new ConflictException(
        'This is your only sign-in method. Set a password before disconnecting it.',
      );
    }

    await this.prisma.linkedAccount.delete({ where: { id: linkedAccountId } });
    return { message: `${account.provider} account disconnected` };
  }

  async markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async setRole(userId: string, role: Role) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id: userId }, data: { role } });
  }

  // ---------------- Brute-force protection ----------------

  /** True while the account is still within its lockout window. */
  isLocked(user: { lockedUntil: Date | null }): boolean {
    return !!user.lockedUntil && user.lockedUntil.getTime() > Date.now();
  }

  /**
   * Records a failed password attempt. Once the failure count reaches the
   * threshold, the account is locked for `ACCOUNT_LOCK_DURATION_MS` and the
   * counter is reset so the next window starts fresh after the lock expires.
   */
  async recordFailedLogin(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    const attempts = user.failedLoginAttempts + 1;

    if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS),
        },
      });
      return true;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: attempts },
    });
    return false;
  }

  /** Clears the failure counter/lock after a successful authentication. */
  async resetFailedLogins(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  // ---------------- Two-factor authentication (TOTP) ----------------

  /** Stores a freshly generated secret without enabling 2FA yet — it only
   *  becomes active once the user proves possession via `enableTwoFactor`. */
  async setPendingTwoFactorSecret(userId: string, secret: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
  }

  async enableTwoFactor(userId: string, hashedBackupCodes: string[]) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorBackupCodes: hashedBackupCodes },
    });
  }

  async disableTwoFactor(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
    });
  }

  /** Removes a single used backup code so it can't be replayed. */
  async consumeBackupCode(userId: string, remainingHashedCodes: string[]) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: remainingHashedCodes },
    });
  }

  /** Strips sensitive fields before returning a user to the client. */
  sanitize(user: any) {
    const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...safe } = user;
    return safe;
  }
}
