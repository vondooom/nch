export const deskDisclaimer =
  "Dates and rules on NorCalHunt are the desk's briefing notes. Confirm every season, tag, and refuge rule with CDFW before you leave the driveway.";

export type GuideSection = { heading: string; paragraphs: string[] };

export type FieldGuide = {
  slug: string;
  title: string;
  kicker: string;
  lede: string;
  image: string;
  sections: GuideSection[];
};

export const zones: FieldGuide[] = [
  {
    slug: "a-zone",
    title: "A zone",
    kicker: "Deer country",
    lede: "Northwest timber, early rifle, and the hunt most NorCal kids grow up on. Steep ground, thick canopy, and bucks that vanish if you walk the ridge at noon.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "The ground",
        paragraphs: [
          "A zone covers a wide slice of the north coast and the timber west of the Sacramento Valley. Think Douglas fir, brushy saddles, and logging roads that look the same in both directions.",
          "Glassing is short. Most deer are found by walking slowly, watching the edge of a cut, or sitting a saddle at first light. If you only hunt from the truck, this zone will teach you otherwise.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "We treat A zone like a boot hunt. Light pack, real rain layer, and a rifle you have already confirmed on paper with non-lead. August heat in the canopy is worse than people remember.",
          "Scout the access before opener. Gates change, fires close ridges, and the good walk-in spots fill with trucks by Saturday. Midweek is the move if you can take it.",
        ],
      },
      {
        heading: "Before you go",
        paragraphs: [
          "License year, deer tag, and non-lead. Read the Board for the current rifle window, then open the CDFW booklet and match the zone code on your tag. We will not guess that for you.",
        ],
      },
    ],
  },
  {
    slug: "b-zones",
    title: "B zones",
    kicker: "Deer country",
    lede: "North-state ridges with more glassing than A zone and less forgiveness if you are late. These tags are where a lot of public-land blacktail seasons actually get decided.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "The ground",
        paragraphs: [
          "B zones sit across the north interior — oak, pine, and the kind of ridge where you can see a buck and still be an hour from a shot. Water is the whole scouting plan in a dry September.",
          "Public land is real here. So is the walk. If the hip belt on your pack is webbing, fix that before rifle season, not after the shot.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "We glass early, move at midmorning only if the wind is honest, and sit again before last light. Bumping a bachelor group off a north slope at 10 a.m. is how weekends get wasted.",
          "A cheap 10x42 that lives in the truck beats a flagship that stays home. Grade the deer. Then decide if the stalk is the one you came for.",
        ],
      },
      {
        heading: "Before you go",
        paragraphs: [
          "Confirm which B zone is printed on the tag. They are not interchangeable. Fire restrictions and private timber gates will change the map you screenshotted in July.",
        ],
      },
    ],
  },
  {
    slug: "c-zones",
    title: "C zones",
    kicker: "Deer country",
    lede: "Coast range and the interior edges where blacktail live in the brush and the shot, when it comes, is close. C zone rewards the hunter who can sit still.",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "The ground",
        paragraphs: [
          "C zones mix coastal influence with drier inland slopes. Fog in the morning, heat by noon, and deer that bed in pockets you cannot see from the road.",
          "Access is the hunt. A perfect ridge behind a locked gate is not your ridge. We keep a list of legal walk-ins and we update it when a fire or a timber company changes the story.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "Still-hunts along the top third of a face, not the bottom where the brush eats your boots. If you are crashing, they already left.",
          "Pack for a short drag that turns into a long one. Bone on the mountain if the truck is far. Get the meat cold the same day.",
        ],
      },
      {
        heading: "Before you go",
        paragraphs: [
          "Match the tag to the zone, confirm non-lead, and read the Board. C zone weekends near town get crowded. Dawn on a Wednesday is a different hunt.",
        ],
      },
    ],
  },
  {
    slug: "d-zones",
    title: "D zones",
    kicker: "Deer country",
    lede: "Often the premium draw, often the long drive, and the reason people glass in July. D zone is where a tag application becomes a real plan.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "The ground",
        paragraphs: [
          "D zones cover a lot of the state, including eastern and southern units that NorCal hunters still drive for. Terrain runs from high sage to thick timber depending on the unit.",
          "If you drew it, scout it. A D-zone tag burned on opening weekend without a glassing plan is an expensive walk.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "We split scouting from hunting. July and August are for water, trails, and where the deer actually feed. The season is for executing that, not discovering the mountain.",
          "Weather swings harder on the east side. A cold front changes the whole week. That is a Tuesday-briefing problem, which is why the conditions strip exists.",
        ],
      },
      {
        heading: "Before you go",
        paragraphs: [
          "Premium tags have payment deadlines. Miss one and the tag is a story you tell bitterly. Watch leftover, but do not hunt the rumor — hunt the CDFW list.",
        ],
      },
    ],
  },
  {
    slug: "x-zones",
    title: "X zones",
    kicker: "Deer country",
    lede: "Additional hunts with their own dates, quotas, and egos. An X tag is not a bonus weekend on your general tag. Read the code.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "The ground",
        paragraphs: [
          "X zones are specific. Some are early, some are late, some are the hunt people build a year around. The map in your head from a general season does not transfer.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "We treat every X tag like a short season with no makeup days. Scout the unit that is printed, not the one next door that looked better on a forum.",
          "If you are sharing camp, agree on the plan before the truck is loaded. X-zone weekends get tense when nobody said who has which face.",
        ],
      },
      {
        heading: "Before you go",
        paragraphs: [
          "The Board carries the desk's read. The tag and the CDFW booklet carry the law. If those two disagree, the booklet wins and you email us so we can fix the note.",
        ],
      },
    ],
  },
  {
    slug: "sacramento-valley-refuges",
    title: "Sacramento Valley refuges",
    kicker: "Waterfowl",
    lede: "Rice, refuge draws, and the hunts that make a Tuesday storm worth calling in sick. This is the valley's duck country, and it fills up.",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "The ground",
        paragraphs: [
          "Gray Lodge, Sacramento, Colusa, Delevan, and the rice around them are the winter calendar for a valley hunter. Pits, walk-in units, and private ground all fish the same birds.",
          "A midweek northwest wind and a reservation beat a sunny Saturday with a full parking lot. We say that every year because it stays true.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "Non-lead shot, a license that is current, and a dog that will sit. If the dog will not sit, leave the dog. The refuge is not the place to find out.",
          "Watch the draw window like a weather radar. The desk flags when reservations are moving. You still have to click the button.",
        ],
      },
      {
        heading: "Before you go",
        paragraphs: [
          "HIP, federal duck stamp when it applies, state license, and the refuge's own rules for that unit. Shells in the vest, not a new box you meant to pattern.",
        ],
      },
    ],
  },
];

export const species: FieldGuide[] = [
  {
    slug: "blacktail-deer",
    title: "Blacktail deer",
    kicker: "Big game",
    lede: "The deer of the timber. Blacktail are close-range, brush-wise, and the reason half of NorCal still owns a rifle that lives behind the seat.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "Where they live",
        paragraphs: [
          "Timber edges, clear-cuts with a few years of growth, north slopes in the heat, and any saddle that connects bedding to feed. If you can see a mile, you are often in the wrong spot.",
        ],
      },
      {
        heading: "How the season usually feels",
        paragraphs: [
          "Archery is hot and quiet. Rifle is a short window that gets crowded on public land. Late tags, where they exist, are a different animal — colder, smarter deer, fewer trucks.",
          "We publish the current window on the Board. Do not hunt off a blog post, including this one.",
        ],
      },
      {
        heading: "After the shot",
        paragraphs: [
          "Mark the spot, take the photos, then get to work. Gutless method if the walk is long. Ice the same day. A chamber sealer in February is how you remember the hunt tasting like September.",
        ],
      },
    ],
  },
  {
    slug: "dove",
    title: "Dove",
    kicker: "Upland",
    lede: "The September opener. Pass shooting, a spinning-wing, and a vest that can take the heat. Dove is the hunt that gets the truck out of the garage.",
    image: "https://images.unsplash.com/photo-1474418397713-7ede21d49118?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "Where they work",
        paragraphs: [
          "Sunflowers, harvested grain, water, and the power lines between them. Scout the flight line the evening before. Showing up at legal light with no plan is how you burn a box of shells.",
        ],
      },
      {
        heading: "What has to be in the truck",
        paragraphs: [
          "License, HIP, non-lead shot, and a vest with a game bag you can clean. A cheap spinning-wing on a stake pulls birds that would have stayed wide.",
          "Cool the birds in the field. A hot tailgate is how dove gets a bad reputation in the kitchen.",
        ],
      },
      {
        heading: "On the plate",
        paragraphs: [
          "Bacon-wrapped poppers are the house recipe for a reason. Pink center, rendered bacon, and you will have people asking for the birds next year.",
        ],
      },
    ],
  },
  {
    slug: "waterfowl",
    title: "Waterfowl",
    kicker: "Marsh",
    lede: "Ducks and geese on rice, refuge, and the rivers that feed them. NorCal winter is a waterfowl season if you are willing to be cold and early.",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "Where they work",
        paragraphs: [
          "Flooded rice, refuge units, and the private pits that book out when a storm is on the map. Scout the feed. Hunt the traffic between roost and feed, not a random ditch.",
        ],
      },
      {
        heading: "The rules that catch people",
        paragraphs: [
          "Non-lead shot. Plug in the gun. Stamps and HIP. Refuge reservations are not a suggestion. A dog that breaks is how you get a lecture and an empty strap.",
          "Season splits and zone boundaries move. The Board is our summary. CDFW is the source.",
        ],
      },
      {
        heading: "In camp",
        paragraphs: [
          "A honest retriever, dry gloves, and a plan for the birds on ice before the diner. Goose legs want a smoke, not a boil. Duck breasts want a hot pan and a short rest.",
        ],
      },
    ],
  },
  {
    slug: "wild-turkey",
    title: "Wild turkey",
    kicker: "Spring and fall",
    lede: "Ridge birds and river-bottom birds. Turkey in NorCal is a patience hunt with a vest full of calls and a reason to be in the timber before deer season.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "Where they live",
        paragraphs: [
          "Oak ridges, river benches, and the edges of ranch country where a flock can see you before you see them. Roosts matter. So does not walking the same trail every Saturday.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "Spring is about not calling too much. Fall is about finding the flock and not educating every bird on the ridge. We would rather sit quiet for an hour than burn a setup in ten minutes.",
        ],
      },
      {
        heading: "Before you go",
        paragraphs: [
          "Separate spring and fall rules in your head. A turkey tag is not a deer tag and the methods are not the same. Read the current season on the Board, then the booklet.",
        ],
      },
    ],
  },
  {
    slug: "wild-pig",
    title: "Wild pig",
    kicker: "Year-round",
    lede: "The hunt that does not wait for a draw. Pigs are a license, non-lead, and a landowner who actually said yes — or public ground you have walked.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "Where they live",
        paragraphs: [
          "Foothill oaks, creek bottoms, and any ranch edge with acorns and mud. They move with food and pressure. Last week's spot is a rumor until you glass it again.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "Dawn and last light. A light rifle you trust inside two hundred yards. Night hunting is a different permit and a different plan — do not improvise it.",
          "Pigs spoil fast. Ice is not optional in August. If you cannot cool the meat, do not take the shot.",
        ],
      },
      {
        heading: "Before you go",
        paragraphs: [
          "A current hunting license and non-lead. Private land means permission you can explain to a warden, not a handshake you think you remember.",
        ],
      },
    ],
  },
  {
    slug: "valley-quail",
    title: "Valley quail",
    kicker: "Upland",
    lede: "Coveys in the foothill grass and the creek brush. Quail is a dog hunt and a walking hunt, and it is one of the best reasons to keep a vest in the truck after dove.",
    image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "Where they live",
        paragraphs: [
          "Brushy creek edges, oak grass, and the transition where a covey can run instead of fly. If your dog will not hold, you will see tails and then nothing.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "Short loops, water for the dog, and a gun you can mount without thinking. We mark coveys and we do not grind the same hill into silence every Sunday.",
        ],
      },
      {
        heading: "In the kitchen",
        paragraphs: [
          "Quail want high heat and a short cook. Grill them, or brown them and finish in a small pot with stock. They are not a stew hen.",
        ],
      },
    ],
  },
  {
    slug: "pheasant",
    title: "Pheasant",
    kicker: "Upland",
    lede: "Valley roosters in the rice stubble and the odd public field that still holds a bird. Pheasant season is a Saturday you can explain to people who do not hunt.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?fm=jpg&q=60&w=1600&auto=format&fit=crop",
    sections: [
      {
        heading: "Where they work",
        paragraphs: [
          "Stubble, canals, and the weedy corners of the valley. Pressure piles birds into the thickest cover by noon. Hunt the edges early.",
        ],
      },
      {
        heading: "How we hunt it",
        paragraphs: [
          "A dog that ranges and checks back. Hunters spaced so a flush is a shot and not a debate. Non-lead, again. California does not care that it is a rooster and not a duck.",
        ],
      },
      {
        heading: "On the plate",
        paragraphs: [
          "Dark meat wants time. Our valley pheasant and wild rice is the pot for a bird that earned the walk. If it sat in a warm vest, start over next week.",
        ],
      },
    ],
  },
];

export const faqs: { q: string; a: string }[] = [
  {
    q: "What is NorCalHunt?",
    a: "A free Tuesday briefing and a field desk for Northern California hunters. Weather, season notes, gear we actually use, recipes, dogs, and local people — one place instead of five tabs.",
  },
  {
    q: "Does Subscribe free send the newsletter?",
    a: "It saves your address on the desk. Tuesday mail goes out once Beehiiv is connected. Until then you can read every published issue on the site, and we do not sell the list.",
  },
  {
    q: "Are the season dates official?",
    a: "No. The Board is our read of the current window so you are not surprised. CDFW regulations are the law. If we are wrong, the booklet wins and we correct the note.",
  },
  {
    q: "Do I need non-lead ammunition?",
    a: "California requires non-lead for taking wildlife. Zero the load you will hunt with before opener. A rifle zeroed on old lead is a different rifle.",
  },
  {
    q: "Can I send a hunt story or a dog?",
    a: "Yes. Field Stories has a submit form. Dog of the Week has a nominate form. Editors read the inbox. An admin publishes. Drafts never hit the public site.",
  },
  {
    q: "Do you sell tags, guided hunts, or firearms?",
    a: "No. Local Boys is a list of people we would send family to. The marketplace preview will not list firearms. We are not a booking desk and we are not a gun counter.",
  },
  {
    q: "Who can publish on the site?",
    a: "Editors can draft and revise. Only an admin can publish, unpublish, or delete. That split is on purpose so a half-finished issue does not go out on Tuesday.",
  },
  {
    q: "What should I check the morning of a hunt?",
    a: "The checklist: license and tag, non-lead, shoot light, wind, fire closures, and the refuge or zone rule for that exact unit. Conditions on the homepage are the desk's snapshot, not a forecast service.",
  },
];

export const calendar: { month: string; focus: string; notes: string[] }[] = [
  {
    month: "July",
    focus: "License year and scouting",
    notes: [
      "New California hunting licenses start July 1. Do not scout or pig hunt on last year's card.",
      "Glass water for fall deer. Take notes you can read in September, not a camera roll of identical ridges.",
    ],
  },
  {
    month: "August",
    focus: "Archery deer and dove prep",
    notes: [
      "Bow season is hot and quiet. Confirm the zone on the tag before you drive.",
      "Pattern dove loads, buy the vest you will actually wear, and scout flight lines the week before opener.",
    ],
  },
  {
    month: "September",
    focus: "Dove and early rifle",
    notes: [
      "Dove early split is the social opener. Cool birds in the field.",
      "A-zone rifle is the timber hunt. Midweek if you can. Read fire restrictions the night before, not at the gate.",
    ],
  },
  {
    month: "October",
    focus: "Deer windows and first birds",
    notes: [
      "General seasons stack. Know which tag is in your pocket that morning.",
      "Early waterfowl prep: decoys out of the barn, dog on water, non-lead shot you have already shot.",
    ],
  },
  {
    month: "November",
    focus: "Waterfowl gets serious",
    notes: [
      "Refuge draws and rice hunts. Watch the reservation window.",
      "Deer tags that are still open are a second job. Do not mix the kits in one pile and hope.",
    ],
  },
  {
    month: "December",
    focus: "Marsh weather",
    notes: [
      "Storms move birds. Bluebird weekends are for working on the truck.",
      "Keep a dry layer in the truck that is actually dry. December punishes the vest you left wet.",
    ],
  },
  {
    month: "January",
    focus: "Late birds and leftover tags",
    notes: [
      "Late-season geese and the ducks that stayed. Ice on the water is a good sign and a cold dog.",
      "Leftover deer tags, if they are offered, disappear. Refresh the CDFW list. Do not trust a screenshot.",
    ],
  },
  {
    month: "February",
    focus: "Last splits and the freezer",
    notes: [
      "Know the close. A season that ended yesterday is a ticket, not a story.",
      "This is when the vacuum sealer earns its keep. Label the cut and the year.",
    ],
  },
  {
    month: "March",
    focus: "Spring turkey starts to matter",
    notes: [
      "Scout roosts without educating every bird on the ridge.",
      "Service the gun you ignored since January. Spring is not the time to discover a broken firing pin.",
    ],
  },
  {
    month: "April",
    focus: "Turkey",
    notes: [
      "Call less than you want to. Sit longer than feels reasonable.",
      "Private land still needs permission. A gobble on the other side of a fence is not your bird.",
    ],
  },
  {
    month: "May",
    focus: "Late spring and pigs",
    notes: [
      "Turkey seasons wind down on their own calendar. Read the close.",
      "Pigs are still a hunt. Heat is back. Ice in the truck before you leave, not after the shot.",
    ],
  },
  {
    month: "June",
    focus: "Fix it before July",
    notes: [
      "Boots, optics, and the pack hip belt. Buy the thing that failed last fall while you still remember why.",
      "Put in for tags with a plan, not a hope. Know the zone you are actually willing to drive to.",
    ],
  },
];

export const checklist: { title: string; items: string[] }[] = [
  {
    title: "Paper",
    items: [
      "Hunting license for this license year, not last July's.",
      "The tag for this zone, this species, this morning.",
      "HIP and stamps if you are chasing birds.",
      "Refuge reservation or written permission if the ground is not public.",
    ],
  },
  {
    title: "The gun and the load",
    items: [
      "Non-lead, and a zero you confirmed with that load.",
      "Plug in the shotgun where the rule requires it.",
      "Shells you have patterned, in the vest, not a new box in the console.",
    ],
  },
  {
    title: "The day",
    items: [
      "Shoot light for that spot, not a guess from yesterday's town.",
      "Wind you can explain in one sentence.",
      "Fire closures and road gates checked the night before.",
      "A person who knows which ridge you are on.",
    ],
  },
  {
    title: "After the shot",
    items: [
      "Mark it, photograph it, then work.",
      "Cool the meat before the truck gets hot.",
      "Know who is cutting it and whether they are backed up.",
    ],
  },
];

export function findZone(slug: string) {
  return zones.find((item) => item.slug === slug);
}

export function findSpecies(slug: string) {
  return species.find((item) => item.slug === slug);
}
