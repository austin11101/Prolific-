import type { TopicRepository } from '../../domain/persistence/repositories/topic.repository.js';
import type {
  TaxonomyLifecycleState,
  TopicRecord,
  VersionedMutationResult,
} from '../../domain/persistence/persistence.types.js';
import type { TransactionManager } from '../../domain/persistence/transactions/transaction-manager.js';
import {
  InvalidTopicMutationCommandError,
  type TopicMutationInputField,
} from './topic-mutation.errors.js';
import type {
  PersistTopicOrdinaryChangeCommand,
  TopicMutationResult,
  TopicMutationService,
  TopicMutationView,
  TopicOrdinaryMutationState,
} from './topic-mutation.types.js';

const LIFECYCLE_STATES = new Set<TaxonomyLifecycleState>(['active', 'archived']);
const COMMAND_FIELDS = new Set(['topicId', 'expectedLockVersion', 'current', 'resulting']);
const STATE_FIELDS = new Set([
  'canonicalName',
  'normalizedCanonicalName',
  'lifecycleState',
  'archivedAt',
  'updatedAt',
]);
const PROHIBITED_FIELDS = new Set<TopicMutationInputField>([
  'categoryId',
  'parentTopicId',
  'displayOrder',
  'hierarchyVersion',
]);

export class DefaultTopicMutationService implements TopicMutationService {
  constructor(
    private readonly topics: TopicRepository,
    private readonly transactions: TransactionManager,
  ) {}

  async persistOrdinaryChange(
    command: PersistTopicOrdinaryChangeCommand,
  ): Promise<TopicMutationResult> {
    this.validate(command);

    return this.transactions.execute(async (transaction) => {
      const mutation = await this.topics.persistOrdinaryChange(
        {
          topicId: command.topicId,
          expectedLockVersion: command.expectedLockVersion,
          canonicalName: command.resulting.canonicalName,
          normalizedCanonicalName: command.resulting.normalizedCanonicalName,
          lifecycleState: command.resulting.lifecycleState,
          archivedAt: this.copyNullableDate(command.resulting.archivedAt),
          updatedAt: new Date(command.resulting.updatedAt.getTime()),
        },
        { transaction },
      );
      return this.toResult(mutation);
    });
  }

  private validate(command: PersistTopicOrdinaryChangeCommand): void {
    if (typeof command !== 'object' || command === null) {
      this.invalid('command');
    }
    this.assertAllowedFields(command as unknown as Record<string, unknown>, COMMAND_FIELDS);
    if (typeof command.topicId !== 'string' || command.topicId.length === 0) {
      this.invalid('topicId');
    }
    if (!Number.isSafeInteger(command.expectedLockVersion) || command.expectedLockVersion <= 0) {
      this.invalid('expectedLockVersion');
    }
    this.assertState(command.current, 'current');
    this.assertState(command.resulting, 'resulting');
    if (this.sameOrdinaryState(command.current, command.resulting)) {
      this.invalid('change');
    }
  }

  private assertAllowedFields(value: Record<string, unknown>, allowed: ReadonlySet<string>): void {
    for (const field of Object.keys(value)) {
      if (!allowed.has(field)) {
        this.invalid(
          PROHIBITED_FIELDS.has(field as TopicMutationInputField)
            ? (field as TopicMutationInputField)
            : 'command',
        );
      }
    }
  }

  private assertState(state: TopicOrdinaryMutationState, field: 'current' | 'resulting'): void {
    if (typeof state !== 'object' || state === null) {
      this.invalid(field);
    }
    this.assertAllowedFields(state as unknown as Record<string, unknown>, STATE_FIELDS);
    if (
      typeof state.canonicalName !== 'string' ||
      state.canonicalName.length === 0 ||
      typeof state.normalizedCanonicalName !== 'string' ||
      state.normalizedCanonicalName.length === 0 ||
      !LIFECYCLE_STATES.has(state.lifecycleState) ||
      !(state.updatedAt instanceof Date) ||
      !Number.isFinite(state.updatedAt.getTime()) ||
      (state.archivedAt !== null &&
        (!(state.archivedAt instanceof Date) || !Number.isFinite(state.archivedAt.getTime()))) ||
      (state.lifecycleState === 'active' && state.archivedAt !== null) ||
      (state.lifecycleState === 'archived' && state.archivedAt === null)
    ) {
      this.invalid(field);
    }
  }

  private sameOrdinaryState(
    current: TopicOrdinaryMutationState,
    resulting: TopicOrdinaryMutationState,
  ): boolean {
    return (
      current.canonicalName === resulting.canonicalName &&
      current.normalizedCanonicalName === resulting.normalizedCanonicalName &&
      current.lifecycleState === resulting.lifecycleState &&
      this.sameDate(current.archivedAt, resulting.archivedAt)
    );
  }

  private sameDate(left: Date | null, right: Date | null): boolean {
    return left === null ? right === null : right !== null && left.getTime() === right.getTime();
  }

  private toResult(mutation: VersionedMutationResult<TopicRecord>): TopicMutationResult {
    return Object.freeze({
      topic: this.toView(mutation.entity),
      previousLockVersion: mutation.previousVersion,
      resultingLockVersion: mutation.resultingVersion,
    });
  }

  private toView(topic: TopicRecord): TopicMutationView {
    return Object.freeze({
      id: topic.id,
      categoryId: topic.categoryId,
      parentTopicId: topic.parentTopicId,
      canonicalName: topic.canonicalName,
      normalizedCanonicalName: topic.normalizedCanonicalName,
      lifecycleState: topic.lifecycleState,
      displayOrder: topic.displayOrder,
      lockVersion: topic.lockVersion,
      archivedAt: this.copyNullableDate(topic.archivedAt),
      createdAt: new Date(topic.createdAt.getTime()),
      updatedAt: new Date(topic.updatedAt.getTime()),
    });
  }

  private copyNullableDate(value: Date | null): Date | null {
    return value === null ? null : new Date(value.getTime());
  }

  private invalid(field: TopicMutationInputField): never {
    throw new InvalidTopicMutationCommandError(field);
  }
}
