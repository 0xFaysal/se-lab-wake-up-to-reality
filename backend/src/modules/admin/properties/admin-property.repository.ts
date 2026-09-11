import {
  Prisma,
  VerificationStatus,
} from "../../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";

type AdminPropertyClient = Pick<Prisma.TransactionClient, "property">;

export const adminPropertySummarySelect = {
  id: true,
  name: true,
  publicArea: true,
  approximateAddress: true,
  latitude: true,
  longitude: true,
  verificationStatus: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
    },
  },
  _count: { select: { images: true } },
} satisfies Prisma.PropertySelect;

export type AdminPropertySummaryRecord = Prisma.PropertyGetPayload<{
  select: typeof adminPropertySummarySelect;
}>;

export const adminPropertyDetailInclude = {
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      mustChangePassword: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      deletedAt: true,
      roles: { select: { role: true } },
    },
  },
  providerMemberships: {
    orderBy: { joinedAt: "asc" as const },
    include: {
      provider: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
        },
      },
    },
  },
  images: {
    orderBy: [
      { sortOrder: "asc" as const },
      { createdAt: "asc" as const },
      { id: "asc" as const },
    ],
  },
  verifiedByAdmin: {
    select: { id: true, fullName: true, email: true },
  },
} satisfies Prisma.PropertyInclude;

export type AdminPropertyDetailRecord = Prisma.PropertyGetPayload<{
  include: typeof adminPropertyDetailInclude;
}>;

export function countPendingProperties(db: AdminPropertyClient = prisma) {
  return db.property.count({
    where: {
      deletedAt: null,
      verificationStatus: VerificationStatus.PENDING,
    },
  });
}

export function findPendingProperties(
  skip: number,
  take: number,
  db: AdminPropertyClient = prisma,
) {
  return db.property.findMany({
    where: {
      deletedAt: null,
      verificationStatus: VerificationStatus.PENDING,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    skip,
    take,
    select: adminPropertySummarySelect,
  });
}

export function findAdminPropertyById(
  propertyId: string,
  db: AdminPropertyClient = prisma,
) {
  return db.property.findFirst({
    where: { id: propertyId, deletedAt: null },
    include: adminPropertyDetailInclude,
  });
}

export function updatePendingPropertyVerification(
  propertyId: string,
  data: Prisma.PropertyUncheckedUpdateManyInput,
  db: AdminPropertyClient = prisma,
) {
  return db.property.updateMany({
    where: {
      id: propertyId,
      deletedAt: null,
      verificationStatus: VerificationStatus.PENDING,
    },
    data,
  });
}
