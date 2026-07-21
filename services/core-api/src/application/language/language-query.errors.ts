export const LANGUAGE_QUERY_ERROR_CODES = {
  invalidInput: 'INVALID_LANGUAGE_QUERY',
} as const;

export type LanguageQueryInputField = 'languageId' | 'normalizedTag';

export class InvalidLanguageQueryError extends Error {
  readonly code = LANGUAGE_QUERY_ERROR_CODES.invalidInput;

  constructor(readonly field: LanguageQueryInputField) {
    super('The Language query input is invalid.');
    this.name = new.target.name;
  }
}
