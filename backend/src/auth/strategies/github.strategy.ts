import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-github2';
import { AuthProvider } from '@prisma/client';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private config: ConfigService,
    private usersService: UsersService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('github.clientId'),
      clientSecret: config.get<string>('github.clientSecret'),
      callbackURL: config.get<string>('github.callbackUrl'),
      scope: ['user:email'],
      passReqToCallback: true,
    });
  }

  async validate(req: any, accessToken: string, refreshToken: string, profile: any, done: Function) {
    const email =
      profile.emails?.[0]?.value || `${profile.username}@users.noreply.github.com`;
    const name = profile.displayName || profile.username;
    const avatar = profile.photos?.[0]?.value;

    const state = req.query?.state as string | undefined;
    if (state) {
      const linkPayload = await this.authService.verifyLinkState(state);
      if (linkPayload) {
        const user = await this.usersService.linkOAuthAccount(linkPayload.sub, {
          email,
          avatar,
          provider: AuthProvider.GITHUB,
          providerId: profile.id,
        });
        return done(null, user);
      }
    }

    const user = await this.usersService.findOrCreateOAuthUser({
      email,
      name,
      avatar,
      provider: AuthProvider.GITHUB,
      providerId: profile.id,
    });

    done(null, user);
  }
}
