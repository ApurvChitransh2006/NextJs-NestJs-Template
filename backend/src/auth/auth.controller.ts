import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TwoFactorCodeDto } from './dto/two-factor-code.dto';
import { TwoFactorLoginDto } from './dto/two-factor-login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RefreshJwtGuard } from '../common/guards/refresh-jwt.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';

const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.get('nodeEnv') === 'production',
      sameSite: 'lax',
      path: '/auth', // scoped so it's only sent to auth routes (refresh/logout)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
  }

  private deviceInfo(req: Request) {
    return {
      deviceName: req.headers['user-agent'] || 'Unknown device',
      ipAddress: req.ip,
    };
  }

  // ---------------- Public routes ----------------

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 attempts / 5 min
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.deviceInfo(req));

    // Password was correct but a second factor is still required — no
    // cookie/token is issued until /auth/2fa/verify-login succeeds.
    if (result.twoFactorRequired) {
      return { twoFactorRequired: true, challengeToken: result.challengeToken };
    }

    this.setRefreshCookie(res, result.refreshToken);
    return { twoFactorRequired: false, user: result.user, accessToken: result.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 8, ttl: 300000 } }) // 8 attempts / 5 min
  @Post('2fa/verify-login')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactorLogin(
    @Body() dto: TwoFactorLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.completeTwoFactorLogin(
      dto.challengeToken,
      dto.code,
      this.deviceInfo(req),
    );
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request & { user: { sub: string; refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(
      req.user.sub,
      req.user.refreshToken,
      this.deviceInfo(req),
    );
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  // ---------------- Protected routes ----------------

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    const result = await this.authService.logout(userId, rawToken);
    this.clearRefreshCookie(res);
    return result;
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logoutAll(userId);
    this.clearRefreshCookie(res);
    return result;
  }

  // ---------------- Two-factor authentication ----------------

  @Get('2fa/setup')
  requestTwoFactorSetup(@CurrentUser('id') userId: string) {
    return this.authService.requestTwoFactorSetup(userId);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  confirmTwoFactorSetup(@CurrentUser('id') userId: string, @Body() dto: TwoFactorCodeDto) {
    return this.authService.confirmTwoFactorSetup(userId, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  disableTwoFactor(@CurrentUser('id') userId: string, @Body() dto: TwoFactorCodeDto) {
    return this.authService.disableTwoFactor(userId, dto.code);
  }

  // ---------------- Login activity (security audit trail) ----------------

  @Get('login-activity')
  listLoginActivity(@CurrentUser('id') userId: string) {
    return this.authService.listLoginActivity(userId);
  }


  @Get('sessions')
  listSessions(@CurrentUser('id') userId: string, @Req() req: Request) {
    return this.authService.listSessions(userId, req.cookies?.[REFRESH_COOKIE]);
  }

  @Delete('sessions/:id')
  revokeSession(@CurrentUser('id') userId: string, @Param('id') sessionId: string) {
    return this.authService.revokeSession(userId, sessionId);
  }

  @Delete('sessions')
  revokeAllSessions(@CurrentUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }


  /**
   * Frontend calls this while logged in, then redirects the browser to
   * `/api/auth/{provider}?state=<token>` to kick off the normal OAuth
   * dance. The strategies recognize this token in the callback and link
   * the provider to the current user instead of logging in as someone else.
   */
  @Get('link-token/:provider')
  async createLinkToken(
    @CurrentUser('id') userId: string,
    @Param('provider') provider: string,
  ) {
    if (provider !== 'google' && provider !== 'github') {
      throw new BadRequestException('Unsupported provider');
    }
    const state = await this.authService.createLinkState(userId, provider as 'google' | 'github');
    return { state };
  }


  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {
    // Guard redirects to Google's consent screen; body intentionally empty.
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.loginWithOAuthUser(req.user, this.deviceInfo(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    const frontendUrl = this.config.get('frontendUrl');
    res.redirect(`${frontendUrl}/oauth-success?accessToken=${tokens.accessToken}`);
  }


  @Public()
  @UseGuards(GithubAuthGuard)
  @Get('github')
  githubAuth() {
    // Guard redirects to GitHub's consent screen; body intentionally empty.
  }

  @Public()
  @UseGuards(GithubAuthGuard)
  @Get('github/callback')
  async githubCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.loginWithOAuthUser(req.user, this.deviceInfo(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    const frontendUrl = this.config.get('frontendUrl');
    res.redirect(`${frontendUrl}/oauth-success?accessToken=${tokens.accessToken}`);
  }
}
