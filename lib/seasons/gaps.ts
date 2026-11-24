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
  kansas: [
    {
      species: "Deer",
      line: "The Resident Any-Deer Firearms permit and nonresident deer permits are by draw only. Fort Riley, Fort Leavenworth, and Smoky Hill subunit seasons are not listed here.",
    },
    {
      species: "Elk",
      line: "Fort Riley elk is by draw only, and Unit 1 is closed, so those seasons are not listed here.",
    },
  ],
  nebraska: [
    {
      species: "Deer",
      line: "Firearm, River Antlerless, landowner, and late antlerless deer seasons are set by unit, so those dates are not listed here.",
    },
    {
      species: "Elk",
      line: "Elk permits are by draw only, so season dates are not listed here.",
    },
  ],
  "north-dakota": [
    {
      species: "Deer",
      line: "Deer gun, muzzleloader, and youth seasons are by lottery, so those dates are not listed here.",
    },
    {
      species: "Turkey",
      line: "Fall turkey licenses are by lottery, so season dates are not listed here.",
    },
  ],
  "south-dakota": [
    {
      species: "Deer",
      line: "Deer licenses are issued by lottery, so season dates are not listed here.",
    },
    {
      species: "Elk",
      line: "Black Hills, Custer State Park, and the other prairie elk units are by lottery, so those dates are not listed here.",
    },
    {
      species: "Turkey",
      line: "Turkey licenses are issued by lottery, so season dates are not listed here.",
    },
  ],
};
