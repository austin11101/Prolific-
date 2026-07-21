import type { ActorPrincipalRepository } from '../../domain/persistence/repositories/actor-principal.repository.js';
import type {
  ActorPrincipalKind,
  ActorPrincipalRecord,
} from '../../domain/persistence/persistence.types.js';
import type { TransactionManager } from '../../domain/persistence/transactions/transaction-manager.js';
import {
  InvalidActorProvisioningCommandError,
  type ActorProvisioningInputField,
} from './actor-provisioning.errors.js';
import type {
  ActorProvisioningService,
  ProvisionActorPrincipalCommand,
  ProvisionActorPrincipalResult,
} from './actor-provisioning.types.js';

const ACTOR_KINDS = new Set<ActorPrincipalKind>(['administrative', 'service', 'system']);

export class DefaultActorProvisioningService implements ActorProvisioningService {
  constructor(
    private readonly actors: ActorPrincipalRepository,
    private readonly transactions: TransactionManager,
  ) {}

  async provisionActorPrincipal(
    command: ProvisionActorPrincipalCommand,
  ): Promise<ProvisionActorPrincipalResult> {
    this.assertNonEmpty(command.actorPrincipalId, 'actorPrincipalId');
    this.assertActorKind(command.actorKind);

    return this.transactions.execute(async (transaction) => {
      const actor = await this.actors.provisionControlled(
        {
          id: command.actorPrincipalId,
          actorKind: command.actorKind,
        },
        { transaction },
      );
      return this.toResult(actor);
    });
  }

  private assertNonEmpty(value: string, field: ActorProvisioningInputField): void {
    if (typeof value !== 'string' || value.length === 0) {
      throw new InvalidActorProvisioningCommandError(field);
    }
  }

  private assertActorKind(value: ActorPrincipalKind): void {
    if (!ACTOR_KINDS.has(value)) {
      throw new InvalidActorProvisioningCommandError('actorKind');
    }
  }

  private toResult(actor: ActorPrincipalRecord): ProvisionActorPrincipalResult {
    return Object.freeze({
      actorPrincipalId: actor.id,
      actorKind: actor.actorKind,
      createdAt: new Date(actor.createdAt.getTime()),
    });
  }
}
