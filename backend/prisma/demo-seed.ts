import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AccountOrigin,
  ManagerDelegationPermission,
  PrismaClient,
  UserRoleType,
  type ParkingResourceType,
  type VehicleType,
} from "../generated/prisma/client.js";
import { hashPassword } from "../src/common/auth/password.js";
import { encryptSensitiveText } from "../src/common/security/encryption.js";
import { fingerprintPropertyAddress } from "../src/modules/properties/property-identity.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("Demo seed is disabled in production");
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const password = process.env.DEMO_USER_PASSWORD?.trim();
if (
  !password ||
  password.length < 12 ||
  !/[A-Z]/.test(password) ||
  !/[a-z]/.test(password) ||
  !/\d/.test(password) ||
  !/[^A-Za-z0-9\s]/.test(password)
) {
  throw new Error(
    "DEMO_USER_PASSWORD must be 12+ characters with uppercase, lowercase, number, and special character",
  );
}
const demoCredential = process.env.DEMO_ACCESS_CREDENTIAL?.trim();
if (!demoCredential || demoCredential.length < 32)
  throw new Error("DEMO_ACCESS_CREDENTIAL must contain at least 32 characters");
const domain = process.env.DEMO_EMAIL_DOMAIN?.trim() || "example.test";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const accounts = [
  {
    key: "driver",
    name: "Demo Driver",
    phone: "+8801700000101",
    role: UserRoleType.DRIVER,
    origin: AccountOrigin.SELF_REGISTERED,
  },
  {
    key: "provider1",
    name: "Demo Provider Gulshan",
    phone: "+8801700000102",
    role: UserRoleType.PROVIDER,
    origin: AccountOrigin.SELF_REGISTERED,
  },
  {
    key: "provider2",
    name: "Demo Provider Banani",
    phone: "+8801700000103",
    role: UserRoleType.PROVIDER,
    origin: AccountOrigin.SELF_REGISTERED,
  },
  {
    key: "provider3",
    name: "Demo Provider Dhanmondi",
    phone: "+8801700000104",
    role: UserRoleType.PROVIDER,
    origin: AccountOrigin.SELF_REGISTERED,
  },
  {
    key: "manager",
    name: "Demo Parking Manager",
    phone: "+8801700000105",
    role: UserRoleType.MANAGER,
    origin: AccountOrigin.PROVIDER_CREATED_MANAGER,
  },
  {
    key: "guard1",
    name: "Demo Guard One",
    phone: "+8801700000106",
    role: UserRoleType.GUARD,
    origin: AccountOrigin.PROVIDER_CREATED_GUARD,
  },
  {
    key: "guard2",
    name: "Demo Guard Two",
    phone: "+8801700000107",
    role: UserRoleType.GUARD,
    origin: AccountOrigin.PROVIDER_CREATED_GUARD,
  },
] as const;

async function ensureUser(
  input: (typeof accounts)[number],
  passwordHash: string,
) {
  const email = `demo.${input.key}@${domain}`.toLowerCase();
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: input.name,
      status: "ACTIVE",
      deletedAt: null,
      emailVerifiedAt: new Date(),
    },
    create: {
      fullName: input.name,
      email,
      phone: input.phone,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      accountOrigin: input.origin,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role: input.role } },
    update: {},
    create: { userId: user.id, role: input.role },
  });
  await prisma.walletAccount.upsert({
    where: { userId_currency: { userId: user.id, currency: "BDT" } },
    update: {},
    create: { userId: user.id, currency: "BDT" },
  });
  return user;
}

async function ensureProperty(input: {
  name: string;
  providerId: string;
  adminId: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  image: string;
}) {
  let property = await prisma.property.findFirst({
    where: { name: input.name, createdByUserId: input.providerId },
  });
  if (!property) {
    const encryptedAddress = encryptSensitiveText(input.address);
    property = await prisma.property.create({
      data: {
        createdByUserId: input.providerId,
        name: input.name,
        normalizedName: input.name.toLowerCase(),
        description:
          "Verified demo parking with staffed access and clearly marked spaces.",
        publicArea: input.area,
        approximateAddress: input.address,
        exactAddressCiphertext: encryptedAddress.ciphertext,
        exactAddressIv: encryptedAddress.iv,
        exactAddressTag: encryptedAddress.authTag,
        addressFingerprint: fingerprintPropertyAddress(input.address),
        latitude: input.latitude,
        longitude: input.longitude,
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
        verifiedByAdminId: input.adminId,
        verifiedAt: new Date(),
        visitorIdentificationRequired: true,
        generalParkingRules:
          "Park only in the assigned area and keep the access lane clear.",
        commonSafetyRules:
          "Follow Guard instructions and observe the 10 km/h speed limit.",
      },
    });
  }
  await prisma.propertyImage.upsert({
    where: { storageKey: `demo/${property.id}/cover` },
    update: { url: input.image, isCover: true },
    create: {
      propertyId: property.id,
      storageKey: `demo/${property.id}/cover`,
      url: input.image,
      provider: "DEMO",
      imageType: "EXTERIOR",
      isCover: true,
    },
  });
  return property;
}

async function ensureMembership(
  propertyId: string,
  providerUserId: string,
  adminId: string,
) {
  return prisma.propertyProvider.upsert({
    where: { propertyId_providerUserId: { propertyId, providerUserId } },
    update: { status: "ACTIVE", verificationStatus: "VERIFIED", endedAt: null },
    create: {
      propertyId,
      providerUserId,
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      verifiedByAdminId: adminId,
      verifiedAt: new Date(),
    },
  });
}

async function ensureOffer(input: {
  propertyId: string;
  membershipId: string;
  providerId: string;
  adminId: string;
  code: string;
  name: string;
  type: ParkingResourceType;
  capacity: number;
  vehicles: VehicleType[];
  price: bigint;
  facilityIds: number[];
}) {
  let spot = await prisma.parkingSpot.findFirst({
    where: {
      propertyId: input.propertyId,
      displayName: input.name,
      deletedAt: null,
    },
  });
  if (!spot)
    spot = await prisma.parkingSpot.create({
      data: {
        propertyId: input.propertyId,
        providerMembershipId: input.membershipId,
        resourceType: input.type,
        displayName: input.name,
        ...(input.type === "FIXED_SPACE"
          ? {
              spotCode: input.code,
              normalizedSpotCode: input.code.replaceAll("-", ""),
            }
          : {}),
        floor: "Ground",
        zone: "Demo",
        capacity: input.capacity,
        supportedVehicleType: input.vehicles[0]!,
        supportedVehicleTypes: input.vehicles,
        status: "ACTIVE",
        isCovered: true,
        hasCctv: true,
        hasGuard: true,
      },
    });
  if (input.type === "FIXED_SPACE") {
    await prisma.parkingResourceUnit.createMany({
      data: Array.from({ length: input.capacity }, (_, index) => ({
        parkingSpotId: spot!.id,
        spotCode:
          input.capacity === 1 ? input.code : `${input.code}-${index + 1}`,
        normalizedSpotCode: (input.capacity === 1
          ? input.code
          : `${input.code}-${index + 1}`
        ).replaceAll("-", ""),
        status: "ACTIVE" as const,
      })),
      skipDuplicates: true,
    });
  }
  await prisma.parkingSpotFacility.createMany({
    data: input.facilityIds.map((facilityId) => ({
      parkingSpotId: spot!.id,
      facilityId,
    })),
    skipDuplicates: true,
  });
  await prisma.availabilityRule.deleteMany({
    where: { parkingSpotId: spot.id },
  });
  await prisma.availabilityRule.createMany({
    data: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      parkingSpotId: spot!.id,
      dayOfWeek,
      startLocalTime: new Date("1970-01-01T06:00:00.000Z"),
      endLocalTime: new Date("1970-01-01T23:00:00.000Z"),
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
    })),
  });
  let right = await prisma.parkingRight.findFirst({
    where: { parkingSpotId: spot.id, providerMembershipId: input.membershipId },
  });
  if (!right)
    right = await prisma.parkingRight.create({
      data: {
        parkingSpotId: spot.id,
        holderUserId: input.providerId,
        providerMembershipId: input.membershipId,
        rightType: "OWNERSHIP",
        quantity: input.capacity,
        canUse: true,
        canList: true,
        canSetPrice: true,
        canManageBookings: true,
        canDelegateManager: true,
        status: "VERIFIED",
        verifiedByAdminId: input.adminId,
        verifiedAt: new Date(),
      },
    });
  const wallet = await prisma.walletAccount.findUniqueOrThrow({
    where: { userId_currency: { userId: input.providerId, currency: "BDT" } },
  });
  let listing = await prisma.parkingListing.findFirst({
    where: { parkingRightId: right.id },
  });
  if (!listing)
    listing = await prisma.parkingListing.create({
      data: {
        parkingSpotId: spot.id,
        providerUserId: input.providerId,
        providerMembershipId: input.membershipId,
        parkingRightId: right.id,
        status: "ACTIVE",
        title: `${input.name} parking`,
        description: "Demo-ready parking offer with Guard and CCTV coverage.",
        pricePerHourPaisa: input.price,
        minDurationMinutes: 30,
        maxDurationMinutes: 720,
        allowedVehicleTypes: input.vehicles,
        securityDepositPaisa: 10000n,
        settlementRecipientUserId: input.providerId,
        settlementWalletAccountId: wallet.id,
        publishedAt: new Date(),
      },
    });
  return { spot, right, listing, wallet };
}

async function ensureBooking(input: {
  key: string;
  code: string;
  driverId: string;
  vehicleId: string;
  offer: Awaited<ReturnType<typeof ensureOffer>>;
  propertyId: string;
  providerId: string;
  status: "COMPLETED" | "DISPUTED" | "CONFIRMED";
  startsAt: Date;
  endsAt: Date;
}) {
  const existing = await prisma.booking.findUnique({
    where: {
      driverUserId_idempotencyKey: {
        driverUserId: input.driverId,
        idempotencyKey: input.key,
      },
    },
  });
  if (existing) return existing;
  const base = 12000n;
  const fee = 1200n;
  const deposit = 10000n;
  const total = base + fee + deposit;
  return prisma.$transaction(async (tx) => {
    const quote = await tx.bookingQuote.create({
      data: {
        driverUserId: input.driverId,
        listingId: input.offer.listing.id,
        vehicleId: input.vehicleId,
        parkingSpotId: input.offer.spot.id,
        startAt: input.startsAt,
        endAt: input.endsAt,
        durationMinutes: 120,
        baseAmountPaisa: base,
        platformFeePaisa: fee,
        depositPaisa: deposit,
        totalAmountPaisa: total,
        createdAt: new Date(input.startsAt.getTime() - 10 * 60_000),
        expiresAt: new Date(input.startsAt.getTime() - 60_000),
      },
    });
    const allocation = await tx.parkingAllocation.create({
      data: {
        parkingSpotId: input.offer.spot.id,
        parkingRightId: input.offer.right.id,
        startAt: input.startsAt,
        endAt: input.endsAt,
        status: input.status === "CONFIRMED" ? "BOOKED" : "RELEASED",
      },
    });
    const hold = await tx.reservationHold.create({
      data: {
        quoteId: quote.id,
        driverUserId: input.driverId,
        listingId: input.offer.listing.id,
        parkingSpotId: input.offer.spot.id,
        allocationId: allocation.id,
        status: "CONSUMED",
        expiresAt: new Date(input.startsAt.getTime() - 60_000),
        idempotencyKey: `demo-hold-${input.key}`,
      },
    });
    const booking = await tx.booking.create({
      data: {
        bookingCode: input.code,
        holdId: hold.id,
        allocationId: allocation.id,
        driverUserId: input.driverId,
        vehicleId: input.vehicleId,
        propertyId: input.propertyId,
        parkingSpotId: input.offer.spot.id,
        listingId: input.offer.listing.id,
        parkingRightId: input.offer.right.id,
        providerUserId: input.providerId,
        settlementRecipientUserId: input.providerId,
        settlementWalletAccountId: input.offer.wallet.id,
        startAt: input.startsAt,
        scheduledEndAt: input.endsAt,
        effectiveEndAt: input.endsAt,
        baseAmountPaisa: base,
        platformFeePaisa: fee,
        depositPaisa: deposit,
        totalAmountPaisa: total,
        status: input.status,
        idempotencyKey: input.key,
        confirmedAt: new Date(),
        ...(input.status === "COMPLETED"
          ? { checkedInAt: input.startsAt, checkedOutAt: input.endsAt }
          : {}),
      },
    });
    const payment = await tx.payment.create({
      data: {
        bookingId: booking.id,
        payerUserId: input.driverId,
        amountPaisa: total,
        status: "CAPTURED",
        providerReference: `DEMO-${input.code}`,
        idempotencyKey: `demo-payment-${input.key}`,
        capturedAt: new Date(),
      },
    });
    await tx.ledgerTransaction.create({
      data: {
        referenceType: "BOOKING_PAYMENT",
        referenceId: payment.id,
        description: `Demo payment for ${input.code}`,
        actorUserId: input.driverId,
        entries: {
          create: [
            {
              accountCode: "EXTERNAL_PAYMENT_CLEARING",
              entrySide: "DEBIT",
              amountPaisa: total,
            },
            {
              accountCode: "PROVIDER_PAYABLE",
              walletAccountId: input.offer.wallet.id,
              entrySide: "CREDIT",
              amountPaisa: base,
            },
            {
              accountCode: "PLATFORM_REVENUE",
              entrySide: "CREDIT",
              amountPaisa: fee,
            },
            {
              accountCode: "CUSTOMER_DEPOSIT_LIABILITY",
              entrySide: "CREDIT",
              amountPaisa: deposit,
            },
          ],
        },
      },
    });
    await tx.walletAccount.update({
      where: { id: input.offer.wallet.id },
      data:
        input.status === "CONFIRMED"
          ? { pendingBalancePaisa: { increment: base } }
          : { availableBalancePaisa: { increment: base } },
    });
    if (input.status === "CONFIRMED")
      await tx.accessCredential.create({
        data: {
          bookingId: booking.id,
          tokenHash: createHash("sha256").update(demoCredential!).digest("hex"),
          expiresAt: new Date(input.endsAt.getTime() + 86_400_000),
        },
      });
    return booking;
  });
}

async function main() {
  const passwordHash = await hashPassword(password!);
  const users = Object.fromEntries(
    await Promise.all(
      accounts.map(async (account) => [
        account.key,
        await ensureUser(account, passwordHash),
      ]),
    ),
  ) as Record<
    (typeof accounts)[number]["key"],
    Awaited<ReturnType<typeof ensureUser>>
  >;
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const admin = adminEmail
    ? await prisma.user.findUnique({ where: { email: adminEmail } })
    : null;
  if (
    !admin ||
    !(await prisma.userRole.findUnique({
      where: { userId_role: { userId: admin.id, role: "ADMIN" } },
    }))
  )
    throw new Error(
      "Run the base seed first so SEED_ADMIN_EMAIL resolves to an Admin",
    );
  const legalDocuments = await prisma.legalDocument.findMany({
    where: { isActive: true },
  });
  await prisma.userLegalAcceptance.createMany({
    data: Object.values(users).flatMap((user) =>
      legalDocuments.map((document) => ({
        userId: user.id,
        legalDocumentId: document.id,
        acceptanceSource: "ADMIN_ACTION" as const,
      })),
    ),
    skipDuplicates: true,
  });
  const propertyInputs = [
    [
      "ParkEase Gulshan Residence",
      users.provider1.id,
      "Gulshan 1, Dhaka",
      "Near Gulshan Circle 1",
      23.7808,
      90.4168,
      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1400&q=80",
    ],
    [
      "ParkEase Banani Offices",
      users.provider2.id,
      "Banani, Dhaka",
      "Near Banani Road 11",
      23.7937,
      90.4066,
      "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1400&q=80",
    ],
    [
      "ParkEase Dhanmondi Plaza",
      users.provider3.id,
      "Dhanmondi, Dhaka",
      "Near Dhanmondi Lake",
      23.7465,
      90.376,
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1400&q=80",
    ],
    [
      "ParkEase Bashundhara Hub",
      users.provider1.id,
      "Bashundhara R/A, Dhaka",
      "Near Bashundhara Gate",
      23.8197,
      90.4526,
      "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&w=1400&q=80",
    ],
  ] as const;
  const properties = await Promise.all(
    propertyInputs.map(
      ([name, providerId, area, address, latitude, longitude, image]) =>
        ensureProperty({
          name,
          providerId,
          adminId: admin.id,
          area,
          address,
          latitude,
          longitude,
          image,
        }),
    ),
  );
  const memberships = await Promise.all(
    properties.map((property, index) =>
      ensureMembership(
        property.id,
        index === 1
          ? users.provider2.id
          : index === 2
            ? users.provider3.id
            : users.provider1.id,
        admin.id,
      ),
    ),
  );
  await ensureMembership(properties[0]!.id, users.provider2.id, admin.id);
  const facilities = await prisma.parkingFacility.findMany({
    where: { code: { in: ["CCTV", "GUARD", "COVERED"] } },
  });
  const facilityIds = facilities.map((item) => item.id);
  const offers = await Promise.all([
    ensureOffer({
      propertyId: properties[0]!.id,
      membershipId: memberships[0]!.id,
      providerId: users.provider1.id,
      adminId: admin.id,
      code: "GUL-A01",
      name: "Gulshan Bay A-01",
      type: "FIXED_SPACE",
      capacity: 1,
      vehicles: ["SEDAN", "SUV"],
      price: 8000n,
      facilityIds,
    }),
    ensureOffer({
      propertyId: properties[0]!.id,
      membershipId: memberships[0]!.id,
      providerId: users.provider1.id,
      adminId: admin.id,
      code: "GUL-POOL",
      name: "Gulshan Shared Pool",
      type: "SHARED_POOL",
      capacity: 12,
      vehicles: ["MOTORCYCLE", "SEDAN", "SUV"],
      price: 5000n,
      facilityIds,
    }),
    ensureOffer({
      propertyId: properties[1]!.id,
      membershipId: memberships[1]!.id,
      providerId: users.provider2.id,
      adminId: admin.id,
      code: "BAN-B02",
      name: "Banani Bay B-02",
      type: "FIXED_SPACE",
      capacity: 1,
      vehicles: ["SEDAN"],
      price: 7000n,
      facilityIds,
    }),
    ensureOffer({
      propertyId: properties[2]!.id,
      membershipId: memberships[2]!.id,
      providerId: users.provider3.id,
      adminId: admin.id,
      code: "DHA-C03",
      name: "Dhanmondi Bay C-03",
      type: "FIXED_SPACE",
      capacity: 1,
      vehicles: ["SEDAN", "SUV", "MICROBUS"],
      price: 9000n,
      facilityIds,
    }),
  ]);
  let delegation = await prisma.providerManagerDelegation.findFirst({
    where: { propertyId: properties[0]!.id, managerUserId: users.manager.id },
  });
  if (!delegation)
    delegation = await prisma.providerManagerDelegation.create({
      data: {
        grantorProviderMembershipId: memberships[0]!.id,
        managerUserId: users.manager.id,
        propertyId: properties[0]!.id,
        status: "ACTIVE",
        acceptedAt: new Date(),
      },
    });
  await prisma.providerManagerDelegationPermission.createMany({
    data: Object.values(ManagerDelegationPermission).map((permission) => ({
      delegationId: delegation!.id,
      permission,
    })),
    skipDuplicates: true,
  });
  for (const [guard, membership] of [
    [users.guard1, memberships[0]!],
    [users.guard2, memberships[1]!],
  ] as const) {
    const guardMembership = await prisma.propertyGuardMembership.upsert({
      where: {
        propertyId_guardUserId: {
          propertyId: membership.propertyId,
          guardUserId: guard.id,
        },
      },
      update: { status: "ACTIVE", joinedAt: new Date() },
      create: {
        propertyId: membership.propertyId,
        guardUserId: guard.id,
        addedByUserId: membership.providerUserId,
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });
    const assignment = await prisma.providerGuardAssignment.findFirst({
      where: {
        propertyGuardMembershipId: guardMembership.id,
        providerMembershipId: membership.id,
      },
    });
    if (!assignment)
      await prisma.providerGuardAssignment.create({
        data: {
          propertyGuardMembershipId: guardMembership.id,
          providerMembershipId: membership.id,
          createdByUserId: membership.providerUserId,
          status: "ACTIVE",
        },
      });
  }
  const vehicle = await prisma.vehicle.upsert({
    where: { normalizedRegistrationNumber: "DHAKAMETROGA110001" },
    update: { ownerUserId: users.driver.id, deletedAt: null },
    create: {
      ownerUserId: users.driver.id,
      vehicleType: "SEDAN",
      registrationNumber: "Dhaka Metro-GA-11-0001",
      normalizedRegistrationNumber: "DHAKAMETROGA110001",
      brand: "Toyota",
      model: "Corolla",
      color: "White",
      verificationStatus: "VERIFIED",
      isDefault: true,
    },
  });
  const pastStart = new Date(Date.now() - 3 * 86_400_000);
  const pastEnd = new Date(pastStart.getTime() + 2 * 3_600_000);
  const completed = await ensureBooking({
    key: "demo-completed-booking",
    code: "DEMO-COMPLETE-01",
    driverId: users.driver.id,
    vehicleId: vehicle.id,
    offer: offers[0]!,
    propertyId: properties[0]!.id,
    providerId: users.provider1.id,
    status: "COMPLETED",
    startsAt: pastStart,
    endsAt: pastEnd,
  });
  await prisma.review.upsert({
    where: { bookingId: completed.id },
    update: {},
    create: {
      bookingId: completed.id,
      driverUserId: users.driver.id,
      rating: 5,
      comment: "Easy entry, clear bay marking, and helpful Guard.",
      providerReply: "Thank you for parking with us.",
      providerRepliedById: users.provider1.id,
      providerRepliedAt: new Date(),
    },
  });
  const disputed = await ensureBooking({
    key: "demo-disputed-booking",
    code: "DEMO-DISPUTE-01",
    driverId: users.driver.id,
    vehicleId: vehicle.id,
    offer: offers[2]!,
    propertyId: properties[1]!.id,
    providerId: users.provider2.id,
    status: "DISPUTED",
    startsAt: new Date(pastStart.getTime() - 86_400_000),
    endsAt: new Date(pastEnd.getTime() - 86_400_000),
  });
  await prisma.dispute.upsert({
    where: { bookingId: disputed.id },
    update: {},
    create: {
      bookingId: disputed.id,
      openedByUserId: users.driver.id,
      category: "ACCESS",
      description:
        "Demo dispute: the entry gate took longer than expected to open.",
      evidence: [],
    },
  });
  const futureStart = new Date(Date.now() + 30 * 60_000);
  const futureEnd = new Date(futureStart.getTime() + 2 * 3_600_000);
  await ensureBooking({
    key: "demo-confirmed-booking",
    code: "DEMO-CONFIRM-01",
    driverId: users.driver.id,
    vehicleId: vehicle.id,
    offer: offers[0]!,
    propertyId: properties[0]!.id,
    providerId: users.provider1.id,
    status: "CONFIRMED",
    startsAt: futureStart,
    endsAt: futureEnd,
  });
  const payoutKey = "demo-provider-payout";
  if (
    !(await prisma.payoutRequest.findUnique({
      where: { idempotencyKey: payoutKey },
    }))
  ) {
    const wallet = await prisma.walletAccount.findUniqueOrThrow({
      where: {
        userId_currency: { userId: users.provider1.id, currency: "BDT" },
      },
    });
    if (wallet.availableBalancePaisa >= 3000n) {
      await prisma.$transaction([
        prisma.payoutRequest.create({
          data: {
            providerUserId: users.provider1.id,
            walletAccountId: wallet.id,
            amountPaisa: 3000n,
            idempotencyKey: payoutKey,
          },
        }),
        prisma.walletAccount.update({
          where: { id: wallet.id },
          data: {
            availableBalancePaisa: { decrement: 3000n },
            heldBalancePaisa: { increment: 3000n },
          },
        }),
      ]);
    }
  }
  await prisma.notification.upsert({
    where: {
      userId_idempotencyKey: {
        userId: users.driver.id,
        idempotencyKey: "demo-welcome",
      },
    },
    update: {},
    create: {
      userId: users.driver.id,
      type: "PROPERTY_GOVERNANCE",
      title: "Demo account ready",
      message: "Your ParkEase BD demo account is ready to explore.",
      idempotencyKey: "demo-welcome",
    },
  });
  console.log("Demo seed completed");
  console.log(
    `Password: configured through DEMO_USER_PASSWORD (${accounts.length} demo users)`,
  );
  console.log(`Guard credential: configured through DEMO_ACCESS_CREDENTIAL`);
  for (const account of accounts)
    console.log(`${account.role}: demo.${account.key}@${domain}`);
}

main()
  .catch((error) => {
    console.error("Demo seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
