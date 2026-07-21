import { jest } from '@jest/globals';
import { Test, type TestingModule } from '@nestjs/testing';

import {
  PRISMA_DATABASE_CONFIG,
  readPrismaDatabaseConfig,
  type PrismaDatabaseConfig,
} from './prisma-database.config.js';
import { PrismaModule } from './prisma.module.js';
import { PrismaService } from './prisma.service.js';

const TEST_DATABASE_URL =
  'postgresql://prolific:local-test-only@localhost:5432/prolific?schema=public';

describe('Prisma database configuration', () => {
  it('fails clearly when DATABASE_URL is missing', () => {
    expect(() => readPrismaDatabaseConfig({})).toThrow(
      'DATABASE_URL is required to configure the Prisma PostgreSQL adapter.',
    );
  });

  it('uses bounded pool defaults and accepts overrides', () => {
    expect(readPrismaDatabaseConfig({ DATABASE_URL: TEST_DATABASE_URL })).toEqual({
      databaseUrl: TEST_DATABASE_URL,
      poolMax: 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    });

    expect(
      readPrismaDatabaseConfig({
        DATABASE_URL: TEST_DATABASE_URL,
        DATABASE_POOL_MAX: '4',
        DATABASE_CONNECTION_TIMEOUT_MS: '2000',
        DATABASE_IDLE_TIMEOUT_MS: '15000',
      }),
    ).toEqual({
      databaseUrl: TEST_DATABASE_URL,
      poolMax: 4,
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 15_000,
    });
  });

  it('rejects invalid numeric pool configuration', () => {
    expect(() =>
      readPrismaDatabaseConfig({
        DATABASE_URL: TEST_DATABASE_URL,
        DATABASE_POOL_MAX: '0',
      }),
    ).toThrow('DATABASE_POOL_MAX must be a positive integer.');
  });
});

describe('PrismaService', () => {
  const config: PrismaDatabaseConfig = {
    databaseUrl: TEST_DATABASE_URL,
    poolMax: 1,
    connectionTimeoutMillis: 100,
    idleTimeoutMillis: 100,
  };

  it('constructs the generated Prisma client with the PostgreSQL adapter', async () => {
    const service = new PrismaService(config);

    expect(typeof service.$connect).toBe('function');
    expect(typeof service.$disconnect).toBe('function');
    await service.onModuleDestroy();
  });

  it('connects and disconnects through Nest lifecycle hooks exactly once', async () => {
    const service = new PrismaService(config);
    const connect = jest.spyOn(service, '$connect').mockResolvedValue();
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleInit();
    await service.onModuleDestroy();
    await service.onModuleDestroy();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('is available through the non-global PrismaModule boundary', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
    })
      .overrideProvider(PRISMA_DATABASE_CONFIG)
      .useValue(config)
      .compile();
    const service = module.get(PrismaService);
    const connect = jest.spyOn(service, '$connect').mockResolvedValue();
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue();

    expect(service).toBeDefined();
    expect(module.get(PrismaService)).toBe(service);
    await module.init();
    await module.close();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
