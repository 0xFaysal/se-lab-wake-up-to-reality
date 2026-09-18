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
    // 1. Shift Validator - Strict Boundary Check
    await verifyGuardShift(guardId, propertyId);

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

/**
 * Processes a vehicle exit (Check-Out).
 * Enforces strict shift validation and server-side timestamping.
 */
export async function processVehicleExit(
  guardId: string,
  propertyId: string,
  bookingId: string,
  // Note: We explicitly DO NOT accept a client-side timestamp parameter
) {
  try {
    // 1. Shift Validator - Strict Boundary Check
    await verifyGuardShift(guardId, propertyId);

    // 2. Enforce Server-Side UTC Clock
    const serverTimestamp = new Date().toISOString();

    // 3. Database State Change (Mocked)
    // db.bookings.update({ 
    //   where: { id: bookingId }, 
    //   data: { status: 'CHECKED_OUT', checkedOutAt: serverTimestamp }
    // })

    // 4. Immutable Physical Footprint Logging
    await logGuardAction({
      guardId,
      propertyId,
      bookingId,
      actionType: "VEHICLE_CHECK_OUT",
      actionDescription: `Vehicle successfully checked out of property ${propertyId}`,
      status: "SUCCESS",
      payload: {
        enforcedServerTime: serverTimestamp
      }
    });

    return { 
      success: true, 
      message: "Vehicle checked out successfully.",
      timestamp: serverTimestamp
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
