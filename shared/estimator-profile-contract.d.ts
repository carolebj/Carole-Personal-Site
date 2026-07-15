export type ProjectProfileKey =
  | "organizationType"
  | "organizationScale"
  | "clientLocation"
  | "projectStage"
  | "investmentRange"
  | "marketScope"
  | "languageScope"
  | "timeline"
  | "validationProcess";

export type ProjectProfilePricingDimension =
  | "volume"
  | "complexity"
  | "duration"
  | "urgency"
  | "validation";

export type ProjectProfileContractField = Readonly<{
  values: readonly string[];
  purpose: "brief-prefill-only" | "pricing-and-prefill";
  requiredForEstimate: boolean;
  pricingDimensions: readonly ProjectProfilePricingDimension[];
  briefMapping: Readonly<{ brief: "global"; field: ProjectProfileKey }>;
}>;

export const PROJECT_PROFILE_CONTRACT: Readonly<Record<ProjectProfileKey, ProjectProfileContractField>>;
export const PROJECT_PROFILE_KEYS: readonly ProjectProfileKey[];
