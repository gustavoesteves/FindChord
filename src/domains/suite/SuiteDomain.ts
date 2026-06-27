export const SUITE_DOMAINS = {
  writer: "escrever",
  harmonizer: "harmonizar"
} as const;

export type SuiteDomain = typeof SUITE_DOMAINS[keyof typeof SUITE_DOMAINS];

