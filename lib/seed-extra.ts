import type { BoardItem, ConditionStat, Dog, GearItem, Issue, LocalListing, MarketListing, Recipe, Story } from "./types";

const now = "2026-09-11T12:00:00.000Z";

export const extraIssues: Issue[] = [
  {
    id: "issue-10",
    number: 10,
    slug: "issue-10-scout-the-water",
    title: "Scout the water: July glassing, a pig that spoiled, and the boots we kept",
    blurb: "Where blacktail are actually drinking, why a warm hindquarter is a wasted hunt, and the knee boots that survived a rice lease.",
    date: "Aug 9, 2026",
    read: "6 min read",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
    body: `July is not a season. It is the month you earn September. This issue is a scouting note: which seeps still hold, which clear-cuts are a waste of diesel, and the pig we should have left because the ice chest was a suggestion.

The boots in the gear check are the unfancy ones. They kept water out of a rice ditch and did not fall apart in the truck. That is the review.

Dove is three weeks out. If your vest is still in a bin that smells like last year's sunflower dust, wash it now.

The NorCal Hunt Team · #010`,
  },
  {
    id: "issue-9",
    number: 9,
    slug: "issue-9-zero-the-copper",
    title: "Zero the copper: non-lead is the law, and your old zero is a rumor",
    blurb: "A Saturday at the range, the value copper load that grouped, and a reminder that leftover tags are a deadline.",
    date: "Aug 2, 2026",
    read: "5 min read",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
    body: `California takes wildlife with non-lead. That sentence is the whole regulation and somehow people still arrive at the range the night before opener with a new box and a shrug.

We shot the value copper load from the gear check. It printed where we told it to after we did the work. Your rifle will tell you something else until you let it.

Leftover tags are on the Board this week. Pay the premium tag you already drew. Hope is not a payment.

The NorCal Hunt Team · #009`,
  },
  {
    id: "issue-8",
    number: 8,
    slug: "issue-8-truck-binoculars",
    title: "The binoculars that live in the truck",
    blurb: "A 10x42 that grades deer at 400 yards, a quail loop worth walking, and the map app we open when the service dies.",
    date: "Jul 26, 2026",
    read: "6 min read",
    image: "https://images.unsplash.com/photo-1516731415730-0c607149933a?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
    body: `If the optic stays on the shelf, it is jewelry. This week we wrote up the 10x42 that has ridden in the same truck since the lens caps got lost. Clear enough. Cheap enough. Always there.

Also in the issue: a short quail loop above the valley, and the offline map we download before we lose service on the ridge. Screenshot a pin. Then download the tile. Both.

License year is not a suggestion. If you are reading this in July with last year's card, stop and fix it.

The NorCal Hunt Team · #008`,
  },
];

export const extraStories: Story[] = [
  {
    id: "story-public-miss",
    slug: "the-buck-we-did-not-shoot",
    title: "The buck we did not shoot",
    author: "Reader submission · B zone",
    date: "Sep 6, 2026",
    species: "Blacktail",
    excerpt: "A legal fork at last light, a wind that switched, and the walk out with an empty strap that still felt like the right hunt.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
    body: `He was legal. We could see that. He was also 280 yards across a wind that had just turned, with ten minutes of light and a rest that was a knee and a hope.

We did not shoot. The truck ride was quiet in the good way. My brother said we would remember the deer longer than a bad hit, and he was right.

Public land gives you that choice more often than the stories admit. Send us the ones where you held off. Those count.`,
  },
  {
    id: "story-foothill-pig",
    slug: "last-light-pig-in-the-foothills",
    title: "Last light on a foothill pig",
    author: "Reader submission · Yuba foothills",
    date: "Aug 28, 2026",
    species: "Wild pig",
    excerpt: "Acorns, a creek bottom, and a sow we passed so we could take the lone boar that showed after the light went flat.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
    body: `Permission was a text from the landowner that morning, and we kept it. The first pigs were a sow and three of the year. We let them work the acorns.

The boar came out alone, late, and close enough that the shot was a formality. The ice was already in the truck because August does not negotiate.

If you hunt pigs, hunt them like the meat matters. It does.`,
  },
  {
    id: "story-pheasant-saturday",
    slug: "one-rooster-worth-the-drive",
    title: "One rooster, worth the drive",
    author: "NorCalHunt desk · Sacramento Valley",
    date: "Nov 18, 2025",
    species: "Pheasant",
    excerpt: "A public field, a dog that finally checked back, and a single rooster that made the Saturday.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
    body: `We walked two hours for nothing you could put in a vest. The dog started checking in. That was the turn.

The rooster got up on the third pass, canal side, and folded clean. One bird. We ate him that week in the wild rice pot and did not apologize for the drive.

Some hunts are a limit. This one was a reason to go back.`,
  },
  {
    id: "story-goose-finish",
    slug: "the-honker-that-would-not-finish",
    title: "The honker that would not finish",
    author: "Reader submission · Colusa",
    date: "Jan 12, 2026",
    species: "Waterfowl",
    excerpt: "A January wind, a spread that was almost right, and the one goose that looked at the decoys and kept going.",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
    body: `Everything else worked. The wind was right, the hide was low, the dog was quiet. A pair finished and we shot them well.

The single came from the north, looked, and left at the exact height where hope turns into a salute. We laughed because the alternative was a story about a skybust.

Send the hunts that were almost. They read truer than the limits.`,
  },
];

export const extraDogs: Dog[] = [
  {
    id: "dog-rio",
    slug: "rio",
    name: "Rio",
    breed: "Labrador · 3 years",
    week: "Issue #10 · Aug 9",
    story: "A rice-country Lab who sits through a finish and still wants the third bird. His owner says the ditch is the only place he is patient.",
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?fm=jpg&q=60&w=1200&auto=format&fit=crop",
    credit: "Photo by Camylla Battani on Unsplash",
    status: "published",
    updatedAt: now,
  },
  {
    id: "dog-june",
    slug: "june",
    name: "June",
    breed: "Brittany · 4 years",
    week: "Issue #9 · Aug 2",
    story: "Quail in the morning, a nap in the truck, and a point she will hold until you trip over her. Small dog, serious job.",
    image: "https://images.unsplash.com/photo-1581562444313-98be7b621dc2?fm=jpg&q=60&w=1200&auto=format&fit=crop",
    credit: "Photo of a pointing dog, Unsplash",
    status: "published",
    updatedAt: now,
  },
  {
    id: "dog-hank",
    slug: "hank",
    name: "Hank",
    breed: "German Shorthair · 6 years",
    week: "Issue #8 · Jul 26",
    story: "Pheasant, the occasional dove, and a bad habit of finding the bird in the thickest cane. Six seasons and he still acts like the first.",
    image: "https://images.unsplash.com/photo-1514134952839-71312e5b823f?fm=jpg&q=60&w=1200&auto=format&fit=crop",
    credit: "Photo by Andrew Whitham on Unsplash",
    status: "published",
    updatedAt: now,
  },
];

export const extraGear: GearItem[] = [
  {
    id: "gear-boots",
    slug: "unlined-knee-boots",
    name: "Unlined knee boots",
    category: "Marsh",
    badge: "Buy the boring pair",
    why: "Rice ditches and refuge mud. Unlined so they dry, tall enough that a step-in does not end the morning.",
    body: `Lined boots feel good in the store and rot in the truck. We run an unlined knee boot for valley ducks and a separate insulated pair for the days the water skins over.

Look at the sole. If it is a fashion lug, keep walking. You want something that stays on a muddy berm.

Dry them open, not in a heap. That is the whole maintenance plan.`,
    price: "~$80",
    issue: "Issue #10",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
  },
  {
    id: "gear-light",
    slug: "headlamp-with-a-red-mode",
    name: "Headlamp with a red mode",
    category: "Camp",
    badge: "In every kit",
    why: "Walk in without lighting the whole marsh. Red for the pit, white for the blood trail, and a battery you replaced this year.",
    body: `The lamp that fails is the one with the battery from last January. We keep a simple headlamp with a red mode in the dove vest and another in the duck bag.

Red keeps your eyes and keeps you from spotlighting the spread while you fix a tangle. White is for after the shot, on the ground, close.

Put the spare battery in the same pocket every time. Mystery pockets are how mornings start late.`,
    price: "~$35",
    issue: "Issue #11",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
  },
  {
    id: "gear-shears",
    slug: "game-shears",
    name: "Game shears",
    category: "Camp & Kitchen",
    badge: "One pair, sharp",
    why: "Birds in the field and the garage. A dedicated pair that never sees cardboard.",
    body: `Kitchen scissors and game shears are different tools that people pretend are the same. Ours live in a pouch with a small sharpener and they do not open Amazon boxes.

Breast a dove, open a bird, trim a roast. Wipe them before the blood sets. Oil the pivot when the season starts, not when they squeak in December.

Buy one good pair. The three-pack that goes dull in a weekend is not a bargain.`,
    price: "~$25",
    issue: "Issue #7",
    image: "https://images.unsplash.com/photo-1556910103-1c027450aa1d?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
  },
  {
    id: "gear-map",
    slug: "offline-hunt-map",
    name: "Offline hunt map",
    category: "Camp",
    badge: "Download the tiles",
    why: "The ridge does not have service. A map you saved at home is the one that still works at the saddle.",
    body: `We are not loyal to a brand. We are loyal to the map that is on the phone when the bars are gone. Download the area the night before. Drop a pin on the truck. Tell someone the plan.

A screenshot is a backup, not the map. You cannot scroll a screenshot to the next drainage.

Public land, private land, and the fence between them should be obvious before you are standing on the fence.`,
    price: "Free–$30/yr",
    issue: "Issue #8",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
  },
];

export const extraRecipes: Recipe[] = [
  {
    id: "recipe-duck-pan",
    slug: "pan-duck-breast",
    title: "Pan duck breast",
    lede: "Score the skin, render it, and pull the breast while the center is still rosy. This is the weeknight duck when you only brought two home.",
    need: ["Duck breasts, skin on", "Salt", "Black pepper", "A heavy pan", "Optional: a spoon of fig jam or a splash of stock"],
    method: [
      { h: "Score.", t: "Crosshatch the skin. Salt both sides. Leave them on a rack if you have twenty minutes." },
      { h: "Cold pan.", t: "Skin side down in a cold pan, then medium heat. Let the fat render. Do not rush it." },
      { h: "Flip late.", t: "A minute on the meat side. You want the skin brown and the center pink." },
      { h: "Rest.", t: "Five minutes. Slice. Spoon the jam or the pan juices, not both if you like it simple." },
    ],
    note: "If the birds were warm in the vest, this recipe will not save them. Ice in the field still comes first.",
    image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
  },
  {
    id: "recipe-chili",
    slug: "venison-chili",
    title: "Venison chili",
    lede: "Stew meat, a long simmer, and no apology about beans. This is the pot for the trim that will not make a steak.",
    need: ["Venison stew meat, cubed", "Onion and garlic", "Chili powder, cumin, oregano", "Crushed tomato", "Beans, if you are honest about wanting beans", "Stock"],
    method: [
      { h: "Brown.", t: "Salt the meat and brown it in batches. Gray meat makes gray chili." },
      { h: "Bloom.", t: "Onion, garlic, then the spices in the fat for a minute." },
      { h: "Simmer.", t: "Tomato, stock, meat. Low heat until a cube breaks with a spoon." },
      { h: "Beans last.", t: "Add them when the meat is close, so they do not turn to paste." },
    ],
    note: "A spoon of the rendered duck fat from the pan-breast recipe is a legal ingredient. We checked with ourselves.",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
  },
  {
    id: "recipe-quail",
    slug: "grilled-quail",
    title: "Grilled quail",
    lede: "Hot grill, a little salt, and off before the breast goes chalky. Quail is a ten-minute cook pretending to be a recipe.",
    need: ["Whole quail, spatchcocked", "Salt and pepper", "Olive oil or a smear of butter", "Lemon, if you have one"],
    method: [
      { h: "Flatten.", t: "Spatchcock so they cook even. Salt them." },
      { h: "Hot grate.", t: "Skin side down on a hot grill. Do not walk away." },
      { h: "Turn once.", t: "A few minutes. The breast should still give." },
      { h: "Rest short.", t: "They are small. Two minutes is a rest. Lemon if you want it brighter." },
    ],
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    status: "published",
    updatedAt: now,
  },
];

export const extraLocals: LocalListing[] = [
  {
    id: "local-sporting",
    slug: "north-valley-sporting",
    group: "Shops",
    name: "North Valley Sporting",
    where: "Chico · Licenses, ammo, boots",
    desc: "The counter that will tell you if the non-lead load is actually in stock before you drive over.",
    body: `A working shop, not a showroom. Licenses, boots, shotshells, and someone who hunts the same weekends you do. Call before you need a specific copper load on a Friday. They will not invent inventory.

We send people here for the unglamorous stuff: HIP questions, a vest that fits, a knife that is sharp out of the box.`,
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dfe?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    featured: false,
    status: "published",
    updatedAt: now,
  },
  {
    id: "local-turkey",
    slug: "feather-river-turkey",
    group: "Guides & Outfitters",
    name: "Feather River Turkey Co.",
    where: "Sacramento Valley benches · Spring turkey",
    desc: "Small spring camps on river-bottom birds. They cap the guns and they mean it.",
    body: `Two hunters, not a convoy. They roost the afternoon before and they will cancel a setup rather than educate the flock. If you want a guaranteed bird and a photo line, this is the wrong list.

Good fit for someone who has called a little and wants a ridge that is not the public one everyone already burned.`,
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    featured: false,
    status: "published",
    updatedAt: now,
  },
  {
    id: "local-redbluff",
    slug: "red-bluff-game-processing",
    group: "Meat Processors",
    name: "Red Bluff Game Processing",
    where: "Red Bluff · Deer and pig",
    desc: "Drop-off with a rail that fills in rifle week. Ask for the cut list before you are standing at the counter.",
    body: `They want it cool, reasonably clean, and tagged the way the state expects. Sausage and steaks are the work they are known for. Call the week before opener if you drew a tag and you already know you will not be breaking it down at home.

If you show up at 4 p.m. on Sunday of opening weekend, you are in a line. Plan like you know that.`,
    image: "https://images.unsplash.com/photo-1556910103-1c027450aa1d?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    featured: false,
    status: "published",
    updatedAt: now,
  },
  {
    id: "local-lassen",
    slug: "lassen-high-country",
    group: "Guides & Outfitters",
    name: "Lassen High Country",
    where: "Lassen approaches · Scouting trips",
    desc: "Pack-in scouting for hunters who drew a tag and have one weekend to learn the mountain.",
    body: `They are not going to shoot it for you. They will walk you the drainages, show you the water that is still there in August, and tell you which road a sedan should not attempt.

Book early. A drawn tag in June is not a plan in September if you wait until the campgrounds are full.`,
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    featured: true,
    status: "published",
    updatedAt: now,
  },
];

export const extraMarket: MarketListing[] = [
  {
    id: "mkt-decoys",
    cat: "Decoys",
    where: "Yuba City",
    title: "Two dozen mallard floaters + bag",
    desc: "Worked three seasons. A few with chipped paint. No holes. Bags included.",
    price: "$180",
    status: "published",
    updatedAt: now,
  },
  {
    id: "mkt-waders",
    cat: "Marsh",
    where: "Chico",
    title: "Breathable chest waders, size 11",
    desc: "One season, patched once at the knee. Boots are felt, if your refuge allows them.",
    price: "$90",
    status: "published",
    updatedAt: now,
  },
  {
    id: "mkt-kennel",
    cat: "Dogs",
    where: "Orland",
    title: "Started Lab, 18 months, sits",
    desc: "Force-fetch started, honest on marks, not finished on blinds. Owner is moving. Meet the dog before you talk price.",
    price: "Ask",
    status: "published",
    updatedAt: now,
  },
];

export const extraBoard: BoardItem[] = [
  {
    id: "board-turkey",
    label: "Spring turkey",
    detail: "Separate from fall. Methods and dates are not the deer rules. Read the current window before you buy a call.",
    kind: "watch",
    status: "published",
    updatedAt: now,
  },
  {
    id: "board-quail",
    label: "Quail",
    detail: "Foothill coveys. Confirm the zone split on the Board each fall — early and late are not the same hunt.",
    kind: "watch",
    status: "published",
    updatedAt: now,
  },
  {
    id: "board-pheasant",
    label: "Pheasant",
    detail: "Valley season. Public fields get walked hard by noon Saturday. Non-lead shot.",
    kind: "watch",
    status: "published",
    updatedAt: now,
  },
  {
    id: "board-archery",
    label: "Archery deer",
    detail: "Hot, early, and zone-specific. The tag in your pocket is the only zone that matters that morning.",
    kind: "open",
    status: "published",
    updatedAt: now,
  },
];

export const extraConditions: ConditionStat[] = [
  { id: "c-valley", label: "Valley temp at shoot light", value: "58° and climbing", updatedAt: now },
  { id: "c-azone", label: "A-zone access", value: "Gates open · check fire map", updatedAt: now },
];
