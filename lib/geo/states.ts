import { regions, type Region } from "./regions";

export type ForecastPoint = {
  /** City the forecast is for. One point, not the whole state. */
  label: string;
  lat: number;
  lon: number;
};

export type HuntState = {
  slug: string;
  name: string;
  region: string;
  agency: string;
  /** Official agency website. Empty when the URL could not be confirmed. */
  website: string;
  /** Official hunting or regulations page. Empty when the URL could not be confirmed. */
  regulationsUrl: string;
  timeZone: string;
  /** Capital-city point used for the National Weather Service forecast. */
  forecast: ForecastPoint;
};

/**
 * Agency URLs were requested on 2026-11-23 and kept only when the response was a real agency page.
 * Capital coordinates are the city points returned by OpenStreetMap Nominatim the same day.
 * New Hampshire and New Jersey did not return a page that could be confirmed, so their URLs are empty.
 */
export const states: HuntState[] = [
  state("alabama", "Alabama", "mid-south-delta", "Alabama Department of Conservation and Natural Resources", "https://www.outdooralabama.com/", "https://www.outdooralabama.com/hunting/seasons-and-bag-limits", "America/Chicago", "Montgomery, Alabama", 32.3777111, -86.3090775),
  state("alaska", "Alaska", "alaska", "Alaska Department of Fish and Game", "https://www.adfg.alaska.gov/", "https://www.adfg.alaska.gov/index.cfm?adfg=wildliferegulations.hunting", "America/Anchorage", "Juneau, Alaska", 58.3019613, -134.4196751),
  state("arizona", "Arizona", "great-basin-desert-southwest", "Arizona Game and Fish Department", "https://www.azgfd.com/", "https://www.azgfd.com/hunting/regulations/", "America/Phoenix", "Phoenix, Arizona", 33.4484367, -112.074141),
  state("arkansas", "Arkansas", "mid-south-delta", "Arkansas Game and Fish Commission", "https://www.agfc.com/", "https://www.agfc.com/regulations/", "America/Chicago", "Little Rock, Arkansas", 34.7465071, -92.2896267),
  state("california", "California", "pacific-coast", "California Department of Fish and Wildlife", "https://wildlife.ca.gov/", "https://wildlife.ca.gov/Regulations", "America/Los_Angeles", "Sacramento, California", 38.5810606, -121.493895),
  state("colorado", "Colorado", "rocky-mountains", "Colorado Parks and Wildlife", "https://cpw.state.co.us/", "https://cpw.state.co.us/rules-and-regulations", "America/Denver", "Denver, Colorado", 39.7392364, -104.984862),
  state("connecticut", "Connecticut", "new-england", "Connecticut Department of Energy and Environmental Protection", "https://portal.ct.gov/deep", "https://portal.ct.gov/deep/hunting/ct-hunting-and-trapping", "America/New_York", "Hartford, Connecticut", 41.7661621, -72.6732726),
  state("delaware", "Delaware", "mid-atlantic", "Delaware Division of Fish and Wildlife", "https://dnrec.delaware.gov/fish-wildlife/", "https://dnrec.delaware.gov/fish-wildlife/hunting/", "America/New_York", "Dover, Delaware", 39.158168, -75.5243682),
  state("florida", "Florida", "southeast", "Florida Fish and Wildlife Conservation Commission", "https://myfwc.com/", "https://myfwc.com/hunting/regulations/", "America/New_York", "Tallahassee, Florida", 30.4380832, -84.2809332),
  state("georgia", "Georgia", "southeast", "Georgia Department of Natural Resources, Wildlife Resources Division", "https://georgiawildlife.com/", "https://georgiawildlife.com/regulations", "America/New_York", "Atlanta, Georgia", 33.7544657, -84.3898151),
  state("hawaii", "Hawaii", "hawaii", "Hawaii Department of Land and Natural Resources, Division of Forestry and Wildlife", "https://dlnr.hawaii.gov/dofaw/", "https://dlnr.hawaii.gov/recreation/hunting/", "Pacific/Honolulu", "Honolulu, Hawaii", 21.304547, -157.855676),
  state("idaho", "Idaho", "rocky-mountains", "Idaho Department of Fish and Game", "https://idfg.idaho.gov/", "https://idfg.idaho.gov/rules", "America/Boise", "Boise, Idaho", 43.6166163, -116.200886),
  state("illinois", "Illinois", "upper-midwest-great-lakes", "Illinois Department of Natural Resources", "https://dnr.illinois.gov/", "https://dnr.illinois.gov/hunting.html", "America/Chicago", "Springfield, Illinois", 39.7990175, -89.6439575),
  state("indiana", "Indiana", "upper-midwest-great-lakes", "Indiana Department of Natural Resources", "https://www.in.gov/dnr/", "https://www.in.gov/dnr/fish-and-wildlife/hunting-and-trapping/", "America/Indiana/Indianapolis", "Indianapolis, Indiana", 39.7683331, -86.1583502),
  state("iowa", "Iowa", "upper-midwest-great-lakes", "Iowa Department of Natural Resources", "https://www.iowadnr.gov/", "https://www.iowadnr.gov/things-do/hunting-trapping", "America/Chicago", "Des Moines, Iowa", 41.5868654, -93.6249494),
  state("kansas", "Kansas", "northern-plains", "Kansas Department of Wildlife and Parks", "https://ksoutdoors.com/", "https://ksoutdoors.com/Hunting/Hunting-Regulations", "America/Chicago", "Topeka, Kansas", 39.049011, -95.677556),
  state("kentucky", "Kentucky", "mid-south-delta", "Kentucky Department of Fish and Wildlife Resources", "https://fw.ky.gov/Pages/default.aspx", "https://fw.ky.gov/Hunt/Pages/Hunting-Regulations.aspx", "America/New_York", "Frankfort, Kentucky", 38.2009055, -84.8732836),
  state("louisiana", "Louisiana", "mid-south-delta", "Louisiana Department of Wildlife and Fisheries", "https://www.wlf.louisiana.gov/", "https://www.wlf.louisiana.gov/page/seasons-and-regulations", "America/Chicago", "Baton Rouge, Louisiana", 30.4494155, -91.1869659),
  state("maine", "Maine", "new-england", "Maine Department of Inland Fisheries and Wildlife", "https://www.maine.gov/ifw/", "https://www.maine.gov/ifw/hunting-trapping/hunting/laws-rules/index.html", "America/New_York", "Augusta, Maine", 44.3148027, -69.7743945),
  state("maryland", "Maryland", "mid-atlantic", "Maryland Department of Natural Resources", "https://dnr.maryland.gov/Pages/default.aspx", "https://dnr.maryland.gov/wildlife/pages/hunt_trap/home.aspx", "America/New_York", "Annapolis, Maryland", 38.9786401, -76.492786),
  state("massachusetts", "Massachusetts", "new-england", "Massachusetts Division of Fisheries and Wildlife", "https://www.mass.gov/orgs/division-of-fisheries-and-wildlife", "https://www.mass.gov/hunting-regulations", "America/New_York", "Boston, Massachusetts", 42.3588336, -71.0578303),
  state("michigan", "Michigan", "upper-midwest-great-lakes", "Michigan Department of Natural Resources", "https://www.michigan.gov/dnr", "https://www.michigan.gov/dnr/managing-resources/laws/regulations", "America/Detroit", "Lansing, Michigan", 42.7338254, -84.5546295),
  state("minnesota", "Minnesota", "upper-midwest-great-lakes", "Minnesota Department of Natural Resources", "https://www.dnr.state.mn.us/", "https://www.dnr.state.mn.us/regulations/hunting/index.html", "America/Chicago", "Saint Paul, Minnesota", 44.9497487, -93.0931028),
  state("mississippi", "Mississippi", "mid-south-delta", "Mississippi Department of Wildlife, Fisheries, and Parks", "https://www.mdwfp.com/", "https://www.mdwfp.com/wildlife-hunting/hunting-seasons-and-bag-limits", "America/Chicago", "Jackson, Mississippi", 32.2998686, -90.1830408),
  state("missouri", "Missouri", "mid-south-delta", "Missouri Department of Conservation", "https://mdc.mo.gov/", "https://mdc.mo.gov/hunting-trapping/regulations", "America/Chicago", "Jefferson City, Missouri", 38.577359, -92.1724265),
  state("montana", "Montana", "rocky-mountains", "Montana Fish, Wildlife and Parks", "https://fwp.mt.gov/", "https://fwp.mt.gov/hunt/regulations", "America/Denver", "Helena, Montana", 46.5927425, -112.036277),
  state("nebraska", "Nebraska", "northern-plains", "Nebraska Game and Parks Commission", "https://outdoornebraska.gov/", "https://outdoornebraska.gov/hunting/", "America/Chicago", "Lincoln, Nebraska", 40.8088861, -96.7077751),
  state("nevada", "Nevada", "great-basin-desert-southwest", "Nevada Department of Wildlife", "https://www.ndow.org/", "https://www.ndow.org/rules-regulations/", "America/Los_Angeles", "Carson City, Nevada", 39.1663259, -119.7670374),
  state("new-hampshire", "New Hampshire", "new-england", "New Hampshire Fish and Game Department", "", "", "America/New_York", "Concord, New Hampshire", 43.207178, -71.537476),
  state("new-jersey", "New Jersey", "mid-atlantic", "New Jersey Division of Fish and Wildlife", "", "", "America/New_York", "Trenton, New Jersey", 40.2203074, -74.7659),
  state("new-mexico", "New Mexico", "rocky-mountains", "New Mexico Department of Game and Fish", "https://wildlife.dgf.nm.gov/", "https://wildlife.dgf.nm.gov/hunting/", "America/Denver", "Santa Fe, New Mexico", 35.6876096, -105.938456),
  state("new-york", "New York", "mid-atlantic", "New York State Department of Environmental Conservation", "https://dec.ny.gov/", "https://dec.ny.gov/things-to-do/hunting/regulations", "America/New_York", "Albany, New York", 42.6511674, -73.754968),
  state("north-carolina", "North Carolina", "southeast", "North Carolina Wildlife Resources Commission", "https://www.ncwildlife.gov/", "https://www.ncwildlife.gov/hunting", "America/New_York", "Raleigh, North Carolina", 35.7803977, -78.6390989),
  state("north-dakota", "North Dakota", "northern-plains", "North Dakota Game and Fish Department", "https://gf.nd.gov/", "https://gf.nd.gov/regulations", "America/Chicago", "Bismarck, North Dakota", 46.808327, -100.783739),
  state("ohio", "Ohio", "upper-midwest-great-lakes", "Ohio Department of Natural Resources, Division of Wildlife", "https://ohiodnr.gov/", "https://ohiodnr.gov/buy-and-apply/hunting-fishing-boating/hunting-resources/hunting-regulations", "America/New_York", "Columbus, Ohio", 39.9622601, -83.0007065),
  state("oklahoma", "Oklahoma", "southern-plains", "Oklahoma Department of Wildlife Conservation", "https://www.wildlifedepartment.com/", "https://www.wildlifedepartment.com/hunting/regs", "America/Chicago", "Oklahoma City, Oklahoma", 35.4729886, -97.5170536),
  state("oregon", "Oregon", "pacific-coast", "Oregon Department of Fish and Wildlife", "https://www.dfw.state.or.us/", "https://myodfw.com/articles/oregon-fishing-hunting-regulations-and-updates", "America/Los_Angeles", "Salem, Oregon", 44.9391565, -123.033121),
  state("pennsylvania", "Pennsylvania", "mid-atlantic", "Pennsylvania Game Commission", "https://www.pa.gov/agencies/pgc", "https://www.pa.gov/agencies/pgc/huntingandtrapping", "America/New_York", "Harrisburg, Pennsylvania", 40.2663107, -76.8861122),
  state("rhode-island", "Rhode Island", "new-england", "Rhode Island Department of Environmental Management, Division of Fish and Wildlife", "https://dem.ri.gov/", "https://dem.ri.gov/natural-resources-bureau/fish-wildlife/wildlife-hunting", "America/New_York", "Providence, Rhode Island", 41.8239891, -71.4128343),
  state("south-carolina", "South Carolina", "southeast", "South Carolina Department of Natural Resources", "https://www.dnr.sc.gov/", "https://www.dnr.sc.gov/regulations.html", "America/New_York", "Columbia, South Carolina", 34.000754, -81.0352313),
  state("south-dakota", "South Dakota", "northern-plains", "South Dakota Game, Fish and Parks", "https://gfp.sd.gov/", "https://gfp.sd.gov/general-hunting-laws/", "America/Chicago", "Pierre, South Dakota", 44.3683644, -100.351136),
  state("tennessee", "Tennessee", "mid-south-delta", "Tennessee Wildlife Resources Agency", "https://www.tn.gov/twra.html", "https://www.tn.gov/twra/hunting.html", "America/Chicago", "Nashville, Tennessee", 36.1622767, -86.7742984),
  state("texas", "Texas", "southern-plains", "Texas Parks and Wildlife Department", "https://tpwd.texas.gov/", "https://tpwd.texas.gov/regulations/outdoor-annual/hunting/", "America/Chicago", "Austin, Texas", 30.2649261, -97.7474086),
  state("utah", "Utah", "great-basin-desert-southwest", "Utah Division of Wildlife Resources", "https://wildlife.utah.gov/", "https://wildlife.utah.gov/hunting", "America/Denver", "Salt Lake City, Utah", 40.7596198, -111.886797),
  state("vermont", "Vermont", "new-england", "Vermont Fish and Wildlife Department", "https://vtfishandwildlife.com/", "https://vtfishandwildlife.com/hunt/hunting-regulations", "America/New_York", "Montpelier, Vermont", 44.2602244, -72.5750364),
  state("virginia", "Virginia", "mid-atlantic", "Virginia Department of Wildlife Resources", "https://dwr.virginia.gov/", "https://dwr.virginia.gov/hunting/regulations/", "America/New_York", "Richmond, Virginia", 37.5385087, -77.43428),
  state("washington", "Washington", "pacific-coast", "Washington Department of Fish and Wildlife", "https://wdfw.wa.gov/", "https://wdfw.wa.gov/hunting/regulations", "America/Los_Angeles", "Olympia, Washington", 47.0451022, -122.8950075),
  state("west-virginia", "West Virginia", "mid-atlantic", "West Virginia Division of Natural Resources", "https://wvdnr.gov/", "https://wvdnr.gov/hunting/hunting-regulations/", "America/New_York", "Charleston, West Virginia", 38.3505995, -81.6332812),
  state("wisconsin", "Wisconsin", "upper-midwest-great-lakes", "Wisconsin Department of Natural Resources", "https://dnr.wisconsin.gov/", "https://dnr.wisconsin.gov/topic/Hunt/regulations/OnlineHuntingRegulations", "America/Chicago", "Madison, Wisconsin", 43.07469, -89.3841663),
  state("wyoming", "Wyoming", "rocky-mountains", "Wyoming Game and Fish Department", "https://wgfd.wyo.gov/", "https://wgfd.wyo.gov/regulations", "America/Denver", "Cheyenne, Wyoming", 41.139981, -104.820246),
];

function state(
  slug: string,
  name: string,
  region: string,
  agency: string,
  website: string,
  regulationsUrl: string,
  timeZone: string,
  label: string,
  lat: number,
  lon: number,
): HuntState {
  return { slug, name, region, agency, website, regulationsUrl, timeZone, forecast: { label, lat, lon } };
}

export function findState(slug: string) {
  return states.find((item) => item.slug === slug);
}

const regionStateOrder: Record<string, string[]> = {
  "pacific-coast": ["california", "oregon", "washington"],
  "great-basin-desert-southwest": ["nevada", "utah", "arizona"],
  "rocky-mountains": ["idaho", "montana", "wyoming", "colorado", "new-mexico"],
  "northern-plains": ["north-dakota", "south-dakota", "nebraska", "kansas"],
  "southern-plains": ["texas", "oklahoma"],
  "upper-midwest-great-lakes": ["minnesota", "wisconsin", "michigan", "iowa", "illinois", "indiana", "ohio"],
  "mid-south-delta": ["missouri", "arkansas", "louisiana", "mississippi", "tennessee", "kentucky", "alabama"],
  southeast: ["florida", "georgia", "south-carolina", "north-carolina"],
  "mid-atlantic": ["virginia", "west-virginia", "maryland", "delaware", "pennsylvania", "new-jersey", "new-york"],
  "new-england": ["maine", "new-hampshire", "vermont", "massachusetts", "rhode-island", "connecticut"],
  alaska: ["alaska"],
  hawaii: ["hawaii"],
};

export function statesInRegion(region: string) {
  const order = regionStateOrder[region] ?? [];
  return states
    .filter((item) => item.region === region)
    .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

export function regionsWithStates(): { region: Region; states: HuntState[] }[] {
  return regions.map((region) => ({ region, states: statesInRegion(region.slug) }));
}
