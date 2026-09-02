export interface RefreshTokenRecord {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

export interface RefreshTokenRepository {
  create(token: RefreshTokenRecord): Promise<void>;
  findActiveByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
}
