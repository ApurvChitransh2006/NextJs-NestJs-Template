import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  // Forward ?state=<link-token> from the initiating request through to
  // Google and back to the callback, so /auth/google/callback can tell an
  // "add a login method" request apart from a normal sign-in.
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    return req.query?.state ? { state: req.query.state } : undefined;
  }
}
