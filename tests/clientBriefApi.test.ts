// @ts-nocheck
import assert from "node:assert/strict";
import test from "node:test";
import { renderClientBriefPdf, validateClientBriefPayload } from "../api/client-brief.js";
import { CLIENT_BRIEF_TEMPLATES } from "../shared/client-brief-contract.js";

function completeAnswers(template) {
  return Object.fromEntries(template.sections.flatMap((section) => section.fields).filter((field) => field.required).map((field) => {
    if (field.type === "multi") return [field.key, [field.options[0].value]];
    if (["single", "scale"].includes(field.type)) return [field.key, field.options[0].value];
    return [field.key, field.type === "url" ? "https://example.com" : "Réponse utile et suffisamment précise pour le cadrage."];
  }));
}

test("Client Brief API rejects incomplete documents and accepts separate export/submission actions", () => {
  const template = CLIENT_BRIEF_TEMPLATES["content-creation"];
  const base = { serviceKey: template.serviceKey, locale: "fr", sessionToken: "12345678-1234-1234-1234-123456789abc", name: "Ada", email: "ada@example.com", answers: {}, prefill: {} };
  assert.equal(validateClientBriefPayload({ ...base, action: "request-export" }).error, "incomplete_brief");
  assert.equal(validateClientBriefPayload({ ...base, action: "request-export", answers: completeAnswers(template) }).ok, true);
  assert.equal(validateClientBriefPayload({ ...base, action: "request-export", answers: completeAnswers(template), name: "" }).ok, true);
  assert.equal(validateClientBriefPayload({ ...base, action: "submit", idempotencyKey: "submission-123456789", answers: completeAnswers(template) }).ok, true);
  assert.equal(validateClientBriefPayload({ ...base, action: "submit", idempotencyKey: "submission-123456789", answers: completeAnswers(template), name: "" }).error, "invalid_fields");
  assert.equal(validateClientBriefPayload({ ...base, action: "request-export", answers: completeAnswers(template), email: "not-an-email" }).error, "invalid_email");
  assert.equal(validateClientBriefPayload({ ...base, action: "submit", idempotencyKey: "short", answers: completeAnswers(template) }).error, "invalid_idempotency_key");
  assert.equal(validateClientBriefPayload({ ...base, action: "request-export", answers: { ...completeAnswers(template), rogue: "stored" } }).error, "incomplete_brief");
  assert.equal(validateClientBriefPayload({ ...base, action: "request-export", answers: completeAnswers(template), prefill: { projectName: { source: "answers.fake", confirmed: true, modified: false } } }).error, "invalid_prefill");
});

test("server PDF generation produces a real PDF with service-specific answers", async () => {
  const template = CLIENT_BRIEF_TEMPLATES["audit-advice"];
  const pdf = await renderClientBriefPdf({ template, answers: completeAnswers(template), locale: "fr", reference: "test-reference" });
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 4_000);
});
