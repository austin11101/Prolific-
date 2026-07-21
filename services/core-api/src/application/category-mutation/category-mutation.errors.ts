export const CATEGORY_MUTATION_ERROR_CODES = {
  invalidCommand: 'INVALID_CATEGORY_MUTATION_COMMAND',
} as const;

export type CategoryMutationInputField =
  | 'categoryId'
  | 'expectedLockVersion'
  | 'expectedHierarchyVersion'
  | 'operation'
  | 'current'
  | 'resulting'
  | 'change';

export class InvalidCategoryMutationCommandError extends Error {
  readonly code = CATEGORY_MUTATION_ERROR_CODES.invalidCommand;

  constructor(readonly field: CategoryMutationInputField) {
    super('The ordinary Category mutation command is invalid.');
    this.name = new.target.name;
  }
}
