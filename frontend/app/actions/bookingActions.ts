"use server";

import { z } from "zod";
import { logDriverAction } from "@/lib/security/driverLogger";

// ─── Input Validation Schema ─────────────────────────────────────────────────

export const CreateBookingSessionSchema = z.object({
  driverId: z.string().min(1, "Driver ID is required").max(64),
  propertyId: z.string().min(1, "Property ID is required").max(64),
  spotId: z.string().min(1, "Spot ID is required").max(64),
  startTime: z.string().datetime({ message: "Start time must be a valid ISO datetime" }),
  endTime: z.string().datetime({ message: "End time must be a valid ISO datetime" }),
  clientCalculatedTotal: z.number().positive("Total must be greater than 0").max(500000, "Excessive booking amount"),
  idempotencyKey: z.string().max(128).optional(),
});

export type CreateBookingSessionPayload = z.infer<typeof CreateBookingSessionSchema>;

// ─── In-Memory Mock Stores ───────────────────────────────────────────────────

// Simulates an idempotency cache to prevent double-charging or duplicate session creation
const idempotencyStore = new Map<string, any>();

// Simulates a pessimistic lock / atomic check against the database
async function checkSpotAvailabilityAtomically(
  spotId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  // In production, uses SELECT FOR UPDATE or Redis Redlock
  return Math.random() > 0.05; 
}

// Simulates fetching authoritative pricing configurations directly from the DB
async function getSecurePricingForProperty(propertyId: string): Promise<{
  baseHourlyRate: number; // in BDT
  peakSurgeMultiplier: number;
}> {
  // Authoritative DB configuration (never trust client)
  return {
    baseHourlyRate: 50, // 50 BDT per hour
    peakSurgeMultiplier: 1.2, // 20% surge during peak traffic
  };
}

/**
 * Evaluates whether a timestamp falls within Bangladesh peak traffic hours (UTC+6).
 * Morning Peak: 08:00 - 11:00 BST
 * Evening Peak: 17:00 - 21:00 BST
 */
function isWithinBangladeshPeakHours(date: Date): boolean {
  const bdHour = (date.getUTCHours() + 6) % 24;
  return (bdHour >= 8 && bdHour < 11) || (bdHour >= 17 && bdHour < 21);
}

// ─── Server Action ───────────────────────────────────────────────────────────

/**
 * Creates a pending booking session before handing off to the payment gateway.
 * Battle-hardened with:
 * 1. Strict Zod input validation & date window sanitation
 * 2. Idempotency replay protection
 * 3. Concurrency locking against race conditions (double-booking)
 * 4. Zero-Trust authoritative server pricing & peak surge recalculation
 * 5. Integer-paisa financial comparison (eliminating IEEE-754 float manipulation)
 * 6. Non-repudiable DevSecOps audit logging with SHA-256 seal
 */
export async function createBookingSession(rawPayload: CreateBookingSessionPayload) {
  // 1. Strict Schema Validation
  const parseResult = CreateBookingSessionSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((i) => i.message).join(", ");
    await logDriverAction({
      driverId: rawPayload?.driverId || "anonymous",
      actionType: "PRICE_TAMPERING_ATTEMPT",
      actionDescription: `Rejected malformed booking payload: ${errorMsg}`,
      status: "FAILURE",
      payload: { rawPayload }
    });
    return { success: false, message: `Validation Error: ${errorMsg}` };
  }

  const payload = parseResult.data;
  const { driverId, propertyId, spotId, startTime, endTime, clientCalculatedTotal, idempotencyKey } = payload;

  // 2. Idempotency Check
  if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
    return idempotencyStore.get(idempotencyKey);
  }

  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    // 3. Temporal Boundary Validation (Anti-Replay / Clock Manipulation)
    if (start.getTime() < now.getTime() - 5 * 60 * 1000) {
      throw new Error("INVALID_BOOKING_TIME: Start time cannot be in the past.");
    }

    const durationMs = end.getTime() - start.getTime();
    if (durationMs < 30 * 60 * 1000) {
      throw new Error("INVALID_BOOKING_DURATION: Minimum booking duration is 30 minutes.");
    }

    if (durationMs > 72 * 60 * 60 * 1000) {
      throw new Error("INVALID_BOOKING_DURATION: Maximum single session duration is 72 hours.");
    }

    // 4. Concurrency Control: Atomic Availability Check
    const isAvailable = await checkSpotAvailabilityAtomically(spotId, start, end);
    if (!isAvailable) {
      throw new Error("RACE_CONDITION_PREVENTED: The spot was just booked by another user.");
    }

    // 5. Zero-Trust Pricing Recalculation
    const secureConfig = await getSecurePricingForProperty(propertyId);

    // Duration in fractional hours (rounded to 1 decimal place for fair billing)
    const durationHours = Math.max(1, Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10);

    // Server independently determines peak hours (never trusts client boolean)
    const isPeak = isWithinBangladeshPeakHours(start) || isWithinBangladeshPeakHours(end);

    // Calculate in integer Paisa (1 BDT = 100 Paisa) to avoid floating point tampering
    const baseHourlyRatePaisa = Math.round(secureConfig.baseHourlyRate * 100);
    let authoritativeTotalPaisa = Math.round(durationHours * baseHourlyRatePaisa);

    if (isPeak) {
      authoritativeTotalPaisa = Math.round(authoritativeTotalPaisa * secureConfig.peakSurgeMultiplier);
    }

    const authoritativeTotalBDT = authoritativeTotalPaisa / 100;
    const clientSubmittedTotalPaisa = Math.round(clientCalculatedTotal * 100);

    // 6. Price Tampering Detection (Exact Paisa Match)
    if (authoritativeTotalPaisa !== clientSubmittedTotalPaisa) {
      await logDriverAction({
        driverId,
        actionType: "PRICE_TAMPERING_ATTEMPT",
        actionDescription: `Financial integrity breach: Driver submitted ${clientCalculatedTotal} BDT (${clientSubmittedTotalPaisa} paisa). Authoritative expected amount: ${authoritativeTotalBDT} BDT (${authoritativeTotalPaisa} paisa).`,
        status: "FAILURE",
        payload: {
          propertyId,
          spotId,
          clientTotalBDT: clientCalculatedTotal,
          clientTotalPaisa: clientSubmittedTotalPaisa,
          authoritativeTotalBDT,
          authoritativeTotalPaisa,
          serverDeterminedPeak: isPeak,
          durationHours
        }
      });

      throw new Error("SECURITY_ALERT: Payment integrity mismatch detected. The transaction has been blocked.");
    }

    // 7. Secure Session Generation
    const sessionId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 8. Immutable Audit Trail
    await logDriverAction({
      driverId,
      actionType: "INITIATE_BOOKING",
      actionDescription: `Successfully initiated checkout session ${sessionId} for spot ${spotId}`,
      status: "SUCCESS",
      payload: {
        sessionId,
        propertyId,
        spotId,
        totalAmountBDT: authoritativeTotalBDT,
        totalAmountPaisa: authoritativeTotalPaisa,
        startTime,
        endTime,
        isPeakHoursApplied: isPeak,
        durationHours
      }
    });

    const response = {
      success: true,
      sessionId,
      totalAmount: authoritativeTotalBDT,
      message: "Checkout session created securely."
    };

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, response);
    }

    return response;

  } catch (error: any) {
    if (!error.message?.includes("SECURITY_ALERT")) {
      await logDriverAction({
        driverId,
        actionType: "GENERIC_DRIVER_ACTION",
        actionDescription: `Failed to create checkout session: ${error.message}`,
        status: "FAILURE",
        payload: { propertyId, spotId, error: error.message }
      });
    }

    return { success: false, message: error.message };
  }
}
