"use server";

import { logManagerAction } from "@/lib/security/managerSecurity";

export type HighRiskActionType = "CREATE_PARKING_RESOURCE" | "MODIFY_ASSET_PRICING" | "OVERRIDE_CAPACITY";

export interface ApprovalRequestPayload {
  actionType: HighRiskActionType;
  proposedChanges: Record<string, any>;
  reason?: string;
}

/**
 * Intercepts high-risk manager actions that exceed immediate scope 
 * or require explicit Owner consent. Routes the proposed changes 
 * to a Pending_Approvals queue rather than mutating live data.
 */
export async function submitForOwnerApproval(
  managerId: string,
  propertyId: string,
  requestPayload: ApprovalRequestPayload
) {
  try {
    // 1. Intercept & Queue (Mocked insert into Action_Requests table)
    const actionRequestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // db.actionRequests.create({
    //   data: {
    //     id: actionRequestId,
    //     managerId,
    //     propertyId,
    //     actionType: requestPayload.actionType,
    //     payload: requestPayload.proposedChanges,
    //     status: "PENDING_APPROVAL"
    //   }
    // })

    // 2. Dual-Footprint Security Audit
    await logManagerAction({
      managerId,
      propertyId,
      actionType: "REQUEST_SUBMITTED_TO_OWNER",
      actionDescription: `Submitted approval request for ${requestPayload.actionType}`,
      status: "SUCCESS",
      payload: {
        actionRequestId,
        ...requestPayload
      }
    });

    return { 
      success: true, 
      message: "Action intercepted and queued for Owner approval.",
      actionRequestId 
    };
  } catch (error: any) {
    await logManagerAction({
      managerId,
      propertyId,
      actionType: "REQUEST_SUBMITTED_TO_OWNER",
      actionDescription: `Failed to submit approval request for ${requestPayload.actionType}`,
      status: "FAILURE",
      payload: {
        ...requestPayload,
        error: error.message
      }
    });

    return { success: false, message: "Failed to queue approval request." };
  }
}
