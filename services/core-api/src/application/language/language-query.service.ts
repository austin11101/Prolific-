import type { LanguageRepository } from '../../domain/persistence/repositories/language.repository.js';
import type { LanguageRecord } from '../../domain/persistence/persistence.types.js';
import {
  InvalidLanguageQueryError,
  type LanguageQueryInputField,
} from './language-query.errors.js';
import type {
  GetLanguageByIdQuery,
  GetLanguageByTagQuery,
  LanguageQueryService,
  LanguageView,
} from './language-query.types.js';

export class DefaultLanguageQueryService implements LanguageQueryService {
  constructor(private readonly languages: LanguageRepository) {}

  async getById(query: GetLanguageByIdQuery): Promise<LanguageView | null> {
    this.assertNonEmpty(query.languageId, 'languageId');
    const language = await this.languages.findById(query.languageId);
    return language === null ? null : this.toView(language);
  }

  async getByTag(query: GetLanguageByTagQuery): Promise<LanguageView | null> {
    this.assertNonEmpty(query.normalizedTag, 'normalizedTag');
    const language = await this.languages.findByNormalizedTag(query.normalizedTag);
    return language === null ? null : this.toView(language);
  }

  async listContentEnabled(): Promise<readonly LanguageView[]> {
    const languages = await this.languages.listContentEnabled();
    return Object.freeze(languages.map((language) => this.toView(language)));
  }

  private assertNonEmpty(value: string, field: LanguageQueryInputField): void {
    if (typeof value !== 'string' || value.length === 0) {
      throw new InvalidLanguageQueryError(field);
    }
  }

  private toView(language: LanguageRecord): LanguageView {
    return Object.freeze({
      id: language.id,
      bcp47Tag: language.bcp47Tag,
      normalizedTag: language.normalizedTag,
      isoLanguageBasis: language.isoLanguageBasis,
      canonicalName: language.canonicalName,
      normalizedName: language.normalizedName,
      displayOrder: language.displayOrder,
      isContentEnabled: language.isContentEnabled,
      retiredAt: language.retiredAt === null ? null : new Date(language.retiredAt.getTime()),
      createdAt: new Date(language.createdAt.getTime()),
      updatedAt: new Date(language.updatedAt.getTime()),
    });
  }
}
