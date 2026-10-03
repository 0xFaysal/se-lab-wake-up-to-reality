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
  let payoutMethodId = "";
  const driverIds: string[] = [];
  const vehicleIds: string[] = [];

  async function user(
    label: string,
    role: "PROVIDER" | "MANAGER" | "ADMIN" | "GUARD" | "DRIVER",
  ) {
    const record = await prisma.user.create({
      data: {
        fullName: `Marketplace ${label}`,
        email: `marketplace-${label}-${randomUUID()}@example.com`,
        phone: `+8801${Math.floor(300000000 + Math.random() * 699999999)}`,
        passwordHash: "integration-test-password-hash",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roles: { create: { role } },
        walletAccounts: { create: { currency: "BDT" } },
      },
    });
    userIds.push(record.id);
    return record;
  }

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = testDatabaseUrl!;
    process.env.REDIS_URL ??= "redis://localhost:6379";
    process.env.CORS_ORIGIN = "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET =
      "marketplace-access-secret-at-least-32-characters";
    process.env.JWT_REFRESH_SECRET =
      "marketplace-refresh-secret-at-least-32-characters";
    process.env.VERIFICATION_CODE_SECRET =
      "marketplace-verification-secret-at-least-32-chars";
    process.env.AUTH_METADATA_HASH_SECRET =
      "marketplace-metadata-secret-at-least-32-characters";
    process.env.PROPERTY_ADDRESS_FINGERPRINT_SECRET =
      "marketplace-property-secret-at-least-32-characters";
    process.env.DATA_ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    process.env.ENABLE_API_DOCS = "false";

    generated = await import("../../../generated/prisma/client.js");
    prisma = (await import("../../../src/config/prisma.js")).prisma;
    marketplace =
      await import("../../../src/modules/marketplace/marketplace.service.js");
    await prisma.$connect();

    const [provider, secondProvider, manager, admin, guard] = await Promise.all(
      [
        user("provider", "PROVIDER"),
        user("provider-b", "PROVIDER"),
        user("manager", "MANAGER"),
        user("admin", "ADMIN"),
        user("guard", "GUARD"),
      ],
    );
    providerId = provider.id;
    secondProviderId = secondProvider.id;
    managerId = manager.id;
    adminId = admin.id;
    guardId = guard.id;
    for (let index = 0; index < 4; index += 1) {
      const driver = await user(`driver-${index}`, "DRIVER");
      driverIds.push(driver.id);
      const vehicle = await prisma.vehicle.create({
        data: {
          ownerUserId: driver.id,
          vehicleType: "SEDAN",
          registrationNumber: `DHAKA-METRO-GA-${Date.now()}-${index}`,
          normalizedRegistrationNumber: `DHAKAMETROGA${Date.now()}${index}`,
          verificationStatus: "VERIFIED",
        },
      });
      vehicleIds.push(vehicle.id);
    }

    const property = await prisma.property.create({
      data: {
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
        providerMemberships: {
          create: {
            providerUserId: providerId,
            status: "ACTIVE",
            verificationStatus: "VERIFIED",
            verifiedByAdminId: adminId,
            verifiedAt: new Date(),
          },
        },
      },
    });
    propertyId = property.id;
    providerMembershipId = (
      await prisma.propertyProvider.findUniqueOrThrow({
        where: {
          propertyId_providerUserId: { propertyId, providerUserId: providerId },
        },
      })
    ).id;
    await prisma.propertyProvider.create({
      data: {
        propertyId,
        providerUserId: secondProviderId,
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
        verifiedByAdminId: adminId,
        verifiedAt: new Date(),
      },
    });
    const membership = await prisma.propertyGuardMembership.create({
      data: {
        propertyId,
        guardUserId: guardId,
        addedByUserId: providerId,
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });
    await prisma.providerGuardAssignment.create({
      data: {
        propertyGuardMembershipId: membership.id,
        providerMembershipId,
        createdByUserId: providerId,
        status: "ACTIVE",
      },
    });
    const payoutMethod = await marketplace.createProviderPayoutMethod(
      providerId,
      {
        type: generated.PayoutMethodType.BKASH,
        accountHolderName: "Marketplace Provider",
        accountIdentifier: "+8801712345678",
        isDefault: true,
      },
    );
    payoutMethodId = payoutMethod.id;
    assert.equal(payoutMethod.status, "PENDING_VERIFICATION");
    await assert.rejects(() =>
      marketplace.createPayout(providerId, {
        amountPaisa: 100n,
        payoutMethodId: payoutMethod.id,
        idempotencyKey: `unverified-${randomUUID()}`,
      }),
    );
    await marketplace.reviewPayoutMethod(adminId, payoutMethod.id, {
      decision: "APPROVED",
      note: "Integration destination verified",
    });
  });

  after(async () => {
    if (propertyId) {
      await prisma.review.deleteMany({ where: { booking: { propertyId } } });
      await prisma.dispute.deleteMany({ where: { booking: { propertyId } } });
      await prisma.refund.deleteMany({
        where: { payment: { booking: { propertyId } } },
      });
      await prisma.bookingCancellation.deleteMany({
        where: { booking: { propertyId } },
      });
      await prisma.accessCredential.deleteMany({
        where: { booking: { propertyId } },
      });
      await prisma.notification.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.ledgerEntry.deleteMany({
        where: {
          ledgerTransaction: {
            OR: [
              { actorUserId: { in: userIds } },
              { referenceType: "BOOKING_PAYMENT_HELD" },
            ],
          },
        },
      });
      await prisma.ledgerTransaction.deleteMany({
        where: {
          OR: [
            { actorUserId: { in: userIds } },
            { referenceType: "BOOKING_PAYMENT_HELD" },
          ],
        },
      });
      await prisma.payment.deleteMany({ where: { booking: { propertyId } } });
      await prisma.payoutRequest.deleteMany({
        where: { providerUserId: providerId },
      });
      await prisma.providerPayoutMethod.deleteMany({
        where: { providerUserId: providerId },
      });
      await prisma.booking.deleteMany({ where: { propertyId } });
      await prisma.reservationHold.deleteMany({
        where: { parkingSpot: { propertyId } },
      });
      await prisma.parkingAllocation.deleteMany({
        where: { parkingSpot: { propertyId } },
      });
      await prisma.bookingQuote.deleteMany({
        where: { parkingSpot: { propertyId } },
      });
      await prisma.parkingListing.deleteMany({
        where: { parkingSpot: { propertyId } },
      });
      await prisma.parkingRight.deleteMany({
        where: { parkingSpot: { propertyId } },
      });
      await prisma.availabilityException.deleteMany({
        where: { parkingSpot: { propertyId } },
      });
      await prisma.availabilityRule.deleteMany({
        where: { parkingSpot: { propertyId } },
      });
      await prisma.providerGuardAssignment.deleteMany({
        where: { providerMembership: { propertyId } },
      });
      await prisma.propertyGuardMembership.deleteMany({
        where: { propertyId },
      });
      await prisma.providerManagerDelegation.deleteMany({
        where: { propertyId },
      });
      await prisma.parkingSpot.deleteMany({ where: { propertyId } });
      await prisma.domainAuditEvent.deleteMany({ where: { propertyId } });
      await prisma.propertyProvider.deleteMany({ where: { propertyId } });
      await prisma.property.deleteMany({ where: { id: propertyId } });
    }
    if (userIds.length) {
      await prisma.domainAuditEvent.deleteMany({
        where: { actorUserId: { in: userIds } },
      });
      await prisma.vehicle.deleteMany({
        where: { ownerUserId: { in: userIds } },
      });
      await prisma.walletAccount.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  async function createActiveOffer(
    type: "FIXED_SPACE" | "SHARED_POOL",
    capacity: number,
    quantity: number,
  ) {
    const resource = await marketplace.createResource(providerId, propertyId, {
      type: generated.ParkingResourceType[type],
      displayName: type === "FIXED_SPACE" ? "A-01" : "Shared basement",
      ...(type === "FIXED_SPACE"
        ? { spotCode: `A-${randomUUID().slice(0, 4)}` }
        : {}),
      capacity,
      supportedVehicleTypes: [generated.VehicleType.SEDAN],
      isCovered: true,
      hasCctv: true,
      hasGuard: true,
    });
    await marketplace.updateResource(providerId, resource.id, {
      status: "ACTIVE",
    });
    const right = await marketplace.claimParkingRight(providerId, resource.id, {
      rightType: generated.ParkingRightType.OWNERSHIP,
      quantity,
      canUse: true,
      canList: true,
      canSetPrice: true,
      canManageBookings: true,
      canDelegateManager: true,
    });
    await marketplace.verifyParkingRight(adminId, right.id, {
      decision: generated.ParkingRightStatus.VERIFIED,
      expectedVersion: right.version,
    });
    if (!managerDelegationId) {
      const delegation = await prisma.providerManagerDelegation.create({
        data: {
          grantorProviderMembershipId: providerMembershipId,
          managerUserId: managerId,
          propertyId,
          status: "ACTIVE",
          acceptedAt: new Date(),
          permissions: {
            create: [
              { permission: "LISTING_VIEW" },
              { permission: "LISTING_MANAGE" },
              { permission: "PRICE_MANAGE" },
              { permission: "AVAILABILITY_MANAGE" },
              { permission: "BOOKING_VIEW" },
              { permission: "EARNINGS_VIEW" },
            ],
          },
        },
      });
      managerDelegationId = delegation.id;
    }
    const listing = await marketplace.createListing(managerId, {
      parkingRightId: right.id,
      title: `${type} integration offer`,
      pricePerHourPaisa: 6000n,
      minDurationMinutes: 15,
      maxDurationMinutes: 720,
      allowedVehicleTypes: [generated.VehicleType.SEDAN],
      securityDepositPaisa: 10000n,
    });
    await marketplace.replaceAvailability(
      managerId,
      resource.id,
      Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        startLocalTime: "00:00",
        endLocalTime: "23:59",
        validFrom: "2020-01-01",
      })),
    );
    const startAt = new Date(Date.now() + 30 * 60 * 1000);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    const availabilityException = await marketplace.createAvailabilityException(
      managerId,
      resource.id,
      {
        startsAt: startAt.toISOString(),
        endsAt: endAt.toISOString(),
        exceptionType: "SPECIAL_AVAILABLE",
      },
    );
    await marketplace.activateListing(managerId, listing.id);
    return { resource, right, listing, availabilityException, startAt, endAt };
  }

  it("runs fixed-space booking/payment/Guard/settlement/review and admits one concurrent hold", async () => {
    const offer = await createActiveOffer("FIXED_SPACE", 1, 1);
    const search = await marketplace.searchParking({
      latitude: 23.7949,
      longitude: 90.4143,
      radiusKm: 2,
      startAt: offer.startAt.toISOString(),
      endAt: offer.endAt.toISOString(),
      vehicleType: generated.VehicleType.SEDAN,
    });
    assert.ok(search.some((item) => item.id === propertyId));

    const quotes = await Promise.all(
      [0, 1].map((index) =>
        marketplace.createQuote(driverIds[index]!, {
          listingId: offer.listing.id,
          vehicleId: vehicleIds[index]!,
          startAt: offer.startAt.toISOString(),
          endAt: offer.endAt.toISOString(),
        }),
      ),
    );
    const raced = await Promise.allSettled(
      quotes.map((quote, index) =>
        marketplace.createHold(driverIds[index]!, {
          quoteId: quote.id,
          idempotencyKey: `fixed-hold-${randomUUID()}`,
        }),
      ),
    );
    assert.equal(
      raced.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      raced.filter((result) => result.status === "rejected").length,
      1,
    );
    const winnerIndex = raced.findIndex(
      (result) => result.status === "fulfilled",
    );
    const hold = (raced[winnerIndex] as PromiseFulfilledResult<{ id: string }>)
      .value;
    const booking = await marketplace.createBooking(driverIds[winnerIndex]!, {
      holdId: hold.id,
      idempotencyKey: `booking-${randomUUID()}`,
    });
    const paymentIdempotencyKey = `payment-${randomUUID()}`;
    const paid = await marketplace.captureSimulatedPayment(
      driverIds[winnerIndex]!,
      {
        bookingId: booking.id,
        idempotencyKey: paymentIdempotencyKey,
      },
    );
    assert.equal(paid.booking.status, "CONFIRMED");
    assert.equal(typeof paid.accessCredential, "string");
    assert.equal(booking.settlementRecipientUserId, providerId);
    assert.notEqual(booking.settlementRecipientUserId, managerId);
    const providerBooking = await marketplace.getProviderBooking(
      providerId,
      booking.id,
    );
    assert.equal(providerBooking.id, booking.id);
    const delegatedManagerBooking = await marketplace.getProviderBooking(
      managerId,
      booking.id,
    );
    assert.equal(delegatedManagerBooking.id, booking.id);
    await assert.rejects(() =>
      marketplace.getProviderBooking(
        driverIds[(winnerIndex + 1) % 2]!,
        booking.id,
      ),
    );
    const retriedPayment = await marketplace.captureSimulatedPayment(
      driverIds[winnerIndex]!,
      {
        bookingId: booking.id,
        idempotencyKey: paymentIdempotencyKey,
      },
    );
    assert.equal(retriedPayment.payment.id, paid.payment.id);
    assert.equal(retriedPayment.credentialAlreadyIssued, true);
    assert.equal(
      await prisma.payment.count({ where: { bookingId: booking.id } }),
      1,
    );
    const publicDetail = await marketplace.getPublicPropertyDetail(propertyId, {
      startAt: offer.startAt.toISOString(),
      endAt: offer.endAt.toISOString(),
      vehicleType: generated.VehicleType.SEDAN,
    });
    assert.equal(publicDetail.id, propertyId);
    assert.equal("exactAddressCiphertext" in publicDetail, false);
    const guardQueue = await marketplace.listGuardBookings(guardId, {
      page: 1,
      limit: 20,
    });
    assert.ok(guardQueue.bookings.some((item) => item.id === booking.id));
    const guardBooking = await marketplace.getGuardBooking(guardId, booking.id);
    assert.equal(guardBooking.bookingCode, booking.bookingCode);
    assert.equal("totalAmountPaisa" in guardBooking, false);
    await assert.rejects(() =>
      marketplace.getDriverBooking(
        driverIds[(winnerIndex + 1) % 2]!,
        booking.id,
      ),
    );
    await marketplace.verifyAccessCredential(guardId, paid.accessCredential!);
    const checkedIn = await marketplace.checkInBooking(
      guardId,
      booking.id,
      paid.accessCredential!,
    );
    assert.equal(checkedIn.status, "CHECKED_IN");
    const exit = await marketplace.requestCheckout(
      driverIds[winnerIndex]!,
      booking.id,
    );
    await assert.rejects(() =>
      marketplace.checkOutBooking(guardId, booking.id, "EXIT-invalid"),
    );
    const exitVerification = await marketplace.verifyAccessCredential(
      guardId,
      exit.exitCredential,
    );
    assert.equal(exitVerification.purpose, "EXIT");
    const completed = await marketplace.checkOutBooking(
      guardId,
      booking.id,
      exit.exitCredential,
    );
    assert.equal(completed.status, "COMPLETED");
    const providerBeforeDispute = await prisma.walletAccount.findUniqueOrThrow({
      where: { userId_currency: { userId: providerId, currency: "BDT" } },
    });
    assert.equal(providerBeforeDispute.availableBalancePaisa, 0n);
    assert.equal(
      providerBeforeDispute.pendingBalancePaisa,
      BigInt(completed.baseAmountPaisa),
    );
    const review = await marketplace.createReview(
      driverIds[winnerIndex]!,
      booking.id,
      {
        rating: 5,
        securityRating: 4,
        locationAccuracyRating: 5,
        cleanlinessRating: 3,
        comment: "Smooth entry",
      },
    );
    assert.equal(review.rating, 5);
    assert.equal(review.securityRating, 4);
    const dispute = await marketplace.createDispute(
      driverIds[winnerIndex]!,
      booking.id,
      {
        category: "ACCESS",
        description: "Integration test dispute description",
      },
    );
    const providerHeld = await prisma.walletAccount.findUniqueOrThrow({
      where: { id: providerBeforeDispute.id },
    });
    assert.equal(providerHeld.pendingBalancePaisa, 0n);
    assert.equal(
      providerHeld.heldBalancePaisa,
      BigInt(completed.baseAmountPaisa),
    );
    await marketplace.resolveDispute(adminId, dispute.id, {
      decision: "RESOLVED",
      resolution: "Integration hold reviewed without a monetary adjustment",
    });
    const providerAfterDispute = await prisma.walletAccount.findUniqueOrThrow({
      where: { id: providerBeforeDispute.id },
    });
    assert.equal(
      providerAfterDispute.pendingBalancePaisa,
      BigInt(completed.baseAmountPaisa),
    );
    assert.equal(providerAfterDispute.heldBalancePaisa, 0n);
    await prisma.bookingSettlement.update({
      where: { bookingId: booking.id },
      data: { completedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    });
    await marketplace.reconcileMarketplaceLifecycle();
    await marketplace.reconcileMarketplaceLifecycle();
    const driverDisputes = await marketplace.listDriverDisputes(
      driverIds[winnerIndex]!,
      { page: 1, limit: 20 },
    );
    const providerDisputes = await marketplace.listProviderDisputes(
      providerId,
      { page: 1, limit: 20 },
    );
    assert.ok(driverDisputes.disputes.some((item) => item.id === dispute.id));
    assert.ok(providerDisputes.disputes.some((item) => item.id === dispute.id));
    await assert.rejects(() =>
      marketplace.getDriverDispute(
        driverIds[(winnerIndex + 1) % 2]!,
        dispute.id,
      ),
    );
    const adminListings = await marketplace.listAdminListings({
      page: 1,
      limit: 20,
      propertyId,
    });
    assert.ok(
      adminListings.listings.some((item) => item.id === offer.listing.id),
    );
    assert.equal(
      (await marketplace.getAdminListing(offer.listing.id)).id,
      offer.listing.id,
    );
    const updatedException = await marketplace.updateAvailabilityException(
      managerId,
      offer.availabilityException.id,
      { reason: "Updated integration exception" },
    );
    assert.equal(updatedException.reason, "Updated integration exception");
    await marketplace.deleteAvailabilityException(
      managerId,
      offer.availabilityException.id,
    );
    assert.equal(
      await prisma.availabilityException.count({
        where: { id: offer.availabilityException.id },
      }),
      0,
    );

    const transaction = await prisma.ledgerTransaction.findFirstOrThrow({
      where: {
        referenceType: "BOOKING_PAYMENT_HELD",
        referenceId: paid.payment.id,
      },
      include: { entries: true },
    });
    const debit = transaction.entries
      .filter((entry) => entry.entrySide === "DEBIT")
      .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    const credit = transaction.entries
      .filter((entry) => entry.entrySide === "CREDIT")
      .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    assert.equal(debit, credit);
    const wallet = await prisma.walletAccount.findUniqueOrThrow({
      where: { userId_currency: { userId: providerId, currency: "BDT" } },
    });
    assert.equal(
      wallet.availableBalancePaisa,
      BigInt(completed.baseAmountPaisa),
    );
    await assert.rejects(() =>
      marketplace.createRefund(driverIds[winnerIndex]!, paid.payment.id, {
        amountPaisa: 100n,
        reason: "Driver cannot issue arbitrary refunds",
        idempotencyKey: `refund-${randomUUID()}`,
      }),
    );
    const refunds = await marketplace.listDriverRefunds(
      driverIds[winnerIndex]!,
      { page: 1, limit: 20 },
    );
    assert.ok(
      refunds.refunds.some((item) => item.payment.booking.id === booking.id),
    );
    await assert.rejects(() =>
      marketplace.createRefund(driverIds[winnerIndex]!, paid.payment.id, {
        amountPaisa: BigInt(paid.payment.amountPaisa),
        reason: "Must exceed remaining refundable amount",
        idempotencyKey: `refund-over-${randomUUID()}`,
      }),
    );
    const walletAfterRefund = await prisma.walletAccount.findUniqueOrThrow({
      where: { id: wallet.id },
    });
    await assert.rejects(() =>
      marketplace.createPayout(providerId, {
        amountPaisa: walletAfterRefund.availableBalancePaisa + 1n,
        payoutMethodId,
        idempotencyKey: `payout-over-${randomUUID()}`,
      }),
    );
    const concurrentAmount =
      (walletAfterRefund.availableBalancePaisa * 4n) / 10n;
    const concurrent = await Promise.allSettled(
      [1, 2, 3].map(() =>
        marketplace.createPayout(providerId, {
          amountPaisa: concurrentAmount,
          payoutMethodId,
          idempotencyKey: `concurrent-payout-${randomUUID()}`,
        }),
      ),
    );
    assert.equal(
      concurrent.filter((item) => item.status === "fulfilled").length,
      2,
    );
    for (const item of concurrent) {
      if (item.status === "rejected") assert.equal(item.reason.statusCode, 409);
      else
        await marketplace.reviewPayout(adminId, item.value.id, {
          decision: "REJECTED",
          note: "Release integration reservation",
        });
    }
    const payoutKey = `payout-${randomUUID()}`;
    const payout = await marketplace.createPayout(providerId, {
      amountPaisa: 1_000n,
      payoutMethodId,
      idempotencyKey: payoutKey,
    });
    assert.equal(
      (
        await marketplace.createPayout(providerId, {
          amountPaisa: 1_000n,
          payoutMethodId,
          idempotencyKey: payoutKey,
        })
      ).id,
      payout.id,
    );
    await assert.rejects(() =>
      marketplace.createPayout(secondProviderId, {
        amountPaisa: 1_000n,
        payoutMethodId,
        idempotencyKey: payoutKey,
      }),
    );
    const payouts = await marketplace.listProviderPayouts(providerId, {
      page: 1,
      limit: 20,
    });
    assert.ok(payouts.payouts.some((item) => item.id === payout.id));
    await assert.rejects(() =>
      marketplace.getProviderPayout(secondProviderId, payout.id),
    );
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
    const payoutDebits = payoutLedger.entries
      .filter((entry) => entry.entrySide === "DEBIT")
      .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    const payoutCredits = payoutLedger.entries
      .filter((entry) => entry.entrySide === "CREDIT")
      .reduce((sum, entry) => sum + entry.amountPaisa, 0n);
    assert.equal(payoutDebits, payoutCredits);
  });

  it("caps shared-pool overlapping holds at the Provider right quantity", async () => {
    const offer = await createActiveOffer("SHARED_POOL", 10, 3);
    const secondRight = await marketplace.claimParkingRight(
      secondProviderId,
      offer.resource.id,
      {
        rightType: generated.ParkingRightType.OWNERSHIP,
        quantity: 1,
        canUse: true,
        canList: true,
        canSetPrice: true,
        canManageBookings: true,
        canDelegateManager: false,
      },
    );
    await marketplace.verifyParkingRight(adminId, secondRight.id, {
      decision: generated.ParkingRightStatus.VERIFIED,
      expectedVersion: secondRight.version,
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
    const quotes = await Promise.all(
      driverIds.map((driverId, index) =>
        marketplace.createQuote(driverId, {
          listingId: offer.listing.id,
          vehicleId: vehicleIds[index]!,
          startAt: offer.startAt.toISOString(),
          endAt: offer.endAt.toISOString(),
        }),
      ),
    );
    const attempts = await Promise.allSettled(
      quotes.map((quote, index) =>
        marketplace.createHold(driverIds[index]!, {
          quoteId: quote.id,
          idempotencyKey: `shared-hold-${index}-${randomUUID()}`,
        }),
      ),
    );
    assert.equal(
      attempts.filter((result) => result.status === "fulfilled").length,
      3,
    );
    assert.equal(
      attempts.filter((result) => result.status === "rejected").length,
      1,
    );
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
    const acceptedDriver = attempts.findIndex(
      (result) => result.status === "fulfilled",
    );
    assert.notEqual(acceptedDriver, -1);
    const accepted = attempts[acceptedDriver]!;
    assert.equal(accepted.status, "fulfilled");
    await marketplace.releaseHold(
      driverIds[acceptedDriver]!,
      accepted.value.id,
    );
    const rejectedIndex = attempts.findIndex(
      (result) => result.status === "rejected",
    );
    const retried = await marketplace.createHold(driverIds[rejectedIndex]!, {
      quoteId: quotes[rejectedIndex]!.id,
      idempotencyKey: `shared-retry-${randomUUID()}`,
    });
    assert.equal(retried.status, "ACTIVE");
  });

  it("blocks marketplace setup for an ineligible Property", async () => {
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: "INACTIVE", verificationStatus: "PENDING" },
    });
    try {
      await assert.rejects(() =>
        marketplace.createResource(providerId, propertyId, {
          type: generated.ParkingResourceType.FIXED_SPACE,
          displayName: "Blocked setup",
          spotCode: `BLOCKED-${randomUUID().slice(0, 4)}`,
          capacity: 1,
          supportedVehicleTypes: [generated.VehicleType.SEDAN],
          isCovered: false,
          hasCctv: false,
          hasGuard: false,
        }),
      );
    } finally {
      await prisma.property.update({
        where: { id: propertyId },
        data: { status: "ACTIVE", verificationStatus: "VERIFIED" },
      });
    }
  });

  it("does not cancel a booking while a hosted payment checkout can still complete", async () => {
    const offer = await createActiveOffer("FIXED_SPACE", 1, 1);
    const quote = await marketplace.createQuote(driverIds[0]!, {
      listingId: offer.listing.id,
      vehicleId: vehicleIds[0]!,
      startAt: offer.startAt.toISOString(),
      endAt: offer.endAt.toISOString(),
    });
    const hold = await marketplace.createHold(driverIds[0]!, {
      quoteId: quote.id,
      idempotencyKey: `checkout-hold-${randomUUID()}`,
    });
    const booking = await marketplace.createBooking(driverIds[0]!, {
      holdId: hold.id,
      idempotencyKey: `checkout-booking-${randomUUID()}`,
    });
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        payerUserId: driverIds[0]!,
        amountPaisa: BigInt(booking.totalAmountPaisa),
        grossAmountPaisa: BigInt(booking.totalAmountPaisa),
        status: "SESSION_CREATED",
        provider: "SSLCOMMERZ",
        idempotencyKey: `checkout-payment-${randomUUID()}`,
        initiatedAt: new Date(),
        sessionExpiresAt: new Date(Date.now() + 20 * 60 * 1000),
        checkoutUrl: "https://sandbox.example.test/checkout",
      },
    });

    const detail = await marketplace.getDriverBooking(
      driverIds[0]!,
      booking.id,
    );
    assert.equal(detail.canCancel, false);
    await assert.rejects(() =>
      marketplace.cancelBooking(driverIds[0]!, booking.id, {
        idempotencyKey: `checkout-cancel-blocked-${randomUUID()}`,
      }),
    );
    await assert.rejects(() =>
      marketplace.cancelBookingAsAdmin(
        adminId,
        booking.id,
        "Support cancellation test",
      ),
    );

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        sessionExpiresAt: null,
        checkoutUrl: null,
      },
    });
    const cancelled = await marketplace.cancelBooking(
      driverIds[0]!,
      booking.id,
      {
        idempotencyKey: `checkout-cancel-${randomUUID()}`,
      },
    );
    assert.equal(cancelled.booking.status, "CANCELLED");
    assert.equal(
      (
        await prisma.parkingAllocation.findUniqueOrThrow({
          where: { id: booking.allocationId },
        })
      ).status,
      "RELEASED",
    );
  });

  it("requires a full refund before an Admin cancels a paid booking", async () => {
    const offer = await createActiveOffer("FIXED_SPACE", 1, 1);
    const quote = await marketplace.createQuote(driverIds[0]!, {
      listingId: offer.listing.id,
      vehicleId: vehicleIds[0]!,
      startAt: offer.startAt.toISOString(),
      endAt: offer.endAt.toISOString(),
    });
    const hold = await marketplace.createHold(driverIds[0]!, {
      quoteId: quote.id,
      idempotencyKey: `admin-refund-hold-${randomUUID()}`,
    });
    const booking = await marketplace.createBooking(driverIds[0]!, {
      holdId: hold.id,
      idempotencyKey: `admin-refund-booking-${randomUUID()}`,
    });
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        payerUserId: driverIds[0]!,
        amountPaisa: BigInt(booking.totalAmountPaisa),
        grossAmountPaisa: BigInt(booking.totalAmountPaisa),
        status: "SUCCEEDED",
        provider: "SSLCOMMERZ",
        idempotencyKey: `admin-refund-payment-${randomUUID()}`,
        succeededAt: new Date(),
        capturedAt: new Date(),
      },
    });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    await assert.rejects(() =>
      marketplace.cancelBookingAsAdmin(
        adminId,
        booking.id,
        "Paid booking cancellation test",
      ),
    );
    assert.equal(
      (await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } }))
        .status,
      "CONFIRMED",
    );
  });
});
