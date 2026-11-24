/** Unit-table pages. Add a state here, then add its JSON loader in the browser. */
export const deerElkPages = {
  idaho: {
    title: "Idaho deer and elk by unit",
    lede: "Deer and elk seasons from the Idaho Department of Fish and Game, one unit or group of units at a time.",
    searchLabel: "Unit number",
    searchPlaceholder: "For example, 2 or 4A",
    groupLabel: "unit groups",
  },
  wyoming: {
    title: "Wyoming deer and elk by hunt area",
    lede: "Deer and elk seasons from the Wyoming Game and Fish Department, one hunt area or group of areas at a time.",
    searchLabel: "Hunt area number",
    searchPlaceholder: "For example, 2",
    groupLabel: "hunt area groups",
  },
  colorado: {
    title: "Colorado deer and elk by unit",
    lede: "These are Colorado's over-the-counter deer and elk licenses by unit.",
    drawLine: "All mule deer and most other Colorado deer and elk hunts are limited licenses by draw.",
    drawHref: "https://cpw.state.co.us/activities/hunting/big-game",
    drawLabel: "CPW big game",
    searchLabel: "Unit number",
    searchPlaceholder: "For example, 3",
    groupLabel: "unit groups",
  },
} as const;

export type DeerElkState = keyof typeof deerElkPages;
