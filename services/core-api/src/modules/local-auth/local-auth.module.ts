import { Module } from '@nestjs/common';

import { LocalAuthService } from '../../application/auth/local-auth.service.js';
import { LOCAL_AUTH_SERVICE } from '../../application/auth/local-auth.tokens.js';
import type { RefreshTokenRepository } from '../../domain/persistence/repositories/refresh-token.repository.js';
import type { UserRepository } from '../../domain/persistence/repositories/user.repository.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { LocalAuthController } from '../../http/auth/local-auth.controller.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  controllers: [LocalAuthController],
  providers: [
    {
      provide: LOCAL_AUTH_SERVICE,
      inject: [USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY],
      useFactory: (users: UserRepository, refreshTokens: RefreshTokenRepository) => {
        const jwtSecret = process.env.LOCAL_AUTH_JWT_SECRET ?? 'change_me_to_a_long_secret';
        const accessTokenExpirySeconds = parseInt(
          process.env.LOCAL_AUTH_ACCESS_TOKEN_EXPIRY_SECONDS ?? '900',
          10,
        );
        const refreshTokenExpiryDays = parseInt(
          process.env.LOCAL_AUTH_REFRESH_TOKEN_EXPIRY_DAYS ?? '30',
          10,
        );
        return new LocalAuthService(users, refreshTokens, {
          jwtSecret,
          accessTokenExpirySeconds,
          refreshTokenExpiryDays,
        });
      },
    },
  ],
  exports: [LOCAL_AUTH_SERVICE],
})
export class LocalAuthModule {}
