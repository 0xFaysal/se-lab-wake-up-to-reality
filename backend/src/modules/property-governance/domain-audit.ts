import {
  type DomainAuditEventType,
  type Prisma,
} from "../../../generated/prisma/client.js";

const forbiddenMetadataKey = /password|token|otp|secret|cipher|auth.?tag|\biv\b/i;

export function createDomainAuditEvent(
  tx: Prisma.TransactionClient,
  input: {
    eventType: DomainAuditEventType;
    actorUserId?: string;
    propertyId?: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, string | number | boolean | null>;
  },
) {
  if (input.metadata) {
    for (const key of Object.keys(input.metadata)) {
      if (forbiddenMetadataKey.test(key)) {
        throw new Error("Sensitive metadata is not allowed in domain audit events");
      }
    }
  }
  return tx.domainAuditEvent.create({ data: input });
}
