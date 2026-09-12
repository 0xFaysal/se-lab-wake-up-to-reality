export type UserRole = "DRIVER" | "PROVIDER" | "PARKING_OWNER" | "MANAGER" | "GUARD" | "ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "BLOCKED";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  mustChangePassword: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: UserRole[];
}

export interface ApiMeta { requestId: string; timestamp: string }
export interface ApiSuccess<T> { success: true; data: T; meta: ApiMeta }

export type VehicleType = "MOTORCYCLE" | "SEDAN" | "SUV" | "MICROBUS";
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface VehicleDto {
  id: string;
  vehicleType: VehicleType;
  registrationNumber: string;
  brand: string;
  model: string;
  color: string;
  heightCm: number | null;
  widthCm: number | null;
  lengthCm: number | null;
  verificationStatus: VerificationStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInput {
  vehicleType: VehicleType;
  registrationNumber: string;
  brand: string;
  model: string;
  color: string;
  heightCm?: number;
  widthCm?: number;
  lengthCm?: number;
  isDefault?: boolean;
}

export type PropertyStatus = "ACTIVE" | "TEMPORARILY_CLOSED" | "INACTIVE";
export interface PropertySummaryDto {
  id: string;
  name: string;
  publicArea: string;
  approximateAddress: string;
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  status: PropertyStatus;
  rejectionReason: string | null;
  version: number;
  governanceMode: string | null;
  canonicalPropertyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyDetailDto extends PropertySummaryDto {
  exactAddress: string;
  entranceLatitude: number | null;
  entranceLongitude: number | null;
  accessInstructions: string | null;
  visitorIdentificationRequired: boolean;
  vehicleHeightLimitCm: number | null;
  entryCutoffLocalTime: string | null;
  generalParkingRules: string | null;
  commonSafetyRules: string | null;
  temporaryClosureReason: string | null;
  temporaryClosedAt: string | null;
  temporaryClosedUntil: string | null;
  verifiedAt: string | null;
}

export interface PropertyInput {
  name: string;
  publicArea: string;
  approximateAddress: string;
  exactAddress: string;
  latitude: number;
  longitude: number;
  entranceLatitude?: number;
  entranceLongitude?: number;
  accessInstructions?: string;
  visitorIdentificationRequired?: boolean;
  vehicleHeightLimitCm?: number;
  entryCutoffLocalTime?: string;
  generalParkingRules?: string;
  commonSafetyRules?: string;
}

export interface PropertyImageDto {
  id: string;
  url: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sortOrder: number;
  isCover: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GuardAssignmentStatus = "PENDING_ACCEPTANCE" | "ACTIVE" | "SUSPENDED" | "ENDED" | "CANCELLED";
export interface GuardAssignmentDto {
  id: string;
  status: GuardAssignmentStatus;
  property: { id: string; name: string; publicArea?: string };
  guard?: { id: string; fullName: string; emailMasked?: string; phoneMasked?: string };
  provider?: { id: string; fullName: string };
  shiftStart: string | null;
  shiftEnd: string | null;
  assignedAt: string;
  endedAt: string | null;
}

export interface PropertyGuardMembershipDto {
  id: string;
  status: "PENDING_ACCEPTANCE" | "ACTIVE" | "ENDED" | "CANCELLED";
  property: { id: string; name: string; publicArea: string };
  guard?: { id: string; fullName: string; emailMasked?: string; phoneMasked?: string };
  invitedAt: string;
  joinedAt: string | null;
  endedAt: string | null;
}

export interface SessionDto {
  id: string;
  userAgent: string;
  rememberDevice: boolean;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export interface AdminPropertySummaryDto {
  id: string;
  name: string;
  publicArea: string;
  approximateAddress: string;
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  status: PropertyStatus;
  rejectionReason: string | null;
  imageCount: number;
  creator: { id: string; fullName: string; email: string };
  owner: { id: string; fullName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdminPropertyDetailDto {
  id: string;
  name: string;
  description: string | null;
  publicArea: string;
  approximateAddress: string;
  exactAddress: string;
  latitude: number;
  longitude: number;
  entranceLatitude: number | null;
  entranceLongitude: number | null;
  accessInstructions: string | null;
  verificationStatus: VerificationStatus;
  status: PropertyStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  reviewedBy: { id: string; fullName: string } | null;
  creator: { id: string; fullName: string; email: string; phone: string; status: UserStatus; emailVerified: boolean; phoneVerified: boolean };
  providers: Array<{ id: string; status: string; verificationStatus: VerificationStatus; rejectionReason: string | null; joinedAt: string; verifiedAt: string | null; provider: { id: string; fullName: string; email: string; phone: string; status: UserStatus; emailVerified: boolean; phoneVerified: boolean } }>;
  images: PropertyImageDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationDto { page: number; limit: number; total: number; totalPages: number }
