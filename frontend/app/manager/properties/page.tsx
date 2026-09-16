import React from "react";
import type { Metadata } from "next";
import { ManagerPropertiesClient } from "./manager-properties-client";

export const metadata: Metadata = {
  title: "Assigned Listings | Manager Portal | ParkEase BD",
  description:
    "View and manage parking property listings assigned to your operational scope. Critical modifications require Owner approval.",
};

export default function ManagerPropertiesPage() {
  return <ManagerPropertiesClient />;
}
