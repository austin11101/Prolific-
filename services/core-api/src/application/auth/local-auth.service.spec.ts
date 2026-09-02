import crypto from 'node:crypto';

import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { LocalAuthService } from './local-auth.service.js';
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from './local-auth.errors.js';
import type {
  UserRecord,
  UserRepository,
} from '../../domain/persistence/repositories/user.repository.js';
import type { RefreshTokenRepository } from '../../domain/persistence/repositories/refresh-token.repository.js';

const TEST_SECRET = 'test-secret-32-chars-minimum-len';
const TEST_CONFIG = {
  jwtSecret: TEST_SECRET,
  accessTokenExpirySeconds: 900,
  refreshTokenExpiryDays: 30,
};

function makeUserRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeRefreshTokenRepo(
  overrides: Partial<RefreshTokenRepository> = {},
): RefreshTokenRepository {
  return {
    create: jest.fn().mockResolvedValue(undefined),
    findActiveByHash: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function callCount(repo: UserRepository | RefreshTokenRepository, method: string): number {
  return (repo as unknown as Record<string, jest.Mock>)[method].mock.calls.length;
}

describe('LocalAuthService', () => {
  describe('register', () => {
    it('creates a new user and returns auth tokens', async () => {
      const userRepo = makeUserRepo();
      const refreshTokenRepo = makeRefreshTokenRepo();
      const service = new LocalAuthService(userRepo, refreshTokenRepo, TEST_CONFIG);

      const result = await service.register({
        email: 'Test@Example.COM',
        displayName: 'Test User',
        password: 'password123',
      });

      expect(result.email).toBe('test@example.com');
      expect(result.displayName).toBe('Test User');
      expect(result.userId).toBeTruthy();
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(callCount(userRepo, 'create')).toBe(1);
      expect(callCount(refreshTokenRepo, 'create')).toBe(1);
    });

    it('normalises the email to lowercase', async () => {
      const userRepo = makeUserRepo();
      const service = new LocalAuthService(userRepo, makeRefreshTokenRepo(), TEST_CONFIG);

      const result = await service.register({
        email: 'UPPER@EXAMPLE.COM',
        displayName: 'Upper',
        password: 'password123',
      });

      expect(result.email).toBe('upper@example.com');
      const calls = (userRepo.create as jest.Mock).mock.calls as [[UserRecord]];
      expect(calls[0][0].email).toBe('upper@example.com');
    });

    it('throws EmailAlreadyRegisteredError when email already exists', async () => {
      const existingUser: UserRecord = {
        id: crypto.randomUUID(),
        email: 'existing@example.com',
        displayName: 'Existing',
        passwordHash: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const userRepo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(existingUser) });
      const service = new LocalAuthService(userRepo, makeRefreshTokenRepo(), TEST_CONFIG);

      await expect(
        service.register({
          email: 'existing@example.com',
          displayName: 'Dup',
          password: 'pass1234',
        }),
      ).rejects.toThrow(EmailAlreadyRegisteredError);
    });

    it('hashes the password before storing', async () => {
      const userRepo = makeUserRepo();
      const service = new LocalAuthService(userRepo, makeRefreshTokenRepo(), TEST_CONFIG);

      await service.register({ email: 'a@b.com', displayName: 'A', password: 'mypassword' });

      const calls = (userRepo.create as jest.Mock).mock.calls as [[UserRecord]];
      expect(calls[0][0].passwordHash).not.toBe('mypassword');
      const matches = await bcrypt.compare('mypassword', calls[0][0].passwordHash);
      expect(matches).toBe(true);
    });

    it('issues a valid HS256 JWT access token', async () => {
      const service = new LocalAuthService(makeUserRepo(), makeRefreshTokenRepo(), TEST_CONFIG);

      const result = await service.register({
        email: 'jwt@example.com',
        displayName: 'JWT User',
        password: 'password123',
      });

      const payload = jwt.verify(result.accessToken, TEST_SECRET, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;
      expect(payload.sub).toBe(result.userId);
      expect(payload.email).toBe('jwt@example.com');
      expect(payload.actor_type).toBe('learner');
      expect(payload.capabilities).toContain('catalog:read:public');
    });
  });

  describe('login', () => {
    async function makeActiveUser(email: string): Promise<UserRecord> {
      const hash = await bcrypt.hash('correct-password', 1);
      return {
        id: crypto.randomUUID(),
        email,
        displayName: 'Test',
        passwordHash: hash,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    it('returns auth tokens for valid credentials', async () => {
      const user = await makeActiveUser('user@example.com');
      const userRepo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(user) });
      const service = new LocalAuthService(userRepo, makeRefreshTokenRepo(), TEST_CONFIG);

      const result = await service.login({
        email: 'user@example.com',
        password: 'correct-password',
      });

      expect(result.userId).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    it('throws InvalidCredentialsError when user not found', async () => {
      const service = new LocalAuthService(makeUserRepo(), makeRefreshTokenRepo(), TEST_CONFIG);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'pass' }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('throws InvalidCredentialsError for wrong password', async () => {
      const user = await makeActiveUser('user@example.com');
      const userRepo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(user) });
      const service = new LocalAuthService(userRepo, makeRefreshTokenRepo(), TEST_CONFIG);

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('throws InvalidCredentialsError for inactive user', async () => {
      const user = await makeActiveUser('user@example.com');
      const inactiveUser = { ...user, isActive: false };
      const userRepo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(inactiveUser) });
      const service = new LocalAuthService(userRepo, makeRefreshTokenRepo(), TEST_CONFIG);

      await expect(
        service.login({ email: 'user@example.com', password: 'correct-password' }),
      ).rejects.toThrow(InvalidCredentialsError);
    });
  });
});
