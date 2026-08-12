import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasPropertyImageCapacity,
  isCompletePropertyImageOrder,
  resolveCoverImageId,
} from "../../../src/modules/property-images/property-image.policy.js";

describe("Property image policy", () => {
  it("enforces a maximum of 10 images without partial capacity", () => {
    assert.equal(hasPropertyImageCapacity(8, 2), true);
    assert.equal(hasPropertyImageCapacity(8, 3), false);
    assert.equal(hasPropertyImageCapacity(0, 0), false);
  });

  it("accepts only an exact, duplicate-free image order", () => {
    assert.equal(
      isCompletePropertyImageOrder(["a", "b", "c"], ["c", "a", "b"]),
      true,
    );
    assert.equal(
      isCompletePropertyImageOrder(["a", "b", "c"], ["a", "b"]),
      false,
    );
    assert.equal(isCompletePropertyImageOrder(["a", "b"], ["a", "a"]), false);
  });

  it("uses the requested cover, preserves the current cover, or promotes first", () => {
    assert.equal(resolveCoverImageId(["a", "b"], "b", "a"), "b");
    assert.equal(resolveCoverImageId(["a", "b"], undefined, "b"), "b");
    assert.equal(resolveCoverImageId(["a", "b"], undefined, undefined), "a");
    assert.equal(resolveCoverImageId([], undefined, undefined), undefined);
  });
});
