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

export function propertyUpdateErrors(patch: PropertyUpdateInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const textRules = {
    name: ["Property name", 3, 120], publicArea: ["Public area", 2, 120],
    approximateAddress: ["Approximate address", 5, 255], exactAddress: ["Exact private address", 5, 500],
    accessInstructions: ["Access instructions", 1, 1000], generalParkingRules: ["Parking rules", 1, 2000],
    commonSafetyRules: ["Safety rules", 1, 2000],
  } as const;
  for (const [field, [label, minimum, maximum]] of Object.entries(textRules)) {
    if (!(field in patch)) continue;
    const value = patch[field as keyof PropertyUpdateInput];
    if (value === null && !["name", "publicArea", "approximateAddress", "exactAddress"].includes(field)) continue;
    if (typeof value !== "string" || value.trim().length < minimum || value.trim().length > maximum) {
      errors[field] = `${label} must contain ${minimum}-${maximum} characters.`;
    } else if ((["accessInstructions", "generalParkingRules", "commonSafetyRules"].includes(field)
      ? /[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/
      : /[\x00-\x1F\x7F]/).test(value)) {
      errors[field] = `${label} contains unsupported control characters.`;
    }
  }
  const height = patch.vehicleHeightLimitCm;
  if (height != null && (!Number.isInteger(height) || height < 1 || height > 1000)) {
    errors.vehicleHeightLimitCm = "Vehicle height limit must be a whole number between 1 and 1000 cm (up to 10 metres).";
  }
  if (patch.entryCutoffLocalTime != null && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(patch.entryCutoffLocalTime)) {
    errors.entryCutoffLocalTime = "Choose an entry cutoff in HH:mm format.";
  }
  return errors;
}
