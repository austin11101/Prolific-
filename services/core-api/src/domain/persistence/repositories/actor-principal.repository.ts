import type {
  ActorPrincipalKind,
  ActorPrincipalRecord,
  EntityId,
  RepositoryOperationContext,
  TransactionalRepositoryOperationContext,
} from '../persistence.types.js';

export interface ProvisionActorPrincipalInput {
  readonly id: EntityId;
  readonly actorKind: ActorPrincipalKind;
}

export interface ActorPrincipalRepository {
  findById(
    id: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<ActorPrincipalRecord | null>;

  existsById(id: EntityId, context?: RepositoryOperationContext): Promise<boolean>;

  provisionControlled(
    input: ProvisionActorPrincipalInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<ActorPrincipalRecord>;
}
