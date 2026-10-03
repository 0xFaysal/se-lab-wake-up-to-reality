import type { PropertyDetailDto, PropertyInput, PropertyUpdateInput } from "./api/api-types";

const fields = ["name", "publicArea", "approximateAddress", "exactAddress", "latitude", "longitude", "entranceLatitude", "entranceLongitude", "accessInstructions", "visitorIdentificationRequired", "vehicleHeightLimitCm", "entryCutoffLocalTime", "generalParkingRules", "commonSafetyRules", "isSharedBuilding"] as const;

export function propertyEditValues(property: PropertyDetailDto): PropertyInput {
  return Object.fromEntries(fields.map((key) => [key, property[key] ?? undefined])) as unknown as PropertyInput;
}

export function buildPropertyUpdate(original: PropertyDetailDto, draft: PropertyInput): PropertyUpdateInput {
  const patch: Record<string, unknown> = { version: original.version };
  for (const key of fields) {
    const raw = draft[key];
    const value = typeof raw === "string" ? raw.trim() || null : raw ?? null;
    if (value !== (original[key] ?? null)) patch[key] = value;
  }
  return patch as PropertyUpdateInput;
}
