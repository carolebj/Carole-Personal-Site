import assert from "node:assert/strict";
import test from "node:test";
import {
  estimatorServiceIds,
  getManualReviewFlags,
  getSerializableQuestionnaireContract,
  getServiceProgress,
  getVisibleQuestions,
  isQuestionAnswered,
  pruneHiddenServiceAnswers,
  serviceQuestionnaires,
  type QuestionnaireAnswers,
} from "../src/app/estimator/serviceQuestionnaires.ts";
import {
  DEFAULT_ESTIMATOR_DRAFT,
  getMaximumAccessibleEstimatorStep,
  isEstimatorStepComplete,
  isSharedProfileComplete,
  migrateLegacyEstimatorDraft,
  normalizeEstimatorDraft,
} from "../src/app/estimator/draft.ts";

test("every estimator service has a structured questionnaire with unique semantic keys", () => {
  assert.equal(estimatorServiceIds.length, 5);

  const questions = estimatorServiceIds.flatMap((serviceId) => serviceQuestionnaires[serviceId].questions);
  assert.equal(questions.length, 40);
  assert.equal(new Set(questions.map((question) => question.key)).size, questions.length);

  for (const serviceId of estimatorServiceIds) {
    const questionnaire = serviceQuestionnaires[serviceId];
    assert.ok(questionnaire.questions.length > 0);
    assert.ok(questionnaire.questions.every((question) => question.briefMapping.brief === serviceId));
    assert.ok(getVisibleQuestions(serviceId, {}).every((question) => question.helper?.fr.trim() && question.helper.en.trim()));
  }
});

test("a stored multi-service draft returns to service selection instead of choosing arbitrarily", () => {
  const normalized = normalizeEstimatorDraft({
    ...DEFAULT_ESTIMATOR_DRAFT,
    version: 2,
    step: 5,
    furthestStep: 5,
    orientation: "known-services",
    serviceIds: ["editorial-strategy", "content-creation"],
  });
  assert.ok(normalized);
  assert.deepEqual(normalized.serviceIds, []);
  assert.equal(normalized.step, 2);
  assert.equal(normalized.furthestStep, 2);
});

test("dependencies and manual-review values reference declared questions and options", () => {
  for (const serviceId of estimatorServiceIds) {
    const questions = serviceQuestionnaires[serviceId].questions;
    const questionByKey = new Map(questions.map((question) => [question.key, question]));

    for (const question of questions) {
      if (question.dependsOn) {
        const sourceQuestion = questionByKey.get(question.dependsOn.questionKey);
        assert.ok(sourceQuestion, `${question.key} depends on a missing question`);
      }

      if (question.options) {
        const optionValues = question.options.map((entry) => entry.value);
        assert.equal(new Set(optionValues).size, optionValues.length, `${question.key} has duplicate option values`);
        for (const manualValue of question.manualReviewOptions ?? []) {
          assert.ok(optionValues.includes(manualValue), `${question.key} has an unknown manual-review value`);
        }
      }
    }
  }
});

test("the serializable runtime contract stays aligned with the questionnaire source", () => {
  const contract = getSerializableQuestionnaireContract();
  assert.deepEqual(Object.keys(contract).sort(), [...estimatorServiceIds].sort());

  for (const serviceId of estimatorServiceIds) {
    const sourceQuestions = serviceQuestionnaires[serviceId].questions;
    const contractQuestions = contract[serviceId].questions;
    assert.equal(contractQuestions.length, sourceQuestions.length);
    assert.deepEqual(contractQuestions.map((question) => question.key), sourceQuestions.map((question) => question.key));

    sourceQuestions.forEach((source, index) => {
      const serialized = contractQuestions[index];
      assert.equal(serialized.type, source.type);
      assert.equal(serialized.requiredForEstimate, source.requiredForEstimate);
      assert.equal(serialized.purpose, source.purpose ?? "pricing-and-prefill");
      assert.deepEqual(serialized.pricingDimensions, source.pricingDimension);
      assert.deepEqual(serialized.dependsOn, source.dependsOn);
      assert.deepEqual(serialized.optionValues, source.options?.map((option) => option.value) ?? []);
      assert.deepEqual(serialized.manualReviewOptions, source.manualReviewOptions ?? []);
      assert.deepEqual(serialized.calculationExclusionOptions, source.calculationExclusionOptions ?? []);
      assert.doesNotThrow(() => JSON.stringify(serialized));
    });
  }
});

test("pricing questions and brief-only prefill fields remain structurally distinct", () => {
  const contract = getSerializableQuestionnaireContract();
  const questions = estimatorServiceIds.flatMap((serviceId) => contract[serviceId].questions);

  assert.ok(questions.every((question) => question.purpose === "pricing-and-prefill"));
  assert.ok(questions.every((question) => question.pricingDimensions.length > 0));
  for (const question of questions.filter((entry) => entry.purpose === "brief-prefill-only")) {
    assert.equal(question.requiredForEstimate, false);
    assert.deepEqual(question.pricingDimensions, []);
    assert.deepEqual(question.manualReviewOptions, []);
  }
});

test("conditional questions stay out of unrelated branches while manual-review flags remain deterministic", () => {
  const emptyAnswers: QuestionnaireAnswers = {};
  const initialQuestions = getVisibleQuestions("digital-communication", emptyAnswers);
  assert.equal(initialQuestions.some((question) => question.key === "communication.durationMonths"), false);

  const answers: QuestionnaireAnswers = {
    "communication.engagementType": "ongoing",
  };
  const visibleQuestions = getVisibleQuestions("digital-communication", answers);
  assert.equal(visibleQuestions.some((question) => question.key === "communication.durationMonths"), true);

  const progress = getServiceProgress("digital-communication", answers);
  assert.equal(progress.total, initialQuestions.filter((question) => question.requiredForEstimate).length + 1);
  assert.equal(progress.remaining, progress.total - progress.completed);

  assert.deepEqual(getManualReviewFlags(["editorial-strategy"], {
    "editorial.currentState": "multiple-to-merge",
  }), [
    {
      serviceId: "editorial-strategy",
      questionKey: "editorial.currentState",
      selectedOptions: ["multiple-to-merge"],
    },
  ]);
});

test("volume questions use understandable weighted bands instead of exact numbers", () => {
  const question = serviceQuestionnaires["editorial-strategy"].questions.find(
    (entry) => entry.key === "editorial.brandCount",
  );
  assert.ok(question);
  assert.equal(question.type, "choice");
  assert.deepEqual(question.options?.map((entry) => entry.value), ["one", "two-three", "four-plus", "unknown"]);
  assert.equal(isQuestionAnswered(question, "two-three"), true);
  assert.equal(isQuestionAnswered(question, 2), false);

  const invalidProgress = getServiceProgress("editorial-strategy", { "editorial.brandCount": 2 });
  const validProgress = getServiceProgress("editorial-strategy", { "editorial.brandCount": "two-three" });
  assert.equal(validProgress.completed, invalidProgress.completed + 1);

  const serialized = getSerializableQuestionnaireContract()["editorial-strategy"].questions.find(
    (entry) => entry.key === "editorial.brandCount",
  );
  assert.equal(serialized?.type, "choice");
  assert.deepEqual(serialized?.optionValues, ["one", "two-three", "four-plus", "unknown"]);
});

test("changing a dependency purges answers that become hidden", () => {
  const visible = pruneHiddenServiceAnswers(["digital-communication"], {
    "communication.engagementType": "ongoing",
    "communication.durationMonths": "three",
  });
  assert.equal(visible["communication.durationMonths"], "three");

  const hidden = pruneHiddenServiceAnswers(["digital-communication"], {
    ...visible,
    "communication.engagementType": "campaign",
  });
  assert.equal(hidden["communication.durationMonths"], undefined);
});

test("versioned estimator drafts migrate without inventing semantic profile answers", () => {
  const migrated = migrateLegacyEstimatorDraft({
    version: 1,
    step: 5,
    furthestStep: 5,
    currency: "EUR",
    serviceIds: ["visual-identity", "unknown-service"],
    answers: { orientation: "known-services", step2: "Préparer un lancement" },
    channelScope: "four-plus",
    duration: "twelve",
  });

  assert.ok(migrated);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.currency, "EUR");
  assert.deepEqual(migrated.serviceIds, ["visual-identity"]);
  assert.equal(migrated.step, 3);
  assert.deepEqual(migrated.profile, {});
  assert.deepEqual(migrated.serviceAnswers, {});
});

test("legacy migration cannot skip an invalid orientation or guided priority", () => {
  const invalidOrientation = migrateLegacyEstimatorDraft({
    version: 1,
    serviceIds: ["visual-identity"],
    answers: { orientation: "removed-orientation" },
  });
  const missingGuidedPriority = migrateLegacyEstimatorDraft({
    version: 1,
    serviceIds: ["visual-identity"],
    answers: { orientation: "guided", step2: "removed-priority" },
  });

  assert.ok(invalidOrientation);
  assert.ok(missingGuidedPriority);
  assert.equal(invalidOrientation.step, 1);
  assert.equal(missingGuidedPriority.step, 2);
});

test("macro-step access requires the shared profile then all visible service questions", () => {
  const draft = {
    ...DEFAULT_ESTIMATOR_DRAFT,
    orientation: "known-services",
    serviceIds: ["editorial-strategy"] as const,
    profile: {
      organizationType: "business",
      organizationScale: "startup-small",
      clientLocation: "benin",
      projectStage: "active",
      marketScope: "national",
      languageScope: "one",
      timeline: "flexible",
      validationProcess: "one",
    },
  };

  assert.equal(isEstimatorStepComplete(draft, 3), true);
  assert.equal(isEstimatorStepComplete(draft, 4), false);
  assert.equal(getMaximumAccessibleEstimatorStep(draft), 4);
});

test("shared profile completion follows the current pricing contract", () => {
  assert.equal(isSharedProfileComplete({
    organizationScale: "startup-small",
    clientLocation: "benin",
    projectStage: "active",
    marketScope: "national",
    languageScope: "one",
    timeline: "flexible",
    validationProcess: "one",
  }), true);
  assert.equal(isSharedProfileComplete({
    organizationScale: "startup-small",
    clientLocation: "benin",
    marketScope: "national",
    languageScope: "one",
    timeline: "flexible",
    validationProcess: "one",
  }), false);
});

test("guided orientation requires the complete three-signal diagnosis", () => {
  const guidedDraft = {
    ...DEFAULT_ESTIMATOR_DRAFT,
    orientation: "guided",
    serviceIds: ["editorial-strategy"] as const,
  };

  assert.equal(isEstimatorStepComplete(guidedDraft, 2), false);
  assert.equal(
    isEstimatorStepComplete({ ...guidedDraft, priority: "clarify-message", guidanceChallenge: "direction", guidanceStartingPoint: "starting" }, 2),
    true,
  );
});

test("normalization rejects invalid versions and clamps unvisited future steps", () => {
  assert.equal(normalizeEstimatorDraft({ version: 3, step: 1 }), null);

  const normalized = normalizeEstimatorDraft({
    version: 2,
    step: 6,
    furthestStep: 6,
    currency: "USD",
    orientation: "known-services",
    serviceIds: ["content-creation"],
    profile: {},
    serviceAnswers: { "content.formats": ["photo"] },
  });

  assert.ok(normalized);
  assert.equal(normalized.step, 3);
  assert.equal(normalized.furthestStep, 3);
});

test("draft normalization removes obsolete services, profile values and question keys", () => {
  const normalized = normalizeEstimatorDraft({
    version: 2,
    step: 6,
    furthestStep: 6,
    currency: "EUR",
    orientation: "known-services",
    priority: "obsolete-priority",
    serviceIds: ["editorial-strategy", "editorial-strategy", "removed-service"],
    activeServiceId: "removed-service",
    profile: {
      organizationType: "business",
      projectStage: "invented-stage",
      marketScope: "national",
      languageScope: "one",
      timeline: "flexible",
      validationProcess: "one",
      removedField: "must-not-survive",
    },
    serviceAnswers: {
      "editorial.currentState": "informal",
      "content.formats": ["photo"],
      "removed.question": "old-value",
    },
  });

  assert.ok(normalized);
  assert.deepEqual(normalized.serviceIds, ["editorial-strategy"]);
  assert.equal(normalized.activeServiceId, "editorial-strategy");
  assert.equal(normalized.priority, undefined);
  assert.deepEqual(normalized.profile, {
    organizationType: "business",
    marketScope: "national",
    languageScope: "one",
    timeline: "flexible",
    validationProcess: "one",
  });
  assert.deepEqual(normalized.serviceAnswers, { "editorial.currentState": "informal" });
  assert.equal(normalized.step, 3);
  assert.equal(normalized.furthestStep, 3);
});

test("draft normalization enforces answer types, options, number bounds and steps", () => {
  const normalized = normalizeEstimatorDraft({
    version: 2,
    step: 4,
    furthestStep: 4,
    currency: "XOF",
    orientation: "known-services",
    serviceIds: ["editorial-strategy"],
    profile: {},
    serviceAnswers: {
      "editorial.currentState": ["informal"],
      "editorial.channels": ["linkedin", "removed-channel", "linkedin", 42],
      "editorial.discoveryMethod": ["documents"],
      "editorial.deliverables": ["editorial-charter", "removed-result", "editorial-charter", 42],
      "editorial.brandCount": "two-three",
      "editorial.audienceCount": -1,
      "editorial.existingCorpusSize": 1.5,
      "editorial.interviewCount": 1_000_001,
      "editorial.benchmarkScope": "removed-option",
    },
  });

  assert.ok(normalized);
  assert.deepEqual(normalized.serviceAnswers, {
    "editorial.channels": ["linkedin"],
    "editorial.deliverables": ["editorial-charter"],
    "editorial.brandCount": "two-three",
    "editorial.discoveryMethod": ["documents"],
  });
});

test("draft normalization drops answers hidden by the current dependency branch", () => {
  const hidden = normalizeEstimatorDraft({
    version: 2,
    step: 4,
    serviceIds: ["digital-communication"],
    serviceAnswers: {
      "communication.engagementType": "campaign",
      "communication.durationMonths": "three",
    },
  });
  const visible = normalizeEstimatorDraft({
    version: 2,
    step: 4,
    serviceIds: ["digital-communication"],
    serviceAnswers: {
      "communication.engagementType": "ongoing",
      "communication.durationMonths": "three",
    },
  });

  assert.ok(hidden);
  assert.ok(visible);
  assert.equal(hidden.serviceAnswers["communication.durationMonths"], undefined);
  assert.equal(visible.serviceAnswers["communication.durationMonths"], "three");
});
