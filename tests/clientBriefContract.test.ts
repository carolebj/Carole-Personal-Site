import assert from "node:assert/strict";
import test from "node:test";
import {
  CLIENT_BRIEF_SERVICE_KEYS,
  CLIENT_BRIEF_TEMPLATES,
  buildClientBriefPrefill,
  getClientBriefTemplateBySlug,
  validateClientBriefAnswers,
} from "../shared/client-brief-contract.js";

test("five service-specific Client Briefs expose deep and distinct discovery structures", () => {
  assert.deepEqual([...CLIENT_BRIEF_SERVICE_KEYS].sort(), [
    "audit-advice", "content-creation", "digital-communication", "editorial-strategy", "visual-identity",
  ]);
  const serviceSpecificKeys = [];
  let conditionalFieldCount = 0;
  for (const serviceKey of CLIENT_BRIEF_SERVICE_KEYS) {
    const template = CLIENT_BRIEF_TEMPLATES[serviceKey];
    const fields = template.sections.flatMap((section) => section.fields);
    assert.ok(template.sections.length >= 7, `${serviceKey} should be categorised into at least seven sections`);
    assert.ok(fields.length >= 28, `${serviceKey} should collect a deep project scope`);
    assert.equal(new Set(fields.map((field) => field.key)).size, fields.length, `${serviceKey} field keys must be unique`);
    assert.ok(fields.some((field) => field.type === "scale"), `${serviceKey} should include a contextual scale`);
    assert.ok(fields.every((field) => field.guidance?.fr && field.guidance?.en), `${serviceKey} should guide every question in both languages`);
    assert.ok(fields.some((field) => field.dependsOn), `${serviceKey} should adapt to selected sub-services`);
    conditionalFieldCount += fields.filter((field) => field.dependsOn).length;
    serviceSpecificKeys.push(new Set(fields.filter((field) => !template.sections[0].fields.includes(field)).map((field) => field.key)));
  }
  for (let index = 0; index < serviceSpecificKeys.length; index += 1) {
    for (let other = index + 1; other < serviceSpecificKeys.length; other += 1) {
      const overlap = [...serviceSpecificKeys[index]].filter((key) => serviceSpecificKeys[other].has(key));
      assert.ok(overlap.length < serviceSpecificKeys[index].size / 2, "service discovery must not be a renamed common form");
    }
  }
  assert.ok(conditionalFieldCount >= 12, "the five journeys should branch materially rather than present one long static form");
});

test("French and English service slugs resolve to the same specialised Brief", () => {
  for (const serviceKey of CLIENT_BRIEF_SERVICE_KEYS) {
    const template = CLIENT_BRIEF_TEMPLATES[serviceKey];
    assert.equal(getClientBriefTemplateBySlug(template.slug)?.serviceKey, serviceKey);
    assert.equal(getClientBriefTemplateBySlug(serviceKey)?.serviceKey, serviceKey);
  }
});

test("estimator-prefilled answers retain provenance without a confirmation checkbox", () => {
  const template = CLIENT_BRIEF_TEMPLATES["visual-identity"];
  const prefill = buildClientBriefPrefill(template, {
    profile: { organizationType: "business", projectStage: "launch", marketScope: "local", timeline: "one-two-months" },
    serviceAnswers: { "identity.projectType": "complete-identity", "identity.namingState": "validated" },
  });
  assert.equal(prefill.answers.projectType, "complete-identity");
  assert.equal(prefill.answers.namingState, "validated");
  assert.deepEqual(prefill.provenance.projectType, { source: "answers.identity.projectType", confirmed: true, modified: false });
  assert.equal(validateClientBriefAnswers(template, prefill.answers).valid, false);
});

test("prefill rejects incompatible estimator codes instead of hiding or exporting them", () => {
  const template = CLIENT_BRIEF_TEMPLATES["visual-identity"];
  const prefill = buildClientBriefPrefill(template, {
    profile: { organizationType: "business" },
    serviceAnswers: {
      "identity.projectType": "bad-code",
      "identity.namingState": "naming-help",
      "identity.brandCount": 3,
    },
  });
  assert.equal(prefill.answers.organizationType, "business");
  assert.equal(prefill.answers.namingState, "naming-help");
  assert.equal(prefill.answers.projectType, undefined);
  assert.equal(prefill.answers.brandArchitecture, undefined);
  assert.equal(prefill.provenance.projectType, undefined);
  assert.equal(validateClientBriefAnswers(template, { projectType: "bad-code" }).errors.projectType, "invalid_value");
  assert.equal(validateClientBriefAnswers(template, { brandArchitectureMode: "multiple", brandArchitecture: 3 }).errors.brandArchitecture, "invalid_value");
});

test("validation rejects whitespace-only answers, rogue keys and invalid option values", () => {
  const template = CLIENT_BRIEF_TEMPLATES["editorial-strategy"];
  assert.equal(validateClientBriefAnswers(template, { projectName: "   " }).errors.projectName, "invalid_value");
  assert.equal(validateClientBriefAnswers(template, { rogue: "personal data" }).errors["_unknown:rogue"], "unknown_field");
  assert.equal(validateClientBriefAnswers(template, { currentState: "invented" }).errors.currentState, "invalid_value");
});

test("the visual identity brief offers nine illustrated logo families and limits the choice to two", () => {
  const template = CLIENT_BRIEF_TEMPLATES["visual-identity"];
  const logoStyles = template.sections.flatMap((section) => section.fields).find((field) => field.key === "logoStyles");
  assert.ok(logoStyles);
  assert.equal(logoStyles.maxSelections, 2);
  assert.equal(logoStyles.options.filter((option) => option.value !== "open").length, 9);
  assert.deepEqual(logoStyles.options.map((option) => option.value), [
    "wordmark",
    "pictorial",
    "abstract",
    "lettermark",
    "letterform",
    "monogram",
    "mascot",
    "combination",
    "emblem",
    "open",
  ]);
  assert.equal(validateClientBriefAnswers(template, { logoStyles: ["wordmark", "emblem"] }).errors.logoStyles, undefined);
  assert.equal(validateClientBriefAnswers(template, { logoStyles: ["wordmark", "emblem", "mascot"] }).errors.logoStyles, "invalid_value");
});
