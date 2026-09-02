import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ProlificApiExceptionFilter } from './http/prolific-api-exception.filter.js';
import { RequestContextMiddleware } from './http/request-context.middleware.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { LocalAuthModule } from './modules/local-auth/local-auth.module.js';
import { SessionsModule } from './modules/sessions/sessions.module.js';
import { SecurityModule } from './security/security.module.js';

@Module({
  imports: [SecurityModule, CatalogModule, LocalAuthModule, SessionsModule],
  providers: [ProlificApiExceptionFilter, RequestContextMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
