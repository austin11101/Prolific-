export const TOPIC_MUTATION_ERROR_CODES = {
  invalidCommand: 'INVALID_TOPIC_MUTATION_COMMAND',
} as const;

export type TopicMutationInputField =
  | 'command'
  | 'topicId'
  | 'expectedLockVersion'
  | 'current'
  | 'resulting'
  | 'change'
  | 'categoryId'
  | 'parentTopicId'
  | 'displayOrder'
  | 'hierarchyVersion';

export class InvalidTopicMutationCommandError extends Error {
  readonly code = TOPIC_MUTATION_ERROR_CODES.invalidCommand;

  constructor(readonly field: TopicMutationInputField) {
    super('The ordinary Topic mutation command is invalid.');
    this.name = new.target.name;
  }
}
