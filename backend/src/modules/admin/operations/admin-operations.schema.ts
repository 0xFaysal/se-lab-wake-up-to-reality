import { z } from "zod";
import {
  BookingStatus,
  DomainAuditEventType,
  PaymentStatus,
  RefundStatus,
  PropertyStatus,
  UserRoleType,
  UserStatus,
  VerificationStatus,
} from "../../../../generated/prisma/client.js";

const pageQuery = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
};

const optionalBoolean = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

const dateQuery = z.string().datetime({ offset: true }).optional();

export const adminEntityIdSchema = z.object({
  params: z.object({ id: z.uuid() }).strict(),
});

export const adminUsersQuerySchema = z.object({
  query: z
    .object({
      ...pageQuery,
      search: z.string().trim().max(120).optional(),
      role: z.enum(UserRoleType).optional(),
      status: z.enum(UserStatus).optional(),
      emailVerified: optionalBoolean,
      phoneVerified: optionalBoolean,
      riskFlag: optionalBoolean,
      createdFrom: dateQuery,
      createdTo: dateQuery,
    })
    .strict(),
});

export const adminPropertiesQuerySchema = z.object({
  query: z
    .object({
      ...pageQuery,
      search: z.string().trim().max(120).optional(),
      verificationStatus: z.enum(VerificationStatus).optional(),
      status: z.enum(PropertyStatus).optional(),
      providerUserId: z.uuid().optional(),
      riskFlag: optionalBoolean,
      createdFrom: dateQuery,
      createdTo: dateQuery,
    })
    .strict(),
});

export const adminBookingsQuerySchema = z.object({
  query: z
    .object({
      ...pageQuery,
      search: z.string().trim().max(120).optional(),
      status: z.enum(BookingStatus).optional(),
      propertyId: z.uuid().optional(),
      providerUserId: z.uuid().optional(),
      driverUserId: z.uuid().optional(),
      paymentStatus: z.enum(PaymentStatus).optional(),
      createdFrom: dateQuery,
      createdTo: dateQuery,
    })
    .strict(),
});

export const adminSessionsQuerySchema = z.object({
  query: z
    .object({
      ...pageQuery,
      status: z
        .enum([
          BookingStatus.CONFIRMED,
          BookingStatus.CHECKED_IN,
          BookingStatus.CHECKOUT_REQUESTED,
          BookingStatus.PAYMENT_DUE,
          BookingStatus.COMPLETED,
        ])
        .optional(),
      propertyId: z.uuid().optional(),
      providerUserId: z.uuid().optional(),
      overdue: optionalBoolean,
    })
    .strict(),
});

export const adminPaymentsQuerySchema = z.object({
  query: z
    .object({
      ...pageQuery,
      search: z.string().trim().max(120).optional(),
      status: z.enum(PaymentStatus).optional(),
      createdFrom: dateQuery,
      createdTo: dateQuery,
    })
    .strict(),
});

export const adminRefundsQuerySchema = z.object({
  query: z
    .object({
      ...pageQuery,
      status: z.enum(RefundStatus).optional(),
    })
    .strict(),
});

export const adminLedgerQuerySchema = z.object({
  query: z
    .object({
      ...pageQuery,
      search: z.string().trim().max(120).optional(),
      referenceType: z.string().trim().max(60).optional(),
    })
    .strict(),
});

export const adminAuditQuerySchema = z.object({
  query: z
    .object({
      ...pageQuery,
      actorUserId: z.uuid().optional(),
      action: z.enum(DomainAuditEventType).optional(),
      entityType: z.string().trim().max(80).optional(),
      entityId: z.uuid().optional(),
      createdFrom: dateQuery,
      createdTo: dateQuery,
    })
    .strict(),
});

export const adminReviewsQuerySchema = z.object({
  query: z
    .object({
      ...pageQuery,
      reported: optionalBoolean,
      rating: z.coerce.number().int().min(1).max(5).optional(),
    })
    .strict(),
});
