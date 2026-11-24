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
  texas: [
    {
      species: "Deer",
      line: "County bag limits, antler restrictions, doe days, and mandatory harvest reporting are set by county. The white-tailed muzzleloader season is set by county and is not listed here.",
    },
    {
      species: "Turkey",
      line: "Turkey bag limits are set by county, so they are not listed here.",
    },
    {
      species: "Pronghorn",
      line: "Pronghorn are permit only, so season dates are not listed here.",
    },
    {
      species: "Desert bighorn",
      line: "Desert bighorn sheep are permit only, so season dates are not listed here.",
    },
  ],
  oklahoma: [
    {
      species: "Antelope",
      line: "Antelope gun hunting is by draw or landowner permit, so those dates are not listed here.",
    },
  ],
  illinois: [
    {
      species: "Deer",
      line: "Bag limits are set by county or license and are not listed here. Firearm and muzzleloader permits are by lottery. Special CWD, Late Winter Antlerless, and youth firearm seasons are set by county and are not listed here.",
    },
    {
      species: "Turkey",
      line: "Spring and fall shotgun turkey permits are not listed here.",
    },
  ],
  indiana: [
    {
      species: "Deer",
      line: "Bag limits are set by county or license and are not listed here. Deer Reduction Zones cover designated locations only and are not listed here.",
    },
  ],
  iowa: [
    {
      species: "Deer",
      line: "Bag limits are set by county or license and are not listed here. January antlerless seasons are set by county quota and are not listed here. Nonresident deer licenses are by application.",
    },
    {
      species: "Turkey",
      line: "Nonresident turkey licenses are by application.",
    },
    {
      species: "Goose",
      line: "The metro Canada goose season is in mapped zones and is not listed here.",
    },
  ],
  michigan: [
    {
      species: "Deer",
      line: "Bag limits are set by unit and are not listed here. The Independence Hunt is by public-land permit and is not listed here.",
    },
    {
      species: "Elk",
      line: "Elk licenses are by lottery, so season dates are not listed here.",
    },
    {
      species: "Turkey",
      line: "Some spring turkey hunts are by drawing and are not listed here.",
    },
    {
      species: "Goose",
      line: "The Allegan County and Muskegon County wastewater goose units are not listed here.",
    },
  ],
  minnesota: [
    {
      species: "Deer",
      line: "Bag limits are set by permit area and are not listed here. The early antlerless season is set by permit area and is not listed here.",
    },
    {
      species: "Elk",
      line: "Elk licenses are by lottery, so season dates are not listed here.",
    },
    {
      species: "Prairie chicken",
      line: "Prairie chicken licenses are by lottery for residents, so season dates are not listed here.",
    },
  ],
  ohio: [
    {
      species: "Deer",
      line: "Bag limits are set by county or license and are not listed here. Disease Surveillance Area deer seasons are not listed here.",
    },
  ],
  wisconsin: [
    {
      species: "Deer",
      line: "Bag limits are set by unit and are not listed here. The metro sub-unit gun season, the antlerless holiday hunt, and the archery extension in some units are not listed here.",
    },
    {
      species: "Elk",
      line: "Elk licenses are by lottery, so season dates are not listed here.",
    },
    {
      species: "Turkey",
      line: "Spring turkey harvest authorizations are by preference drawing, so those dates are not listed here.",
    },
    {
      species: "Sharp-tailed grouse",
      line: "Sharp-tailed grouse permits are by zone, and there is no 2026 season.",
    },
  ],
};
