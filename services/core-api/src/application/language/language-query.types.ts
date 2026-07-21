import type { EntityId } from '../../domain/persistence/persistence.types.js';

export interface GetLanguageByIdQuery {
  readonly languageId: EntityId;
}

export interface GetLanguageByTagQuery {
  /** Already-normalized BCP 47 tag. It is matched exactly and is never rewritten. */
  readonly normalizedTag: string;
}

export interface LanguageView {
  readonly id: EntityId;
  readonly bcp47Tag: string;
  readonly normalizedTag: string;
  readonly isoLanguageBasis: string;
  readonly canonicalName: string;
  readonly normalizedName: string;
  readonly displayOrder: number;
  readonly isContentEnabled: boolean;
  readonly retiredAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface LanguageQueryService {
  getById(query: GetLanguageByIdQuery): Promise<LanguageView | null>;

  getByTag(query: GetLanguageByTagQuery): Promise<LanguageView | null>;

  listContentEnabled(): Promise<readonly LanguageView[]>;
}
