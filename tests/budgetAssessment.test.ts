import assert from "node:assert/strict";
import test from "node:test";
import { assessBudgetFit } from "../src/app/estimator/budgetAssessment.ts";

test("budget fit reports compatibility without changing the independent estimate", () => {
  const estimate = { lower: 300_000, upper: 650_000 };
  assert.equal(assessBudgetFit(estimate, "500k-1m").status, "partial");
  assert.equal(assessBudgetFit(estimate, "1m-3m").status, "compatible");
  assert.equal(assessBudgetFit(estimate, "under-250k").status, "insufficient");
  assert.equal(assessBudgetFit(estimate, "unknown").status, "not-provided");
  assert.deepEqual(estimate, { lower: 300_000, upper: 650_000 });
});
