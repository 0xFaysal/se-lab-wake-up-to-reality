import React from "react";
import type { Metadata } from "next";
import { OwnerApprovalsClient } from "./owner-approvals-client";

export const metadata: Metadata = {
  title: "Manager Requests & Approvals | Property Owner Portal | ParkEase BD",
  description:
    "Review pending operational changes requested by your managers. Approve or reject property modifications, view audit footprints, and maintain DevSecOps compliance.",
};

export default function OwnerApprovalsPage() {
  return <OwnerApprovalsClient />;
}
