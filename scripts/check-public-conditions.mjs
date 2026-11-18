import assert from "node:assert/strict";

// Run against a production build started with DATA_FILE pointing to a fixture
// containing a condition labeled STALE_CONDITION_SENTINEL, value
// STALE_VALUE_SENTINEL. The store also merges in the original seed conditions.
const base = process.env.BASE_URL || "http://127.0.0.1:43181";
for (const path of ["/", "/conditions"]) {
  for (let reload = 0; reload < 2; reload++) {
    const response = await fetch(new URL(path, base));
    assert.equal(response.status, 200);
    const html = await response.text();
    for (const stale of ["STALE_CONDITION_SENTINEL", "STALE_VALUE_SENTINEL", "6:03 AM", "NNW 12", "Waning gibbous", "Early split day 3"]) {
      assert(!html.includes(stale), `${path} leaked ${stale}`);
    }
    for (const expected of ["Unverified here", "Live data unavailable", "https://wildlife.ca.gov/Regulations/Nor-Cal-Shoot-Times", "https://wildlife.ca.gov/Hunting/Upland-Game-Birds", "https://www.weather.gov/", "https://aa.usno.navy.mil/data/MoonFraction"]) {
      assert(html.includes(expected), `${path} missing ${expected}`);
    }
    console.log(`PASS ${path} request ${reload + 1}: no stale figures; official sources present`);
  }
}
