import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration("marketplace end-to-end and concurrency", () => {
  let prisma!: typeof import("../../../src/config/prisma.js").prisma;
  let marketplace!: typeof import("../../../src/modules/marketplace/marketplace.service.js");
  let generated!: typeof import("../../../generated/prisma/client.js");
  const userIds: string[] = [];
  let propertyId = "";
  let providerId = "";
  let secondProviderId = "";
  let adminId = "";
  let guardId = "";
  let managerId = "";
  let providerMembershipId = "";
  let managerDelegationId = "";
  const driverIds: string[] = [];
  const vehicleIds: string[] = [];

  async function user(label: string, role: "PROVIDER" | "MANAGER" | "ADMIN" | "GUARD" | "DRIVER") {
    const record = await prisma.user.create({ data: {
      fullName: `Marketplace ${label}`,
      email: `marketplace-${label}-${randomUUID()}@example.com`,
      phone: `+8801${Math.floor(300000000 + Math.random() * 699999999)}`,
      passwordHash: "integration-test-password-hash",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      roles: { create: { role } },
      walletAccounts: { create: { currency: "BDT" } },
    } });
    userIds.push(record.id);
    return record;
  }

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDatabaseUrl!;
    process.env.REDIS_URL ??= "redis://localhost:6379";
    process.env.CORS_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET = "marketplace-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET = "marketplace-refresh-secret-at-least-32-characters";
    process.env.VERIFICATION_CODE_SECRET = "marketplace-verification-secret-at-least-32-chars";
    process.env.AUTH_METADATA_HASH_SECRET = "marketplace-metadata-secret-at-least-32-characters";
    process.env.PROPERTY_ADDRESS_FINGERPRINT_SECRET = "marketplace-property-secret-at-least-32-characters";
    process.env.DATA_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    process.env.ENABLE_API_DOCS = "false";

    generated = await import("../../../generated/prisma/client.js");
    prisma = (await import("../../../src/config/prisma.js")).prisma;
    marketplace = await import("../../../src/modules/marketplace/marketplace.service.js");
    await prisma.$connect();

    const [provider, secondProvider, manager, admin, guard] = await Promise.all([
      user("provider", "PROVIDER"), user("provider-b", "PROVIDER"), user("manager", "MANAGER"), user("admin", "ADMIN"), user("guard", "GUARD"),
    ]);
    providerId = provider.id;
    secondProviderId = secondProvider.id;
    managerId = manager.id;
    adminId = admin.id;
    guardId = guard.id;
    for (let index = 0; index < 4; index += 1) {
      const driver = await user(`driver-${index}`, "DRIVER");
      driverIds.push(driver.id);
      const vehicle = await prisma.vehicle.create({ data: {
        ownerUserId: driver.id,
        vehicleType: "SEDAN",
        registrationNumber: `DHAKA-METRO-GA-${Date.now()}-${index}`,
        normalizedRegistrationNumber: `DHAKAMETROGA${Date.now()}${index}`,
        verificationStatus: "VERIFIED",
      } });
      vehicleIds.push(vehicle.id);
    }

    const property = await prisma.property.create({ data: {
      createdByUserId: providerId,
      name: "Marketplace Integration Property",
      normalizedName: `marketplace integration ${randomUUID()}`,
      publicArea: "Gulshan, Dhaka",
      approximateAddress: "Near Gulshan circle",
      exactAddressCiphertext: "integration-ciphertext",
      exactAddressIv: "00112233445566778899aabb",
      exactAddressTag: "00112233445566778899aabbccddeeff",
      latitude: 23.7949,
      longitude: 90.4143,
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      verifiedByAdminId: adminId,
      verifiedAt: new Date(),
      providerMemberships: { create: {
        providerUserId: providerId,
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
        verifiedByAdminId: adminId,
        verifiedAt: new Date(),
      } },
    } });
    propertyId = property.id;
    providerMembershipId = (await prisma.propertyProvider.findUniqueOrThrow({
      where: { propertyId_providerUserId: { propertyId, providerUserId: providerId } },
    })).id;
    await prisma.propertyProvider.create({ data: {
      propertyId,
      providerUserId: secondProviderId,
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      verifiedByAdminId: adminId,
      verifiedAt: new Date(),
    } });
    const membership = await prisma.propertyGuardMembership.create({ data: {
      propertyId, guardUserId: guardId, addedByUserId: providerId, status: "ACTIVE", joinedAt: new Date(),
    } });
    await prisma.providerGuardAssignment.create({ data: {
      propertyGuardMembershipId: membership.id,
      providerMembershipId,
      createdByUserId: providerId,
      status: "ACTIVE",
    } });
  });

  after(async () => {
    if (propertyId) {
      await prisma.review.deleteMany({ where: { booking: { propertyId } } });
      await prisma.dispute.deleteMany({ where: { booking: { propertyId } } });
      await prisma.refund.deleteMany({ where: { payment: { booking: { propertyId } } } });
      await prisma.accessCredential.deleteMany({ where: { booking: { propertyId } } });
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.ledgerEntry.deleteMany({ where: { ledgerTransaction: { OR: [{ actorUserId: { in: userIds } }, { referenceType: "BOOKING_PAYMENT" }] } } });
      await prisma.ledgerTransaction.deleteMany({ where: { OR: [{ actorUserId: { in: userIds } }, { referenceType: "BOOKING_PAYMENT" }] } });
      await prisma.payment.deleteMany({ where: { booking: { propertyId } } });
      await prisma.payoutRequest.deleteMany({ where: { providerUserId: providerId } });
      await prisma.booking.deleteMany({ where: { propertyId } });
      await prisma.reservationHold.deleteMany({ where: { parkingSpot: { propertyId } } });
      await prisma.parkingAllocation.deleteMany({ where: { parkingSpot: { propertyId } } });
      await prisma.bookingQuote.deleteMany({ where: { parkingSpot: { propertyId } } });
      await prisma.parkingListing.deleteMany({ where: { parkingSpot: { propertyId } } });
      await prisma.parkingRight.deleteMany({ where: { parkingSpot: { propertyId } } });
      await prisma.availabilityException.deleteMany({ where: { parkingSpot: { propertyId } } });
      await prisma.availabilityRule.deleteMany({ where: { parkingSpot: { propertyId } } });
      await prisma.providerGuardAssignment.deleteMany({ where: { providerMembership: { propertyId } } });
      await prisma.propertyGuardMembership.deleteMany({ where: { propertyId } });
      await prisma.providerManagerDelegation.deleteMany({ where: { propertyId } });
      await prisma.parkingSpot.deleteMany({ where: { propertyId } });
      await prisma.domainAuditEvent.deleteMany({ where: { propertyId } });
      await prisma.propertyProvider.deleteMany({ where: { propertyId } });
      await prisma.property.deleteMany({ where: { id: propertyId } });
    }
    if (userIds.length) {
      await prisma.domainAuditEvent.deleteMany({ where: { actorUserId: { in: userIds } } });
      await prisma.vehicle.deleteMany({ where: { ownerUserId: { in: userIds } } });
      await prisma.walletAccount.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  async function createActiveOffer(type: "FIXED_SPACE" | "SHARED_POOL", capacity: number, quantity: number) {
    const resource = await marketplace.createResource(providerId, propertyId, {
      type: generated.ParkingResourceType[type],
      displayName: type === "FIXED_SPACE" ? "A-01" : "Shared basement",
      ...(type === "FIXED_SPACE" ? { spotCode: `A-${randomUUID().slice(0, 4)}` } : {}),
      capacity,
      supportedVehicleTypes: [generated.VehicleType.SEDAN],
      isCovered: true, hasCctv: true, hasGuard: true,
    });
    await marketplace.updateResource(providerId, resource.id, { status: "ACTIVE" });
    const right = await marketplace.claimParkingRight(providerId, resource.id, {
      rightType: generated.ParkingRightType.OWNERSHIP,
      quantity, canUse: true, canList: true, canSetPrice: true, canManageBookings: true, canDelegateManager: true,
    });
    await marketplace.verifyParkingRight(adminId, right.id, { decision: generated.ParkingRightStatus.VERIFIED });
    if (!managerDelegationId) {
      const delegation = await prisma.providerManagerDelegation.create({ data: {
        grantorProviderMembershipId: providerMembershipId,
        managerUserId: managerId,
        propertyId,
        status: "ACTIVE",
        acceptedAt: new Date(),
        permissions: { create: [
          { permission: "LISTING_VIEW" },
          { permission: "LISTING_MANAGE" },
          { permission: "PRICE_MANAGE" },
          { permission: "AVAILABILITY_MANAGE" },
          { permission: "BOOKING_VIEW" },
          { permission: "EARNINGS_VIEW" },
        ] },
      } });
      managerDelegationId = delegation.id;
    }
    const listing = await marketplace.createListing(managerId, {
      parkingRightId: right.id, title: `${type} integration offer`, pricePerHourPaisa: 6000n,
      minDurationMinutes: 15, maxDurationMinutes: 720,
      allowedVehicleTypes: [generated.VehicleType.SEDAN], securityDepositPaisa: 10000n,
    });
    await marketplace.replaceAvailability(managerId, resource.id, Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek, startLocalTime: "00:00", endLocalTime: "23:59", validFrom: "2020-01-01",
    })));
    const startAt = new Date(Date.now() + 30 * 60 * 1000);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    await marketplace.createAvailabilityException(managerId, resource.id, {
      startsAt: startAt.toISOString(), endsAt: endAt.toISOString(), exceptionType: "SPECIAL_AVAILABLE",
    });
    await marketplace.activateListing(managerId, listing.id);
    return { resource, right, listing, startAt, endAt };
  }

  it("runs fixed-space booking/payment/Guard/settlement/review and admits one concurrent hold", async () => {
    const offer = await createActiveOffer("FIXED_SPACE", 1, 1);
    const search = await marketplace.searchParking({
      latitude: 23.7949, longitude: 90.4143, radiusKm: 2,
      startAt: offer.startAt.toISOString(), endAt: offer.endAt.toISOString(), vehicleType: generated.VehicleType.SEDAN,
    });
    assert.ok(search.some((item) => item.id === propertyId));

    const quotes = await Promise.all([0, 1].map((index) => marketplace.createQuote(driverIds[index]!, {
      listingId: offer.listing.id, vehicleId: vehicleIds[index]!,
      startAt: offer.startAt.toISOString(), endAt: offer.endAt.toISOString(),
    })));
    const raced = await Promise.allSettled(quotes.map((quote, index) => marketplace.createHold(driverIds[index]!, {
      quoteId: quote.id, idempotencyKey: `fixed-hold-${randomUUID()}`,
    })));
    assert.equal(raced.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(raced.filter((result) => result.status === "rejected").length, 1);
    const winnerIndex = raced.findIndex((result) => result.status === "fulfilled");
    const hold = (raced[winnerIndex] as PromiseFulfilledResult<{ id: string }>).value;
    const booking = await marketplace.createBooking(driverIds[winnerIndex]!, {
      holdId: hold.id, idempotencyKey: `booking-${randomUUID()}`,
    });
    const paymentIdempotencyKey = `payment-${randomUUID()}`;
    const paid = await marketplace.captureSimulatedPayment(driverIds[winnerIndex]!, {
      bookingId: booking.id, idempotencyKey: paymentIdempotencyKey,
    });
    assert.equal(paid.booking.status, "CONFIRMED");
    assert.equal(typeof paid.accessCredential, "string");
    assert.equal(booking.settlementRecipientUserId, providerId);
    assert.notEqual(booking.settlementRecipientUserId, managerId);
    const retriedPayment = await marketplace.captureSimulatedPayment(driverIds[winnerIndex]!, {
      bookingId: booking.id, idempotencyKey: paymentIdempotencyKey,
    });
    assert.equal(retriedPayment.payment.id, paid.payment.id);
    assert.equal(retriedPayment.credentialAlreadyIssued, true);
    assert.equal(await prisma.payment.count({ where: { bookingId: booking.id } }), 1);
    await marketplace.verifyAccessCredential(guardId, paid.accessCredential!);
    const checkedIn = await marketplace.checkInBooking(guardId, booking.id, paid.accessCredential!);
    assert.equal(checkedIn.status, "CHECKED_IN");
    await marketplace.requestCheckout(driverIds[winnerIndex]!, booking.id);
    const completed = await marketplace.checkOutBooking(guardId, booking.id);
    assert.equal(completed.status, "COMPLETED");
    const review = await marketplace.createReview(driverIds[winnerIndex]!, booking.id, { rating: 5, comment: "Smooth entry" });
    assert.equal(review.rating, 5);

    const transaction = await prisma.ledgerTransaction.findFirstOrThrow({
      where: { referenceType: "BOOKING_PAYMENT", referenceId: paid.payment.id }, include: { entries: true },
    });
    const debit = transaction.entries.filter((entry) => entry.entrySide === "DEBIT").reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    const credit = transaction.entries.filter((entry) => entry.entrySide === "CREDIT").reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    assert.equal(debit, credit);
    const wallet = await prisma.walletAccount.findUniqueOrThrow({ where: { userId_currency: { userId: providerId, currency: "BDT" } } });
    assert.equal(wallet.availableBalancePaisa, BigInt(completed.baseAmountPaisa));
    const refund = await marketplace.createRefund(driverIds[winnerIndex]!, paid.payment.id, {
      amountPaisa: 100n,
      reason: "Integration partial refund",
      idempotencyKey: `refund-${randomUUID()}`,
    });
    assert.equal(refund.status, "SUCCEEDED");
    await assert.rejects(() => marketplace.createRefund(driverIds[winnerIndex]!, paid.payment.id, {
      amountPaisa: BigInt(paid.payment.amountPaisa),
      reason: "Must exceed remaining refundable amount",
      idempotencyKey: `refund-over-${randomUUID()}`,
    }));
    const walletAfterRefund = await prisma.walletAccount.findUniqueOrThrow({ where: { id: wallet.id } });
    await assert.rejects(() => marketplace.createPayout(providerId, {
      amountPaisa: walletAfterRefund.availableBalancePaisa + 1n,
      idempotencyKey: `payout-over-${randomUUID()}`,
    }));
    const payout = await marketplace.createPayout(providerId, {
      amountPaisa: 1_000n,
      idempotencyKey: `payout-${randomUUID()}`,
    });
    const approvedPayout = await marketplace.reviewPayout(adminId, payout.id, {
      decision: "APPROVED",
      note: "Verified for simulated payout",
    });
    assert.equal(approvedPayout.status, "APPROVED");
    const paidPayout = await marketplace.reviewPayout(adminId, payout.id, {
      decision: "PAID",
      note: "Simulated payout completed",
    });
    assert.equal(paidPayout.status, "PAID");
    const payoutLedger = await prisma.ledgerTransaction.findFirstOrThrow({
      where: { referenceType: "PAYOUT", referenceId: payout.id },
      include: { entries: true },
    });
    const payoutDebits = payoutLedger.entries.filter((entry) => entry.entrySide === "DEBIT")
      .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    const payoutCredits = payoutLedger.entries.filter((entry) => entry.entrySide === "CREDIT")
      .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    assert.equal(payoutDebits, payoutCredits);
  });

  it("caps shared-pool overlapping holds at the Provider right quantity", async () => {
    const offer = await createActiveOffer("SHARED_POOL", 10, 3);
    const secondRight = await marketplace.claimParkingRight(secondProviderId, offer.resource.id, {
      rightType: generated.ParkingRightType.OWNERSHIP,
      quantity: 1,
      canUse: true,
      canList: true,
      canSetPrice: true,
      canManageBookings: true,
      canDelegateManager: false,
    });
    await marketplace.verifyParkingRight(adminId, secondRight.id, {
      decision: generated.ParkingRightStatus.VERIFIED,
    });
    const secondListing = await marketplace.createListing(secondProviderId, {
      parkingRightId: secondRight.id,
      title: "Second Provider shared entitlement",
      pricePerHourPaisa: 7_000n,
      minDurationMinutes: 15,
      maxDurationMinutes: 720,
      allowedVehicleTypes: [generated.VehicleType.SEDAN],
      securityDepositPaisa: 0n,
    });
    await marketplace.activateListing(secondProviderId, secondListing.id);
    const quotes = await Promise.all(driverIds.map((driverId, index) => marketplace.createQuote(driverId, {
      listingId: offer.listing.id, vehicleId: vehicleIds[index]!,
      startAt: offer.startAt.toISOString(), endAt: offer.endAt.toISOString(),
    })));
    const attempts = await Promise.allSettled(quotes.map((quote, index) => marketplace.createHold(driverIds[index]!, {
      quoteId: quote.id, idempotencyKey: `shared-hold-${index}-${randomUUID()}`,
    })));
    assert.equal(attempts.filter((result) => result.status === "fulfilled").length, 3);
    assert.equal(attempts.filter((result) => result.status === "rejected").length, 1);
    const secondProviderQuote = await marketplace.createQuote(driverIds[3]!, {
      listingId: secondListing.id,
      vehicleId: vehicleIds[3]!,
      startAt: offer.startAt.toISOString(),
      endAt: offer.endAt.toISOString(),
    });
    const secondProviderHold = await marketplace.createHold(driverIds[3]!, {
      quoteId: secondProviderQuote.id,
      idempotencyKey: `shared-provider-b-${randomUUID()}`,
    });
    assert.equal(secondProviderHold.status, "ACTIVE");
    const acceptedDriver = attempts.findIndex((result) => result.status === "fulfilled");
    assert.notEqual(acceptedDriver, -1);
    const accepted = attempts[acceptedDriver]!;
    assert.equal(accepted.status, "fulfilled");
    await marketplace.releaseHold(driverIds[acceptedDriver]!, accepted.value.id);
    const rejectedIndex = attempts.findIndex((result) => result.status === "rejected");
    const retried = await marketplace.createHold(driverIds[rejectedIndex]!, {
      quoteId: quotes[rejectedIndex]!.id, idempotencyKey: `shared-retry-${randomUUID()}`,
    });
    assert.equal(retried.status, "ACTIVE");
  });
});
