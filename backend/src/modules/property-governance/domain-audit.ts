import {
  type DomainAuditEventType,
  type Prisma,
} from "../../../generated/prisma/client.js";

const forbiddenMetadataKey =
  /password|token|otp|secret|cipher|auth.?tag|\biv\b/i;

export function createDomainAuditEvent(
  tx: Prisma.TransactionClient,
  input: {
    eventType: DomainAuditEventType;
    actorUserId?: string | undefined;
    propertyId?: string | undefined;
    entityType: string;
    entityId: string;
    metadata?: Record<string, string | number | boolean | null> | undefined;
    requestId?: string | undefined;
  },
) {
  if (input.metadata) {
    for (const key of Object.keys(input.metadata)) {
      if (forbiddenMetadataKey.test(key)) {
        throw new Error(
          "Sensitive metadata is not allowed in domain audit events",
        );
      }
    }
  }
  return tx.domainAuditEvent.create({
    data: {
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
      ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.requestId ? { requestId: input.requestId } : {}),
    },
  });
}
