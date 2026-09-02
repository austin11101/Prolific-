import { SetMetadata } from '@nestjs/common';

import type { AuthenticatedActorType } from './auth.types.js';

export const REQUIRED_ACTOR_TYPES_KEY = 'prolific:requiredActorTypes';
export const REQUIRED_CAPABILITIES_KEY = 'prolific:requiredCapabilities';

export const RequireActorTypes = (...actorTypes: readonly AuthenticatedActorType[]) =>
  SetMetadata(REQUIRED_ACTOR_TYPES_KEY, actorTypes);

export const RequireCapabilities = (...capabilities: readonly string[]) =>
  SetMetadata(REQUIRED_CAPABILITIES_KEY, capabilities);
