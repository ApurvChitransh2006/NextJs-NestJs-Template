import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  // Forward ?state=<link-token> from the initiating request through to
  // GitHub and back to the callback, so /auth/github/callback can tell an
  // "add a login method" request apart from a normal sign-in.
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    return req.query?.state ? { state: req.query.state } : undefined;
  }
}
