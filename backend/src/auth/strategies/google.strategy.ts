import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthProvider } from '@prisma/client';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private config: ConfigService,
    private usersService: UsersService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get('google.clientId'),
      clientSecret: config.get('google.clientSecret'),
      callbackURL: config.get('google.callbackUrl'),
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`;
    const avatar = profile.photos?.[0]?.value;

    // If this request carries a valid "link account" state token, attach
    // this Google identity to the already-logged-in user that requested it,
    // instead of the normal login/merge-by-email flow.
    const state = req.query?.state as string | undefined;
    if (state) {
      const linkPayload = await this.authService.verifyLinkState(state);
      if (linkPayload) {
        const user = await this.usersService.linkOAuthAccount(linkPayload.sub, {
          email,
          avatar,
          provider: AuthProvider.GOOGLE,
          providerId: profile.id,
        });
        return done(null, user);
      }
    }

    const user = await this.usersService.findOrCreateOAuthUser({
      email,
      name,
      avatar,
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
    });

    done(null, user);
  }
}
