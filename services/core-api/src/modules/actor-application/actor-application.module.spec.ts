import { jest } from '@jest/globals';
import { Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { DefaultActorProvisioningService } from '../../application/actor/actor-provisioning.service.js';
import { ACTOR_PROVISIONING_SERVICE } from '../../application/actor/actor-provisioning.tokens.js';
import type { ActorProvisioningService } from '../../application/actor/actor-provisioning.types.js';
import type { ActorPrincipalRepository } from '../../domain/persistence/repositories/actor-principal.repository.js';
import { TransactionContext } from '../../domain/persistence/transactions/transaction-manager.js';
import type { TransactionManager } from '../../domain/persistence/transactions/transaction-manager.js';
import {
  ACTOR_PRINCIPAL_REPOSITORY,
  TRANSACTION_MANAGER,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { ActorApplicationModule } from './actor-application.module.js';

const MODULE_EXPORTS_METADATA = 'exports';
const MODULE_CONTROLLERS_METADATA = 'controllers';
const GLOBAL_MODULE_METADATA = '__module:global__';

class TestTransactionContext extends TransactionContext {
  constructor() {
    super();
  }
}

describe('ActorApplicationModule', () => {
  const repository = {
    findById: jest.fn<ActorPrincipalRepository['findById']>(),
    existsById: jest.fn<ActorPrincipalRepository['existsById']>(),
    provisionControlled: jest.fn<ActorPrincipalRepository['provisionControlled']>(),
  } satisfies ActorPrincipalRepository;
  const context = new TestTransactionContext();
  const transactions: TransactionManager = {
    execute: async (work) => work(context),
  };

  @Module({
    providers: [
      { provide: ACTOR_PRINCIPAL_REPOSITORY, useValue: repository },
      { provide: TRANSACTION_MANAGER, useValue: transactions },
    ],
    exports: [ACTOR_PRINCIPAL_REPOSITORY, TRANSACTION_MANAGER],
  })
  class StubPersistenceModule {}

  let module: TestingModule;

  afterEach(async () => {
    jest.clearAllMocks();
    await module?.close();
  });

  it('resolves the service with repository and transaction-manager stubs', async () => {
    module = await Test.createTestingModule({ imports: [ActorApplicationModule] })
      .overrideModule(PersistenceModule)
      .useModule(StubPersistenceModule)
      .compile();
    const service = module.get<ActorProvisioningService>(ACTOR_PROVISIONING_SERVICE);
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      actorKind: 'system',
      createdAt: new Date('2026-07-21T10:00:00.000Z'),
    } as const;
    repository.provisionControlled.mockResolvedValue(record);

    expect(service).toBeInstanceOf(DefaultActorProvisioningService);
    await expect(
      service.provisionActorPrincipal({
        actorPrincipalId: record.id,
        actorKind: record.actorKind,
      }),
    ).resolves.toEqual({
      actorPrincipalId: record.id,
      actorKind: record.actorKind,
      createdAt: record.createdAt,
    });
    expect(repository.provisionControlled).toHaveBeenCalledWith(
      { id: record.id, actorKind: record.actorKind },
      { transaction: context },
    );
  });

  it('exports only the provisioning token and registers no controller or global metadata', () => {
    expect(Reflect.getMetadata(MODULE_EXPORTS_METADATA, ActorApplicationModule)).toEqual([
      ACTOR_PROVISIONING_SERVICE,
    ]);
    expect(
      Reflect.getMetadata(MODULE_CONTROLLERS_METADATA, ActorApplicationModule),
    ).toBeUndefined();
    expect(Reflect.getMetadata(GLOBAL_MODULE_METADATA, ActorApplicationModule)).toBeUndefined();
  });
});
