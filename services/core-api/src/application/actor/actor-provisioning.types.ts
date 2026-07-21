import type { ActorPrincipalKind, EntityId } from '../../domain/persistence/persistence.types.js';

export interface ProvisionActorPrincipalCommand {
  readonly actorPrincipalId: EntityId;
  readonly actorKind: ActorPrincipalKind;
}

export interface ProvisionActorPrincipalResult {
  readonly actorPrincipalId: EntityId;
  readonly actorKind: ActorPrincipalKind;
  readonly createdAt: Date;
}

export interface ActorProvisioningService {
  provisionActorPrincipal(
    command: ProvisionActorPrincipalCommand,
  ): Promise<ProvisionActorPrincipalResult>;
}
