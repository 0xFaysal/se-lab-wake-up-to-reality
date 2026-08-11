import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatValidationErrors } from "../../../src/common/middleware/validate.js";
import { createPropertySchema } from "../../../src/modules/properties/property.schema.js";

describe("validation error formatting", () => {
  it("identifies the exact nested request field that failed", () => {
    const result = createPropertySchema.safeParse({
      body: {
        name: "Valid Parking",
        publicArea: "Dhaka",
        approximateAddress: "Near",
        exactAddress: "Road 12, Dhaka",
        latitude: 23.8103,
        longitude: 90.4125,
      },
    });

    assert.equal(result.success, false);
    if (result.success) return;

    assert.deepEqual(formatValidationErrors(result.error), {
      "body.approximateAddress": [
        "Approximate address must contain at least 5 characters",
      ],
    });
  });
});
