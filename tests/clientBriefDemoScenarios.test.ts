import assert from "node:assert/strict";
import test from "node:test";
import {
  CLIENT_BRIEF_SERVICE_KEYS,
  CLIENT_BRIEF_TEMPLATES,
  validateClientBriefAnswers,
} from "../shared/client-brief-contract.js";
import {
  buildClientBriefDemoAnswers,
} from "../src/app/clientBrief/demoScenarios.ts";

const placeholderPattern = /réponse fictive|exemple fictif|fictional answer|fictional example|lorem ipsum/i;

test("each Client Brief demo tells a complete, realistic story in both languages", () => {
  for (const serviceKey of CLIENT_BRIEF_SERVICE_KEYS) {
    const template = CLIENT_BRIEF_TEMPLATES[serviceKey];
    for (const locale of ["fr", "en"] as const) {
      const answers = buildClientBriefDemoAnswers(template, locale);
      const validation = validateClientBriefAnswers(template, answers);

      assert.equal(
        validation.valid,
        true,
        `${serviceKey}/${locale} is incomplete: ${Object.keys(validation.errors).join(", ")}`,
      );
      assert.ok(Object.keys(answers).length >= 25, `${serviceKey}/${locale} should feel like a real completed brief`);
      assert.ok(
        Object.values(answers).flat().every((value) => !placeholderPattern.test(String(value))),
        `${serviceKey}/${locale} must not expose generic demo copy`,
      );
    }
  }
});

test("partial Client Brief demos retain realistic answers while leaving work to complete", () => {
  for (const serviceKey of CLIENT_BRIEF_SERVICE_KEYS) {
    const template = CLIENT_BRIEF_TEMPLATES[serviceKey];
    const complete = buildClientBriefDemoAnswers(template, "fr");
    const partial = buildClientBriefDemoAnswers(template, "fr", true);

    assert.ok(Object.keys(partial).length < Object.keys(complete).length, `${serviceKey} partial demo should remove answers`);
    assert.equal(validateClientBriefAnswers(template, partial).valid, false, `${serviceKey} partial demo should remain visibly incomplete`);
    assert.ok(
      Object.values(partial).flat().every((value) => !placeholderPattern.test(String(value))),
      `${serviceKey} partial demo must retain realistic copy`,
    );
  }
});
