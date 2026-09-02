export const LESSON_QUERY_ERROR_CODES = {
  invalidInput: 'INVALID_LESSON_QUERY',
} as const;

export type LessonQueryInputField = 'revisionId' | 'limit' | 'offset';

export class InvalidLessonQueryError extends Error {
  readonly code = LESSON_QUERY_ERROR_CODES.invalidInput;

  constructor(readonly field: LessonQueryInputField) {
    super('The Lesson query input is invalid.');
    this.name = new.target.name;
  }
}
