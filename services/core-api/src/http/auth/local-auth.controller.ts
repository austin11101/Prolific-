import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LOCAL_AUTH_SERVICE } from '../../application/auth/local-auth.tokens.js';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
} from '../../application/auth/local-auth.errors.js';
import type { LocalAuthService } from '../../application/auth/local-auth.service.js';
import { LoginDto, RegisterDto } from './local-auth.dto.js';

@ApiTags('auth')
@Controller('auth')
export class LocalAuthController {
  constructor(
    @Inject(LOCAL_AUTH_SERVICE)
    private readonly authService: LocalAuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new learner account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Account created successfully.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already registered.' })
  async register(@Body() dto: RegisterDto) {
    try {
      const tokens = await this.authService.register({
        email: dto.email,
        displayName: dto.displayName,
        password: dto.password,
      });
      return { data: tokens };
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        throw new ConflictException('An account with this email address already exists.');
      }
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Authentication successful.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials.' })
  async login(@Body() dto: LoginDto) {
    try {
      const tokens = await this.authService.login({
        email: dto.email,
        password: dto.password,
      });
      return { data: tokens };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException('The email address or password is incorrect.');
      }
      throw error;
    }
  }
}
