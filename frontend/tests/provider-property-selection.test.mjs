import test from "node:test";
import assert from "node:assert/strict";
import {selectWorkingProperty} from "../lib/provider-property-selection.ts";
const pending={id:"pending",name:"Pending building",status:"ACTIVE",verificationStatus:"PENDING"};
const verified={id:"verified",name:"Green View House",status:"ACTIVE",verificationStatus:"VERIFIED"};
test("working property defaults to operational property, never an unknown UUID",()=>{
  assert.equal(selectWorkingProperty([pending,verified],null),verified);
  assert.equal(selectWorkingProperty([pending,verified],"unauthorized-id"),verified);
});
test("explicit permitted property and empty loading states are preserved",()=>{
  assert.equal(selectWorkingProperty([pending,verified],"pending"),pending);
  assert.equal(selectWorkingProperty(undefined,"id"),undefined);
  assert.equal(selectWorkingProperty([],"id"),undefined);
});
