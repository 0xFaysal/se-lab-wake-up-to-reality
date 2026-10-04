import { apiClient } from "./api-client";
export type SessionKind =
  | "RESERVATION"
  | "PRESENT"
  | "GRACE"
  | "OVERTIME"
  | "CHECKOUT_REQUESTED"
  | "HOLD"
  | "BLOCKED";
export interface SessionSegment {
  id: string;
  startAt: string;
  endAt: string;
  kind: SessionKind;
  label: string;
  bookingId?: string;
  bookingCode?: string;
  driverName?: string;
  plate?: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  graceEndAt?: string;
  entryGraceStartsAt?: string;
  overtimePolicyVersion?: number;
  awaitingCheckout?: boolean;
}
export interface SessionAvailability {
  startAt: string;
  endAt: string;
  availableCapacity: number;
  occupiedCapacity: number;
  label: "Scheduled availability" | "Occupied" | "Closed" | "Blocked";
}
export interface SessionRow {
  id: string;
  resourceId: string;
  resourceName: string;
  unitName: string;
  resourceType: "FIXED_SPACE" | "SHARED_POOL";
  capacity: number;
  status: string;
  segments: SessionSegment[];
  availability: SessionAvailability[];
}
export interface SessionTimeline {
  propertyId: string;
  propertyName: string;
  date: string;
  timezone: "Asia/Dhaka";
  serverNow: string;
  dayStart: string;
  dayEnd: string;
  rows: SessionRow[];
}
export const sessionTimelineApi = {
  get: (propertyId: string, date: string, signal?: AbortSignal) =>
    apiClient.get<SessionTimeline>(
      `/provider/session-timeline?${new URLSearchParams({ propertyId, date })}`,
      { signal },
    ),
};
