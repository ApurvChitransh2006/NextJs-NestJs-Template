import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Attaches required roles to route metadata. RolesGuard reads this metadata
 * and rejects requests from users whose role isn't in the list.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
