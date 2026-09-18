"use server";

import { cookies } from "next/headers";
import { verifyManagerScope, logManagerAction } from "@/lib/security/managerSecurity";

/**
 * Updates a booking on behalf of the owner.
 * RBAC: Requires 'BOOKING_MANAGE' permission and validates that bookingId belongs to propertyId.
 */
export async function managerUpdateBooking(
  managerId: string,
  propertyId: string,
  bookingId: string,
  updates: Record<string, any>
) {
  try {
    // 1. Authenticate Caller
    const cookieStore = await cookies();
    const sessionUser = cookieStore.get("manager_id")?.value || cookieStore.get("connect.sid")?.value;
    if (!sessionUser) {
      throw new Error("UNAUTHORIZED: Active authenticated manager session required.");
    }

    // 2. Strict Scope & Object Ownership Verification (BOLA Prevention)
    await verifyManagerScope(managerId, propertyId, "BOOKING_MANAGE", {
      type: "BOOKING",
      id: bookingId,
    });

    // 3. Perform the Action (Mocked database update)
    // db.bookings.update({ where: { id: bookingId, propertyId }, data: updates })
    
    // 4. Log Success
    await logManagerAction({
      managerId,
      propertyId,
      actionType: "UPDATE_BOOKING",
      actionDescription: `Successfully updated booking ${bookingId} on property ${propertyId}`,
      status: "SUCCESS",
      payload: { bookingId, updates }
    });

    return { success: true, message: "Booking updated successfully." };
  } catch (error: any) {
    // Log Failure if not already logged
    if (!error.message?.includes("UNAUTHORIZED") && !error.message?.includes("BOLA_VIOLATION")) {
      await logManagerAction({
        managerId,
        propertyId,
        actionType: "UPDATE_BOOKING",
        actionDescription: `Failed to update booking ${bookingId}: ${error.message}`,
        status: "FAILURE",
        payload: { bookingId, updates, error: error.message }
      });
    }

    return { success: false, message: error.message };
  }
}

/**
 * Updates a guard's shift.
 * RBAC: Requires 'GUARD_ASSIGN' permission and validates that guardId is assigned to propertyId.
 */
export async function managerUpdateGuardShift(
  managerId: string,
  propertyId: string,
  guardId: string,
  shiftDetails: Record<string, any>
) {
  try {
    // 1. Authenticate Caller
    const cookieStore = await cookies();
    const sessionUser = cookieStore.get("manager_id")?.value || cookieStore.get("connect.sid")?.value;
    if (!sessionUser) {
      throw new Error("UNAUTHORIZED: Active authenticated manager session required.");
    }

    // 2. Strict Scope & Guard Assignment Verification
    await verifyManagerScope(managerId, propertyId, "GUARD_ASSIGN", {
      type: "GUARD",
      id: guardId,
    });

    // 3. Perform the Action (Mocked database update)
    // db.guardShifts.update(...)
    
    // 4. Log Success
    await logManagerAction({
      managerId,
      propertyId,
      actionType: "UPDATE_GUARD_SHIFT",
      actionDescription: `Updated shift for guard ${guardId} on property ${propertyId}`,
      status: "SUCCESS",
      payload: { guardId, shiftDetails }
    });

    return { success: true, message: "Guard shift updated successfully." };
  } catch (error: any) {
    if (!error.message?.includes("UNAUTHORIZED") && !error.message?.includes("BOLA_VIOLATION")) {
      await logManagerAction({
        managerId,
        propertyId,
        actionType: "UPDATE_GUARD_SHIFT",
        actionDescription: `Failed to update shift for guard ${guardId}: ${error.message}`,
        status: "FAILURE",
        payload: { guardId, shiftDetails, error: error.message }
      });
    }

    return { success: false, message: error.message };
  }
}
