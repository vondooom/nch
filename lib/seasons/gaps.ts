/** Big game the agency does not publish as one statewide season. No dates are invented here. */
export const unlistedBigGame: Record<string, { species: string; line: string }[]> = {
  idaho: [
    {
      species: "Deer",
      line: "Deer seasons are set unit by unit, so they are not listed as one statewide season.",
    },
    {
      species: "Elk",
      line: "Elk seasons are set by zone and tag, so they are not listed as one statewide season.",
    },
  ],
  wyoming: [
    {
      species: "Deer",
      line: "Deer seasons are set by hunt area, so they are not listed as one statewide season.",
    },
    {
      species: "Elk",
      line: "Elk seasons are set by hunt area, so they are not listed as one statewide season.",
    },
  ],
  "new-mexico": [
    {
      species: "Deer",
      line: "Deer licenses are by draw only, so general season dates are not listed here.",
    },
    {
      species: "Elk",
      line: "Elk licenses are by draw only, so general season dates are not listed here.",
    },
  ],
};
