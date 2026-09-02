import crypto from 'node:crypto';

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import type { RefreshTokenRepository } from '../../domain/persistence/repositories/refresh-token.repository.js';
import type { UserRepository } from '../../domain/persistence/repositories/user.repository.js';
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from './local-auth.errors.js';
import type { AuthTokens, LoginCommand, RegisterCommand } from './local-auth.types.js';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_CAPABILITIES = ['catalog:read:public', 'catalog:read:full', 'sync:write'];

export interface LocalAuthConfig {
  readonly jwtSecret: string;
  readonly accessTokenExpirySeconds: number;
  readonly refreshTokenExpiryDays: number;
}

export class LocalAuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly config: LocalAuthConfig,
  ) {}

  async register(command: RegisterCommand): Promise<AuthTokens> {
    const existing = await this.users.findByEmail(command.email.toLowerCase().trim());
    if (existing !== null) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await bcrypt.hash(command.password, BCRYPT_ROUNDS);
    const now = new Date();
    const userId = crypto.randomUUID();

    await this.users.create({
      id: userId,
      email: command.email.toLowerCase().trim(),
      displayName: command.displayName.trim(),
      passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return this.issueTokens(userId, command.email.toLowerCase().trim(), command.displayName.trim());
  }

  async login(command: LoginCommand): Promise<AuthTokens> {
    const user = await this.users.findByEmail(command.email.toLowerCase().trim());
    if (user === null || !user.isActive) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await bcrypt.compare(command.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return this.issueTokens(user.id, user.email, user.displayName);
  }

  private async issueTokens(
    userId: string,
    email: string,
    displayName: string,
  ): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      {
        sub: userId,
        email,
        actor_type: 'learner',
        capabilities: ACCESS_TOKEN_CAPABILITIES,
      },
      this.config.jwtSecret,
      {
        algorithm: 'HS256',
        expiresIn: this.config.accessTokenExpirySeconds,
      },
    );

    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.config.refreshTokenExpiryDays);

    await this.refreshTokens.create({
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });

    return Object.freeze({
      userId,
      email,
      displayName,
      accessToken,
      refreshToken: rawToken,
    });
  }
}
