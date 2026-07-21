export const TOPIC_QUERY_ERROR_CODES = {
  invalidInput: 'INVALID_TOPIC_QUERY',
} as const;

export type TopicQueryInputField = 'topicId' | 'categoryId' | 'parentTopicId';

export class InvalidTopicQueryError extends Error {
  readonly code = TOPIC_QUERY_ERROR_CODES.invalidInput;

  constructor(readonly field: TopicQueryInputField) {
    super('The Topic query input is invalid.');
    this.name = new.target.name;
  }
}
