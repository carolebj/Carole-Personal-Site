import assert from "node:assert/strict";
import test from "node:test";
import { getContactFieldError } from "../src/app/components/contactFormUtils.ts";

function mockInput(
  name: string,
  validity: Partial<ValidityState> & { valid: boolean },
  type = "text",
) {
  return {
    name,
    type,
    validity: {
      valueMissing: false,
      typeMismatch: false,
      badInput: false,
      ...validity,
      valid: validity.valid,
    },
  } as HTMLInputElement;
}

const translate = (key: string) => key;

test("getContactFieldError maps required fields to i18n keys", () => {
  assert.equal(
    getContactFieldError(mockInput("name", { valid: false, valueMissing: true }), translate),
    "contactSection.errors.nameRequired",
  );
  assert.equal(
    getContactFieldError(mockInput("email", { valid: false, valueMissing: true }, "email"), translate),
    "contactSection.errors.emailRequired",
  );
  assert.equal(
    getContactFieldError(mockInput("message", { valid: false, valueMissing: true }), translate),
    "contactSection.errors.messageRequired",
  );
});

test("getContactFieldError maps invalid email to i18n key", () => {
  assert.equal(
    getContactFieldError(
      mockInput("email", { valid: false, typeMismatch: true }, "email"),
      translate,
    ),
    "contactSection.errors.emailInvalid",
  );
});
