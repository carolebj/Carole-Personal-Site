import { createClient } from "@supabase/supabase-js";
import { calculateEstimateCore } from "../shared/estimator-pricing-engine.js";
import {
  missingPricingDecisions,
  officialExchangeRateSnapshot,
  productionPricingCatalog,
} from "../src/app/estimator/pricingCatalog.ts";
import { validatePricingCatalog } from "../src/app/estimator/pricingEngine.ts";

const APPLY = process.argv.includes("--apply");
const PROFILE = {
  organizationScale: "startup-small",
  clientLocation: "benin",
  projectStage: "launch",
  marketScope: "local",
  languageScope: "one",
  timeline: "one-two-months",
  validationProcess: "one",
};

const REFERENCE_SCENARIOS = [
  {
    key: "editorial-standard",
    serviceIds: ["editorial-strategy"],
    answers: {
      "editorial.currentState": "informal",
      "editorial.brandCount": 1,
      "editorial.audienceCount": 2,
      "editorial.existingCorpusSize": 10,
      "editorial.benchmarkScope": "focused",
      "editorial.deliverables": ["content-pillars", "editorial-charter"],
      "editorial.discoveryMethod": ["documents", "questionnaire"],
      "editorial.handoffSupport": ["presentation"],
    },
    expectedRangeXof: { lower: 245_000, upper: 425_000 },
  },
  {
    key: "communication-three-months",
    serviceIds: ["digital-communication"],
    answers: {
      "communication.engagementType": "ongoing",
      "communication.accountCount": 2,
      "communication.durationMonths": 3,
      "communication.postsPerMonth": 12,
      "communication.contentResponsibility": "mixed",
      "communication.tasks": ["planning", "scheduling", "publishing", "reporting"],
      "communication.campaignCount": 1,
      "communication.communityManagement": "standard",
      "communication.paidMedia": "none",
      "communication.reportingLevel": "recommendations",
    },
    expectedRangeXof: { lower: 440_000, upper: 825_000 },
  },
  {
    key: "content-twelve-items",
    serviceIds: ["content-creation"],
    answers: {
      "content.formats": ["short-post", "carousel", "static-visual"],
      "content.totalVolume": 12,
      "content.creationMode": "original",
      "content.sourceMaterial": "partial",
      "content.visualTemplates": "adapt",
      "content.videoLevel": "script-only",
      "content.deliveryRhythm": "monthly",
      "content.usageRights": ["organic"],
      "content.onSiteProduction": "none",
    },
    expectedRangeXof: { lower: 320_000, upper: 670_000 },
  },
  {
    key: "audit-deep",
    serviceIds: ["audit-advice"],
    answers: {
      "audit.assetCount": 5,
      "audit.brandCount": 1,
      "audit.corpusSize": 20,
      "audit.depth": "deep-audit",
      "audit.benchmarkScope": "focused",
      "audit.dataAccess": ["public", "analytics"],
      "audit.deliverables": ["full-report", "action-plan", "presentation"],
      "audit.reviewSessions": 2,
      "audit.implementationSupport": "advisory",
    },
    expectedRangeXof: { lower: 490_000, upper: 955_000 },
  },
  {
    key: "identity-clogis-fair-value",
    serviceIds: ["visual-identity"],
    answers: {
      "identity.projectType": "complete-identity",
      "identity.visualState": ["none"],
      "identity.namingState": "validated",
      "identity.positioningState": "needs-framing",
      "identity.brandCount": 1,
      "identity.coreDeliverables": ["logo", "logo-variants", "colors", "typography", "graphic-elements", "art-direction", "social-kit"],
      "identity.guidelineLevel": "mini",
      "identity.supportCount": 2,
      "identity.priorityUses": ["social", "web", "commercial-docs", "print"],
      "identity.languageScripts": "single-latin",
      "identity.customElements": ["none"],
      "identity.productionFiles": ["digital", "print", "editable"],
    },
    expectedRangeXof: { lower: 435_000, upper: 805_000 },
  },
];

function assertPublishable() {
  const errors = validatePricingCatalog(productionPricingCatalog);
  if (errors.length > 0) throw new Error(`Catalogue invalide:\n${errors.join("\n")}`);
  if (productionPricingCatalog.status !== "active") throw new Error("Le catalogue doit être actif.");
  if (!productionPricingCatalog.questionnaireContract) throw new Error("Le contrat questionnaire manque.");

  for (const scenario of REFERENCE_SCENARIOS) {
    const result = calculateEstimateCore({
      catalog: productionPricingCatalog,
      request: {
        serviceIds: scenario.serviceIds,
        answers: scenario.answers,
        profile: PROFILE,
        currency: "XOF",
      },
      rateSnapshot: officialExchangeRateSnapshot,
    });
    if (
      result.status !== "estimated" ||
      result.totalXof?.lower !== scenario.expectedRangeXof.lower ||
      result.totalXof?.upper !== scenario.expectedRangeXof.upper
    ) {
      throw new Error(`Le scénario ${scenario.key} ne correspond plus à sa fourchette approuvée.`);
    }
  }
}

function assertFreshUsdRate() {
  const observed = Date.parse(`${officialExchangeRateSnapshot.rates.USD.rateDate}T00:00:00Z`);
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const ageDays = (today - observed) / 86_400_000;
  if (ageDays < 0 || ageDays > 7) {
    throw new Error("Le snapshot USD a plus de sept jours. Mettez à jour pricingCatalog.ts depuis la BCEAO avant publication.");
  }
}

function assertRemotePublicationDecisionsResolved() {
  const unresolved = Object.entries(missingPricingDecisions)
    .flatMap(([category, decisions]) => decisions.map((decision) => `${category}: ${decision}`));
  if (unresolved.length > 0) {
    throw new Error(
      `Publication distante bloquée tant que ces décisions ne sont pas résolues:\n${unresolved.join("\n")}`,
    );
  }
}

async function publish() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL/VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis pour --apply.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date().toISOString();

  const rates = Object.entries(officialExchangeRateSnapshot.rates).map(([currency, rate]) => ({
    currency,
    xof_per_unit: rate.xofPerUnit,
    source: rate.sourceName,
    source_url: rate.sourceUrl,
    observed_on: rate.rateDate,
    status: "published",
    published_at: now,
  }));
  const { data, error } = await supabase.rpc("publish_estimator_pricing_model", {
    p_model_key: "project-estimator",
    p_catalog: JSON.parse(JSON.stringify(productionPricingCatalog)),
    p_reference_scenarios: REFERENCE_SCENARIOS,
    p_effective_from: now,
    p_rates: rates,
  });
  if (error) throw error;

  console.log(
    `✅ Modèle estimateur v${data.version} (${data.model_version}) publié avec ${REFERENCE_SCENARIOS.length} scénarios.`,
  );
}

assertPublishable();
assertFreshUsdRate();

if (!APPLY) {
  console.log(`✅ Catalogue ${productionPricingCatalog.modelVersion} valide.`);
  console.log(`ℹ️  Simulation uniquement : ${REFERENCE_SCENARIOS.length} scénarios prêts. Ajoutez --apply pour publier.`);
} else {
  assertRemotePublicationDecisionsResolved();
  await publish();
}
