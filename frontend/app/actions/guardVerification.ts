"use server";

import { logGuardAction } from "@/lib/security/guardSecurity";

// ─── In-Memory Mocks for Security Constraints ────────────────────────────────

// Tracks tokens that have already been used to prevent replay attacks
// Key: passToken
const usedTokens = new Set<string>();

// Tracks failed verification attempts to detect potential brute force attacks
// Key: `${guardId}:${propertyId}`
// Value: { count: number, lastAttempt: number }
const failedAttemptsTracker = new Map<string, { count: number, lastAttempt: number }>();

const BRUTE_FORCE_THRESHOLD = 3;
const BRUTE_FORCE_WINDOW_MS = 60 * 1000; // 1 minute window

// ─── Verification Action ─────────────────────────────────────────────────────

/**
 * Hardened Server Action to verify a driver's pass (QR or OTP).
 * Enforces strict anti-replay protection and detects brute-force attempts.
 */
export async function verifyDriverPass(
  guardId: string,
  propertyId: string,
  passToken: string
) {
  const trackerKey = `${guardId}:${propertyId}`;
  
  try {
    // 1. Anti-Replay Check
    if (usedTokens.has(passToken)) {
      throw new Error("REPLAY_ATTEMPT: This pass has already been used for entry.");
    }

    // 2. Cryptographic Validation (Mocked)
    // In production, decode JWT or query DB to verify the token is valid, active, and matches the property
    const isValidPass = passToken.startsWith("valid_"); // Mock condition
    
    if (!isValidPass) {
      throw new Error("INVALID_PASS: The provided pass is invalid or unrecognized.");
    }

    // 3. Mark as Used (Anti-Replay Enforcement)
    usedTokens.add(passToken);

    // 4. Reset Brute Force Tracker on Success
    failedAttemptsTracker.delete(trackerKey);

    // 5. Secure Audit Logging
    await logGuardAction({
      guardId,
      propertyId,
      bookingId: "mock_booking_id", // Extracted from valid pass payload in real app
      actionType: "SUCCESSFUL_VERIFICATION",
      actionDescription: `Driver pass successfully verified for entry.`,
      status: "SUCCESS",
      payload: { passToken }
    });

    return { success: true, message: "Pass verified successfully." };

  } catch (error: any) {
    // Brute Force Tracking Logic
    const now = Date.now();
    const tracker = failedAttemptsTracker.get(trackerKey) || { count: 0, lastAttempt: now };
    
    // Reset tracker if outside the window
    if (now - tracker.lastAttempt > BRUTE_FORCE_WINDOW_MS) {
      tracker.count = 1;
    } else {
      tracker.count += 1;
    }
    tracker.lastAttempt = now;
    failedAttemptsTracker.set(trackerKey, tracker);

    // Log the failed attempt
    await logGuardAction({
      guardId,
      propertyId,
      actionType: "INVALID_PASS_ATTEMPT",
      actionDescription: `Failed pass verification: ${error.message}`,
      status: "FAILURE",
      payload: { passToken, error: error.message, attemptCount: tracker.count }
    });

    // Alert on Brute Force
    if (tracker.count >= BRUTE_FORCE_THRESHOLD) {
      await logGuardAction({
        guardId,
        propertyId,
        actionType: "POTENTIAL_BRUTE_FORCE",
        actionDescription: `Multiple failed pass verifications detected within rapid succession.`,
        status: "FAILURE",
        payload: { attemptCount: tracker.count, windowMs: BRUTE_FORCE_WINDOW_MS }
      });
      
      return { 
        success: false, 
        message: "Too many invalid attempts. For security reasons, please wait before trying again." 
      };
    }

    return { success: false, message: "Invalid pass. Access denied." };
  }
}
