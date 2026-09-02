export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('An account with this email address already exists.');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('The email address or password is incorrect.');
    this.name = 'InvalidCredentialsError';
  }
}
