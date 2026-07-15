import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const estimatorSource = await readFile(
  new URL("../src/app/pages/ProjectEstimator.tsx", import.meta.url),
  "utf8",
);
const calculationStageSource = await readFile(
  new URL("../src/app/components/estimator/EstimateCalculationStage.tsx", import.meta.url),
  "utf8",
);

const publicResultSource = estimatorSource.slice(
  estimatorSource.indexOf("function SummaryStep"),
  estimatorSource.indexOf("function ProjectSummaryContent"),
);

test("the estimate calculation interstitial follows the locked motion contract", () => {
  assert.match(calculationStageSource, /ESTIMATE_CALCULATION_DURATION_MS = 3_600/);
  assert.match(calculationStageSource, /useReducedMotion/);
  assert.match(calculationStageSource, /createPortal/);
  assert.match(calculationStageSource, /fixed inset-0 z-\[90\]/);
  assert.match(calculationStageSource, /Lecture de votre contexte/);
  assert.match(calculationStageSource, /Mise en relation de vos réponses/);
  assert.match(calculationStageSource, /Construction de votre fourchette/);
  assert.match(estimatorSource, /<EstimateCalculationStage/);
  assert.doesNotMatch(calculationStageSource, /spinner|animate-spin/i);
  assert.match(calculationStageSource, /CalculationGlints/);
  assert.match(calculationStageSource, /filter: "blur\(6px\)"/);
});

test("the public estimate result keeps technical metadata private", () => {
  assert.match(publicResultSource, /MÉTHODE CAROLE/);
  assert.match(publicResultSource, /expérience de Carole au Bénin/);
  assert.doesNotMatch(publicResultSource, /ADÉQUATION DE L’ENVELOPPE|INVESTMENT FIT/);
  assert.doesNotMatch(publicResultSource, /HYPOTHÈSES & VERSION|ASSUMPTIONS & VERSION/);
  assert.doesNotMatch(publicResultSource, /CONVERSION & TRAÇABILITÉ|CONVERSION & TRACEABILITY/);
  assert.doesNotMatch(publicResultSource, /Référence estimation|Estimate reference/);
  assert.doesNotMatch(publicResultSource, /result\.modelVersion|result\.assumptions|sourceUrl|snapshotId/);
  assert.doesNotMatch(publicResultSource, /Aucun e-mail n’est nécessaire|No email is required/);
  assert.match(estimatorSource, /PRÉVISUALISATION LOCALE/);
  assert.match(publicResultSource, /Voir ou modifier cette réponse/);
  assert.match(publicResultSource, /15_000/);
  assert.match(estimatorSource, /profileDomId/);
});
