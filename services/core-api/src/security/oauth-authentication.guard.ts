import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { ProlificApiException } from '../http/prolific-api.exception.js';
import { AuthErrorCodes } from './auth-error-codes.js';
import type { RequestWithActor } from './auth.types.js';
import { extractBearerToken } from './bearer-token.js';
import {
  OAuthAuthenticationError,
  OAuthConfigurationError,
  OAuthJwtAuthenticator,
} from './oauth-jwt-authenticator.js';

@Injectable()
export class OAuthAuthenticationGuard implements CanActivate {
  constructor(private readonly authenticator: OAuthJwtAuthenticator) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & RequestWithActor>();
    const token = extractBearerToken(request);

    try {
      request.actor = this.authenticator.authenticate(token);
      return true;
    } catch (error) {
      if (error instanceof OAuthConfigurationError) {
        throw new ProlificApiException(
          HttpStatus.SERVICE_UNAVAILABLE,
          AuthErrorCodes.authenticationUnavailable,
          'Authentication is temporarily unavailable.',
          true,
        );
      }
      if (error instanceof OAuthAuthenticationError) {
        throw new ProlificApiException(
          HttpStatus.UNAUTHORIZED,
          mapAuthenticationError(error),
          'The bearer token is invalid or has expired.',
        );
      }
      throw error;
    }
  }
}

function mapAuthenticationError(error: OAuthAuthenticationError): string {
  if (error.message.includes('expired')) {
    return AuthErrorCodes.bearerTokenExpired;
  }
  return AuthErrorCodes.invalidBearerToken;
}
