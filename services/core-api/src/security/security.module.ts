import { Module } from '@nestjs/common';

import { AuthSessionController } from './auth-session.controller.js';
import { AuthorizationGuard } from './authorization.guard.js';
import {
  OAUTH_AUTH_CONFIG,
  readOAuthAuthConfig,
  type OAuthAuthConfig,
} from './oauth-auth.config.js';
import { OAuthAuthenticationGuard } from './oauth-authentication.guard.js';
import { OAuthJwtAuthenticator } from './oauth-jwt-authenticator.js';

@Module({
  controllers: [AuthSessionController],
  providers: [
    {
      provide: OAUTH_AUTH_CONFIG,
      useFactory: () => readOAuthAuthConfig(),
    },
    {
      provide: OAuthJwtAuthenticator,
      useFactory: (config: OAuthAuthConfig | null) => new OAuthJwtAuthenticator(config),
      inject: [OAUTH_AUTH_CONFIG],
    },
    OAuthAuthenticationGuard,
    AuthorizationGuard,
  ],
  exports: [OAuthAuthenticationGuard, AuthorizationGuard, OAuthJwtAuthenticator],
})
export class SecurityModule {}
