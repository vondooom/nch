/**
 * Verified 2026-11-23 against the eCFR text of 50 CFR 20.117(f),
 * in the duck season regulatory alternatives:
 * https://www.ecfr.gov/current/title-50/chapter-I/subchapter-B/part-20/subpart-K/section-20.117
 *
 * The sentence applies to duck shooting and hawking hours in that section.
 * It is not a blanket rule for every species.
 */
export const federalDuckShootingHours = {
  citation: "50 CFR 20.117(f)",
  sourceTitle: "eCFR, 50 CFR 20.117",
  sourceUrl: "https://www.ecfr.gov/current/title-50/chapter-I/subchapter-B/part-20/subpart-K/section-20.117#p-20.117(f)",
  quote: "Shooting and hawking hours are from one-half hour before sunrise to sunset daily.",
  note: "State rules can be stricter and vary by species. Confirm the hours for the bird you are hunting with the state agency.",
} as const;
