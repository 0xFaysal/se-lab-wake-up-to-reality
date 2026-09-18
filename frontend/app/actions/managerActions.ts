"use server";

import { verifyManagerScope, logManagerAction } from "@/lib/security/managerSecurity";

/**
 * Updates a booking on behalf of the owner.
 * RBAC: Requires 'BOOKING_MANAGE' permission.
 */
export async function managerUpdateBooking(
  managerId: string,
  propertyId: string,
  bookingId: string,
  updates: Record<string, any>
) {
  try {
    // 1. Verify Scope
    await verifyManagerScope(managerId, propertyId, "BOOKING_MANAGE");

    // 2. Perform the Action (Mocked database update)
    // db.bookings.update({ where: { id: bookingId }, data: updates })
    
    // 3. Log Success
    await logManagerAction({
      managerId,
      propertyId,
      actionType: "UPDATE_BOOKING",
      actionDescription: `Updated booking ${bookingId}`,
      status: "SUCCESS",
      payload: { bookingId, updates }
    });

    return { success: true, message: "Booking updated successfully." };
  } catch (error: any) {
    // 4. Log Failure if it wasn't an RBAC failure (RBAC failures are logged in verifyManagerScope)
    if (!error.message?.includes("UNAUTHORIZED")) {
      await logManagerAction({
        managerId,
        propertyId,
        actionType: "UPDATE_BOOKING",
        actionDescription: `Failed to update booking ${bookingId}`,
        status: "FAILURE",
        payload: { bookingId, updates, error: error.message }
      });
    }

    return { success: false, message: error.message };
  }
}

/**
 * Updates a guard's shift.
 * RBAC: Requires 'GUARD_ASSIGN' permission.
 */
export async function managerUpdateGuardShift(
  managerId: string,
  propertyId: string,
  guardId: string,
  shiftDetails: Record<string, any>
) {
  try {
    // 1. Verify Scope
    await verifyManagerScope(managerId, propertyId, "GUARD_ASSIGN");

    // 2. Perform the Action (Mocked database update)
    // db.guardShifts.update(...)
    
    // 3. Log Success
    await logManagerAction({
      managerId,
      propertyId,
      actionType: "UPDATE_GUARD_SHIFT",
      actionDescription: `Updated shift for guard ${guardId}`,
      status: "SUCCESS",
      payload: { guardId, shiftDetails }
    });

    return { success: true, message: "Guard shift updated successfully." };
  } catch (error: any) {
    if (!error.message?.includes("UNAUTHORIZED")) {
      await logManagerAction({
        managerId,
        propertyId,
        actionType: "UPDATE_GUARD_SHIFT",
        actionDescription: `Failed to update shift for guard ${guardId}`,
        status: "FAILURE",
        payload: { guardId, shiftDetails, error: error.message }
      });
    }

    return { success: false, message: error.message };
  }
}
