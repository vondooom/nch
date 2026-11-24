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
  colorado: [
    {
      species: "Deer",
      line: "Over-the-counter licenses are listed by unit.",
      listHref: "/hunt/colorado/deer-elk",
      listLabel: "Open the unit list",
    },
    {
      species: "Elk",
      line: "Over-the-counter licenses are listed by unit.",
      listHref: "/hunt/colorado/deer-elk",
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
  alabama: [
    {
      species: "Deer",
      line: "Open-permit public land, dog-deer hunting, and WMA seasons are not listed here.",
    },
    {
      species: "Turkey",
      line: "WMA and national forest turkey dates are not listed here.",
    },
  ],
  arkansas: [
    {
      species: "Deer",
      line: "WMA and refuge deer seasons are not listed here.",
    },
    {
      species: "Turkey",
      line: "WMA and refuge turkey seasons are not listed here.",
    },
  ],
  kentucky: [
    {
      species: "Deer",
      line: "Antlerless limits are set by county zone. The CWD antlerless season applies only in surveillance-zone counties and is not listed as its own season.",
    },
    {
      species: "Turkey",
      line: "Spring turkey 2027 is not published yet, so it is not listed here.",
    },
    {
      species: "Elk",
      line: "Elk permits are by quota, so season dates are not listed here.",
    },
  ],
  louisiana: [
    {
      species: "Deer",
      line: "WMA, refuge, and federal-land deer seasons are not listed here.",
    },
    {
      species: "Turkey",
      line: "WMA, refuge, and federal-land turkey seasons are not listed here.",
    },
  ],
  mississippi: [
    {
      species: "Turkey",
      line: "Nonresident public-land turkey is by draw and is not listed here. Fall turkey is not in the season summary used here.",
    },
  ],
  missouri: [
    {
      species: "Deer",
      line: "Antlerless portions are open only in select counties, and antlerless permit limits are set by county, so those portions are not listed here.",
    },
    {
      species: "Turkey",
      line: "Fall firearms turkey is closed in some counties. Spring turkey 2027 is not published yet, so it is not listed here.",
    },
    {
      species: "Elk",
      line: "Elk permits are by draw, so season dates are not listed here.",
    },
  ],
  tennessee: [
    {
      species: "Deer",
      line: "Antlerless limits differ by unit and are not listed as separate seasons.",
    },
    {
      species: "Turkey",
      line: "Fall turkey is closed in some counties. WMA and public-land exceptions are not listed here.",
    },
    {
      species: "Elk",
      line: "Elk permits are by quota, so season dates are not listed here.",
    },
    {
      species: "Duck",
      line: "WMA blind hunts are by application and are not listed here.",
    },
  ],
  florida: [
    {
      species: "Deer",
      line: "Antlerless windows are set by management unit and are not listed here.",
    },
    {
      species: "Public land",
      line: "WMA, waterfowl area, and public dove field schedules are not listed here.",
    },
  ],
  georgia: [
    {
      species: "Deer",
      line: "Deer dates vary by county. The color-group schedule, and extended archery and firearms seasons in some counties, are not listed here.",
    },
    {
      species: "Public land",
      line: "WMA, waterfowl area, and public dove field schedules are not listed here.",
    },
  ],
  "north-carolina": [
    {
      species: "Deer",
      line: "CWD-area and Western county-group antlerless dates are set by county and are not listed here.",
    },
    {
      species: "Tundra swan",
      line: "Tundra swan hunting is by permit draw, so season dates are not listed here.",
    },
    {
      species: "Public land",
      line: "WMA, waterfowl area, and public dove field schedules are not listed here.",
    },
  ],
  "south-carolina": [
    {
      species: "Deer",
      line: "WMA seasons differ from these private-land dates and are not listed here.",
    },
    {
      species: "Public land",
      line: "WMA, waterfowl area, and public dove field schedules are not listed here.",
    },
  ],
  delaware: [
    {
      species: "Permits",
      line: "Tundra swan is permit only, and pen-raised quail is by permit, so those seasons are not listed here.",
    },
  ],
  maryland: [
    {
      species: "Deer",
      line: "Antlerless deer dates differ between the two deer regions and are not listed here.",
    },
  ],
  "new-jersey": [
    {
      species: "Turkey",
      line: "Spring turkey is a lottery and fall turkey is by permit, so those dates are not listed here.",
    },
    {
      species: "Quail",
      line: "Stocked quail is limited to two wildlife areas and is described in the source notes.",
    },
  ],
  "new-york": [
    {
      species: "Turkey",
      line: "Fall turkey is set by area on DEC maps and is not listed here.",
    },
    {
      species: "Grouse",
      line: "Grouse seasons are set by area on DEC maps and are not listed here.",
    },
    {
      species: "Pheasant",
      line: "Pheasant seasons are set by area on DEC maps and are not listed here.",
    },
    {
      species: "Quail",
      line: "Quail seasons are set by area on DEC maps and are not listed here.",
    },
    {
      species: "Dove",
      line: "There is no dove season in New York.",
    },
  ],
  pennsylvania: [
    {
      species: "Deer",
      line: "Extended archery and extended antlerless seasons are set by WMU and are not listed here.",
    },
    {
      species: "Turkey",
      line: "Fall turkey is set by WMU and is not listed here.",
    },
    {
      species: "Elk",
      line: "Elk is by license draw, so season dates are not listed here.",
    },
  ],
  virginia: [
    {
      species: "Deer",
      line: "Firearms and late archery dates vary by locality and are not listed here.",
    },
    {
      species: "Turkey",
      line: "Fall firearms turkey varies by locality and is not listed here.",
    },
    {
      species: "Elk",
      line: "Elk in Buchanan, Dickenson, and Wise counties is by lottery and is not listed here.",
    },
  ],
  "west-virginia": [
    {
      species: "Deer",
      line: "Antlerless deer seasons are set by county and are not listed here.",
    },
    {
      species: "Turkey",
      line: "Fall turkey is set by county and is not listed here.",
    },
    {
      species: "Elk",
      line: "There is no open elk season.",
    },
  ],
  alaska: [
    {
      species: "Big game",
      line: "Moose, caribou, Dall sheep, mountain goat, bison, muskox, and bears are set by Game Management Unit, with drawing, registration, and subsistence hunts, and are not listed here.",
    },
    {
      species: "Sandhill crane",
      line: "Sandhill crane permits are not listed here.",
    },
    {
      species: "Tundra swan",
      line: "Tundra swan permits are not listed here.",
    },
  ],
  hawaii: [
    {
      species: "Other game",
      line: "Pig, goat, sheep, and mouflon seasons are set by island and hunting unit and are not listed here.",
    },
    {
      species: "Unit status",
      line: "Several Kaua\u02bbi and Maui units have storm or access closures that change during the season. Confirm unit status with DOFAW before you go. Details are in each record's notes.",
    },
    {
      species: "Turkey",
      line: "There is no 2026-27 fall turkey season, and spring 2027 is not announced yet.",
    },
  ],
  connecticut: [
    {
      species: "Deer",
      line: "State-land deer lotteries and the landowner season are not listed here. The January 2027 archery extension in Zones 11 and 12 will appear in the 2027 guide.",
    },
    {
      species: "Pheasant",
      line: "The January and February 2027 pheasant segment will appear in the 2027 guide and is not listed here.",
    },
    {
      species: "Turkey",
      line: "Spring turkey 2027 is not published yet, so it is not listed here.",
    },
    {
      species: "Dove",
      line: "No dove season is listed in the sources used here.",
    },
  ],
  maine: [
    {
      species: "Moose",
      line: "Moose permits are by lottery, so season dates are not listed here.",
    },
    {
      species: "Deer",
      line: "Antlerless permits and the expanded archery season are not listed here.",
    },
    {
      species: "Dove",
      line: "No dove season is listed in the sources used here.",
    },
  ],
  massachusetts: [
    {
      species: "Turkey",
      line: "Spring turkey 2027 is not published yet, so it is not listed here.",
    },
    {
      species: "Dove",
      line: "No dove season is listed in the sources used here.",
    },
  ],
  "new-hampshire": [
    {
      species: "Moose",
      line: "Moose permits are by lottery, so season dates are not listed here.",
    },
    {
      species: "Deer",
      line: "Special antlerless permits in WMUs L and M are not listed here.",
    },
    {
      species: "Turkey",
      line: "The 2027 youth turkey weekend is not published yet, so it is not listed here.",
    },
    {
      species: "Dove",
      line: "No dove season is listed in the sources used here.",
    },
  ],
  "rhode-island": [
    {
      species: "Deer",
      line: "Zone 4 (Block Island) is a day-by-day calendar, and the Zone 3 disabled hunter season is not listed here.",
    },
    {
      species: "Grouse",
      line: "Ruffed grouse is closed, so it is not listed here.",
    },
  ],
  vermont: [
    {
      species: "Moose",
      line: "Moose permits are by lottery, so season dates are not listed here.",
    },
    {
      species: "Deer",
      line: "The October muzzleloader antlerless permit season and expanded archery are not listed here.",
    },
    {
      species: "Turkey",
      line: "Spring turkey 2027 is not published yet, so it is not listed here.",
    },
    {
      species: "Dove",
      line: "No dove season is listed in the sources used here.",
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
