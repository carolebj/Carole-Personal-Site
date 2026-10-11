import assert from "node:assert/strict";
import test from "node:test";
import { plumCtaClasses } from "../src/app/components/ui/plumCta.ts";

test("plum CTA shares semantic colours without imposing geometry or semantics", () => {
  assert.equal(plumCtaClasses(), "bg-action-accent text-text-on-accent hover:bg-action-accent-hover");
});

test("mobile CTA retains its existing non-hover treatment", () => {
  assert.equal(plumCtaClasses({ hover: false }), "bg-action-accent text-text-on-accent");
});
