export const ACTOR_PROVISIONING_ERROR_CODES = {
  invalidCommand: 'INVALID_ACTOR_PROVISIONING_COMMAND',
} as const;

export type ActorProvisioningInputField = 'actorPrincipalId' | 'actorKind';

export class InvalidActorProvisioningCommandError extends Error {
  readonly code = ACTOR_PROVISIONING_ERROR_CODES.invalidCommand;

  constructor(readonly field: ActorProvisioningInputField) {
    super('The Actor Principal provisioning command is invalid.');
    this.name = new.target.name;
  }
}
