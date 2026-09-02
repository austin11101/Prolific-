import { HttpStatus } from '@nestjs/common';
import type { Request } from 'express';

import { ProlificApiException } from '../http/prolific-api.exception.js';
import { AuthErrorCodes } from './auth-error-codes.js';

export function extractBearerToken(request: Request): string {
  const authorization = request.header('authorization');
  if (authorization === undefined) {
    throw new ProlificApiException(
      HttpStatus.UNAUTHORIZED,
      AuthErrorCodes.missingBearerToken,
      'Authentication is required.',
    );
  }

  const [scheme, token, extra] = authorization.trim().split(/\s+/u);
  if (scheme !== 'Bearer' || token === undefined || token.length === 0 || extra !== undefined) {
    throw new ProlificApiException(
      HttpStatus.UNAUTHORIZED,
      AuthErrorCodes.invalidBearerToken,
      'The bearer token is invalid.',
    );
  }

  return token;
}
