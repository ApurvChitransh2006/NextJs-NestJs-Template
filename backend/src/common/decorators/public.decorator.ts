import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as bypassing the global JwtAuthGuard. Must be used for any
 * endpoint that should be accessible without a valid access token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
