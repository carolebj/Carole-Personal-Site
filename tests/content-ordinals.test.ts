import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("active editorial content has no decorative ordinal renderer or empty number column", () => {
  for (const file of ["components/Navbar", "pages/Services", "pages/ServiceDetail"]) {
    const source = read(`src/app/${file}.tsx`);
    assert.ok(!/padStart|serviceNumbers|menuIndex/.test(source), file);
    assert.ok(!/^\s*0[12]\s*$/m.test(source), file);
    assert.ok(!/grid-cols-\[(?:2\.5|3)rem_1fr\]/.test(source), file);
  }
});

test("public navigation keeps functional semantics and audio state instrumentation", () => {
  const source = read("src/app/components/Navbar.tsx");
  for (const contract of ["data-sound-dropdown", "useDropdownSound", "aria-expanded", "aria-controls", "onMouseEnter", "onMouseLeave", "data-sound=\"primary\""]) {
    assert.ok(source.includes(contract), contract);
  }
});

test("production Services placeholders are not promoted by content cleanup", () => {
  for (const file of ["Services", "ServiceDetail"]) {
    const source = read(`src/app/pages/${file}.tsx`);
    if (source.includes("ServicesUnderConstruction")) {
      assert.equal(source.trim(), 'export { default } from "./ServicesUnderConstruction";');
    }
  }
});
