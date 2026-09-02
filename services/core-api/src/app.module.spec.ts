import { Test } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { PRISMA_DATABASE_CONFIG } from './infrastructure/database/prisma-database.config.js';
import { OAUTH_AUTH_CONFIG } from './security/oauth-auth.config.js';

const stubDatabaseConfig = {
  databaseUrl: 'postgresql://stub:stub@localhost:5432/stub',
  poolMax: 2,
  connectionTimeoutMillis: 1000,
  idleTimeoutMillis: 5000,
};

describe('AppModule', () => {
  it('compiles the application module without environment variables', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PRISMA_DATABASE_CONFIG)
      .useValue(stubDatabaseConfig)
      .overrideProvider(OAUTH_AUTH_CONFIG)
      .useValue(null)
      .compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
