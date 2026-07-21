import { Injectable } from '@nestjs/common';

import type {
  ActorPrincipalKind,
  ActorPrincipalRecord,
} from '../../../domain/persistence/persistence.types.js';
import type { ActorPrincipal as PrismaActorPrincipal } from '../generated/prisma/client.js';

const ACTOR_PRINCIPAL_KINDS = new Set<string>(['administrative', 'service', 'system']);

function isActorPrincipalKind(value: string): value is ActorPrincipalKind {
  return ACTOR_PRINCIPAL_KINDS.has(value);
}

@Injectable()
export class ActorPrincipalMapper {
  toDomain(record: PrismaActorPrincipal): ActorPrincipalRecord {
    if (!isActorPrincipalKind(record.actorKind)) {
      throw new Error('Unsupported Actor Principal kind in persistence record.');
    }

    return Object.freeze({
      id: record.id,
      actorKind: record.actorKind,
      createdAt: new Date(record.createdAt.getTime()),
    });
  }
}
