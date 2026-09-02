export interface RegisterCommand {
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
}

export interface LoginCommand {
  readonly email: string;
  readonly password: string;
}

export interface AuthTokens {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly accessToken: string;
  readonly refreshToken: string;
}
