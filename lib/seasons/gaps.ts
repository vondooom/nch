/** Big game the agency does not publish as one statewide season. No dates are invented here. */
export const unlistedBigGame: Record<string, { species: string; line: string; listHref?: string; listLabel?: string }[]> = {
  idaho: [
    {
      species: "Deer",
      line: "Deer seasons are listed by unit.",
      listHref: "/hunt/idaho/deer-elk",
      listLabel: "Open the unit list",
    },
    {
      species: "Elk",
      line: "Elk seasons are listed by unit.",
      listHref: "/hunt/idaho/deer-elk",
      listLabel: "Open the unit list",
    },
  ],
  wyoming: [
    {
      species: "Deer",
      line: "Deer seasons are listed by hunt area.",
      listHref: "/hunt/wyoming/deer-elk",
      listLabel: "Open the hunt area list",
    },
    {
      species: "Elk",
      line: "Elk seasons are listed by hunt area.",
      listHref: "/hunt/wyoming/deer-elk",
      listLabel: "Open the hunt area list",
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
