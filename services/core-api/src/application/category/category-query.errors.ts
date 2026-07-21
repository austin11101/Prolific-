export const CATEGORY_QUERY_ERROR_CODES = {
  invalidInput: 'INVALID_CATEGORY_QUERY',
} as const;

export type CategoryQueryInputField = 'categoryId' | 'normalizedName' | 'lifecycleState';

export class InvalidCategoryQueryError extends Error {
  readonly code = CATEGORY_QUERY_ERROR_CODES.invalidInput;

  constructor(readonly field: CategoryQueryInputField) {
    super('The Category query input is invalid.');
    this.name = new.target.name;
  }
}
