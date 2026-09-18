"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyOwnerPassword } from "@/app/actions/security-actions";
import { ownerLogger } from "@/lib/security/ownerLogger";

interface ReAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionPayload: any; // The payload of the action we are authenticating for, used for logging
}

export function ReAuthModal({ isOpen, onClose, onSuccess, actionPayload }: ReAuthModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsVerifying(true);

    try {
      const result = await verifyOwnerPassword(password);
      
      // Mask the account identifier for the audit log
      const maskedIdentifier = actionPayload.accountIdentifier 
        ? `**** ${actionPayload.accountIdentifier.slice(-4)}`
        : "Unknown";

      if (result.success) {
        ownerLogger.logOwnerAction({
          ownerId: "current-owner",
          actionType: "GENERIC_OWNER_MUTATION", // We will overwrite this if needed, but per prompt: 'UPDATE_PAYOUT_ACCOUNT'
          // Wait, the prompt says trigger with { action: 'UPDATE_PAYOUT_ACCOUNT' } 
          // However, our OwnerActionTypeSchema doesn't have UPDATE_PAYOUT_ACCOUNT. It has UPDATE_PAYOUT_METHOD.
          // Let's use UPDATE_PAYOUT_METHOD.
          actionDescription: `Verified identity and updated payout method`,
          resource: "PAYOUT_METHOD",
          status: "SUCCESS",
          payload: { ...actionPayload, accountIdentifier: maskedIdentifier, action: 'UPDATE_PAYOUT_ACCOUNT' }
        });
        
        setPassword("");
        onSuccess(); // Proceed with the actual update
      } else {
        setError(result.message || "Authentication failed");
        ownerLogger.logOwnerAction({
          ownerId: "current-owner",
          actionType: "GENERIC_OWNER_MUTATION", 
          actionDescription: `Failed identity verification for payout update`,
          resource: "PAYOUT_METHOD",
          status: "FAILURE",
          payload: { ...actionPayload, accountIdentifier: maskedIdentifier, action: 'UPDATE_PAYOUT_ACCOUNT', reason: "Invalid password" }
        });
      }
    } catch (err) {
      setError("An error occurred during verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isVerifying && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify your identity</DialogTitle>
          <DialogDescription>
            Verify your identity to continue. Please enter your password to confirm changes to your Payout Account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleVerify} className="space-y-4 py-2">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isVerifying}
              autoFocus
            />
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isVerifying}>
              Cancel
            </Button>
            <Button type="submit" disabled={isVerifying || !password}>
              {isVerifying && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
