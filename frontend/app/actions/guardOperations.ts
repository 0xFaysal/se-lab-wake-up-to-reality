"use server";

import { logGuardAction, verifyGuardShift } from "@/lib/security/guardSecurity";

/**
 * Processes a vehicle entry (Check-In).
 * Enforces strict shift validation and server-side timestamping.
 */
export async function processVehicleEntry(
  guardId: string,
  propertyId: string,
  bookingId: string,
  // Note: We explicitly DO NOT accept a client-side timestamp parameter
) {
  try {
    // 1. Shift Validator - Strict Boundary & Object Ownership Check
    await verifyGuardShift(guardId, propertyId, bookingId);

    // 2. Enforce Server-Side UTC Clock
    const serverTimestamp = new Date().toISOString();

    // 3. Database State Change (Mocked)
    // db.bookings.update({ 
    //   where: { id: bookingId }, 
    //   data: { status: 'CHECKED_IN', checkedInAt: serverTimestamp }
    // })

    // 4. Immutable Physical Footprint Logging
    await logGuardAction({
      guardId,
      propertyId,
      bookingId,
      actionType: "VEHICLE_CHECK_IN",
      actionDescription: `Vehicle successfully checked into property ${propertyId}`,
      status: "SUCCESS",
      payload: {
        enforcedServerTime: serverTimestamp,
        // Any other non-temporal metadata like scanned license plate could go here
      }
    });

    return { 
      success: true, 
      message: "Vehicle checked in successfully.",
      timestamp: serverTimestamp
    };
  } catch (error: any) {
    // Note: Out-of-shift errors are automatically logged by verifyGuardShift
    if (!error.message?.includes("UNAUTHORIZED")) {
      await logGuardAction({
        guardId,
        propertyId,
        bookingId,
        actionType: "VEHICLE_CHECK_IN",
        actionDescription: `Failed to check in vehicle: ${error.message}`,
        status: "FAILURE",
        payload: { error: error.message }
      });
    }

    return { success: false, message: error.message };
  }
}

interface AuthoritativeBookingData {
  id: string;
  propertyId: string;
  scheduledEndTime: string;
  hourlyRateBDT: number;
}

// Authoritative bookings registry (in production: queried directly from PostgreSQL)
const AUTHORITATIVE_BOOKINGS_ROSTER = new Map<string, AuthoritativeBookingData>([
  ["bk-101", { id: "bk-101", propertyId: "prop-gulshan-1", scheduledEndTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(), hourlyRateBDT: 50 }],
  ["bk-102", { id: "bk-102", propertyId: "prop-gulshan-1", scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), hourlyRateBDT: 60 }],
]);

/**
 * Authoritative Server-Side Overtime Calculation:
 * Compares current UTC server clock against database scheduledEndTime.
 * Enforces fractional hourly block penalty (50% surge on overtime rates).
 */
function calculateAuthoritativeOvertime(
  bookingScheduledEndTimeISO: string,
  serverCurrentTime: Date,
  hourlyRateBDT: number
): { overtimeMinutes: number; overtimeFeeBDT: number; overtimeFeePaisa: number; isOvertime: boolean } {
  const scheduledEnd = new Date(bookingScheduledEndTimeISO);
  const diffMs = serverCurrentTime.getTime() - scheduledEnd.getTime();

  // 10-minute grace period for gate queueing
  const GRACE_PERIOD_MS = 10 * 60 * 1000;

  if (diffMs <= GRACE_PERIOD_MS) {
    return { overtimeMinutes: 0, overtimeFeeBDT: 0, overtimeFeePaisa: 0, isOvertime: false };
  }

  const overtimeMinutes = Math.ceil(diffMs / (1000 * 60));
  // Round up to nearest hour block for overtime penalty
  const overtimeHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const hourlyRatePaisa = Math.round(hourlyRateBDT * 100);

  // Overtime rate: 1.5x regular hourly tariff
  const overtimeFeePaisa = Math.round(overtimeHours * hourlyRatePaisa * 1.5);
  const overtimeFeeBDT = overtimeFeePaisa / 100;

  return {
    overtimeMinutes,
    overtimeFeeBDT,
    overtimeFeePaisa,
    isOvertime: true,
  };
}

/**
 * Processes a vehicle exit (Check-Out).
 * Enforces:
 * 1. Strict shift validation and object ownership
 * 2. Strict server UTC timestamping (preventing device clock tampering)
 * 3. Authoritative server-side overtime fee calculation
 */
export async function processVehicleExit(
  guardId: string,
  propertyId: string,
  bookingId: string
) {
  try {
    // 1. Shift Validator - Strict Boundary & Object Ownership Check
    await verifyGuardShift(guardId, propertyId, bookingId);

    // 2. Enforce Server-Side UTC Clock
    const serverTimestampDate = new Date();
    const serverTimestamp = serverTimestampDate.toISOString();

    // 3. Fetch Authoritative Booking Details from Database
    const booking = AUTHORITATIVE_BOOKINGS_ROSTER.get(bookingId) || {
      id: bookingId,
      propertyId,
      scheduledEndTime: new Date(serverTimestampDate.getTime() - 25 * 60 * 1000).toISOString(),
      hourlyRateBDT: 50,
    };

    // 4. Authoritative Overtime Calculation (Zero-Trust)
    const overtimeResult = calculateAuthoritativeOvertime(
      booking.scheduledEndTime,
      serverTimestampDate,
      booking.hourlyRateBDT
    );

    // 5. Database State Change (Mocked)
    // db.bookings.update({ 
    //   where: { id: bookingId }, 
    //   data: {
    //     status: 'CHECKED_OUT',
    //     checkedOutAt: serverTimestamp,
    //     overtimeFeePaisa: overtimeResult.overtimeFeePaisa,
    //     requiresSettlement: overtimeResult.isOvertime
    //   }
    // })

    // 6. Immutable Physical Footprint Logging
    await logGuardAction({
      guardId,
      propertyId,
      bookingId,
      actionType: "VEHICLE_CHECK_OUT",
      actionDescription: `Vehicle checked out of property ${propertyId}. Overtime assessed: ${overtimeResult.isOvertime ? `${overtimeResult.overtimeMinutes}m (${overtimeResult.overtimeFeeBDT} BDT)` : "None"}`,
      status: "SUCCESS",
      payload: {
        enforcedServerTime: serverTimestamp,
        scheduledEndTime: booking.scheduledEndTime,
        overtimeMinutes: overtimeResult.overtimeMinutes,
        overtimeFeeBDT: overtimeResult.overtimeFeeBDT,
        overtimeFeePaisa: overtimeResult.overtimeFeePaisa,
        requiresSettlement: overtimeResult.isOvertime,
      }
    });

    return { 
      success: true, 
      message: overtimeResult.isOvertime
        ? `Vehicle checked out. Overtime penalty of ${overtimeResult.overtimeFeeBDT} BDT assessed (${overtimeResult.overtimeMinutes} mins).`
        : "Vehicle checked out successfully within scheduled time.",
      timestamp: serverTimestamp,
      overtime: overtimeResult,
    };
  } catch (error: any) {
    if (!error.message?.includes("UNAUTHORIZED")) {
      await logGuardAction({
        guardId,
        propertyId,
        bookingId,
        actionType: "VEHICLE_CHECK_OUT",
        actionDescription: `Failed to check out vehicle: ${error.message}`,
        status: "FAILURE",
        payload: { error: error.message }
      });
    }

    return { success: false, message: error.message };
  }
}
