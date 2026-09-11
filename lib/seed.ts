import type { StoreData } from "./types";

const now = "2026-09-11T12:00:00.000Z";

export const seed: StoreData = {
  issues: [
    {
      id: "issue-13",
      number: 13,
      slug: "issue-13",
      title: "Dove opens Tuesday: poppers, a vest, and the paperwork you can't skip",
      blurb:
        "Plus a plate of dove poppers in the Showcase, the value vest we trust, a young pointer already holding steady, and a father-son hunt worth reading to the end.",
      date: "Aug 30, 2026",
      read: "7 min read",
      image:
        "https://media.beehiiv.com/cdn-cgi/image/fit=scale-down,quality=80,format=auto,onerror=redirect/uploads/asset/file/6d6317e7-0b4c-4201-b6d6-782f586dab5d/IMG_5831_Large.png.png?t=1787865392",
      status: "published",
      updatedAt: now,
      body: `Welcome back. This is the last briefing before the birds fly. Dove opens Tuesday, September 1, just two days out, so this week we point everything at the opener: a bacon-wrapped popper that turns a pile of breasts into the best reason to host the tailgate, the value dove vest that keeps your shells up front and your birds cooling in back, and the paperwork you cannot walk into the field without.

A-zone rifle rolls into week four, the bow zones are down to their last weekend, and we have a plate of poppers in the Showcase, a young pointer already holding steady, and a father-son dove hunt that ended with something none of us will ever pull off twice.

The Board is in the Season Board this week — dove, A-zone rifle, leftover tags, and the fire map. Read it before you leave the driveway.

Stay safe out there, get your gear cleaned, and we'll see you in the field.

The NorCal Hunt Team · #013`,
    },
    {
      id: "issue-12",
      number: 12,
      slug: "the-long-way-out-packing-a-buck-from-the-backcountry",
      title: "The long way out: packing a buck from the backcountry",
      blurb:
        "Plus the value frame pack we trust, the gutless method step by step, a 14-year-old still holding point, and dove opener nine days out.",
      date: "Aug 23, 2026",
      read: "8 min read",
      status: "published",
      updatedAt: now,
      body: `When a buck falls a long way from the truck, the hunt is only half done. This issue walks the gutless method, the pack that actually carries the load, and the decisions that keep meat cold in August heat.

Bone on the mountain. Leave the hide. Get the meat onto ice before the August thermals cook it in the pack. The frame pack from this week's gear check is the one that didn't squeak on a four-mile walk-out.

Dove opener is nine days out. License, HIP, and non-lead shot — don't be the guy arguing with a warden in the parking lot.

The NorCal Hunt Team · #012`,
    },
    {
      id: "issue-11",
      number: 11,
      slug: "issue-11-ice-on-the-marsh",
      title: "Ice on the marsh: late-season goose, a Chessie named Tule, and leftover tags",
      blurb:
        "A January goose hunt that started with ice, the leftover-tag list you should actually watch, and why we still run a chamber sealer in camp.",
      date: "Aug 16, 2026",
      read: "6 min read",
      status: "published",
      updatedAt: now,
      body: `August is for scouting. January is for the birds that stayed. This week we rewind a late-season goose hunt at the edge of the rice: ice on the water, a Chesapeake that treated it like September, and the leftover-tag window that still catches people sleeping.

If you are sitting on a premium tag payment, pay it. If you are watching leftover, refresh the list like it's a weather radar.

The Board this week: leftover tags, license year, and pigs — still open, still a good reason to keep a rifle zeroed.

The NorCal Hunt Team · #011`,
    },
    {
      id: "issue-14",
      number: 14,
      slug: "issue-14-after-the-opener",
      title: "After the opener: what the first week of dove actually told us",
      blurb:
        "Draft for Tuesday. Editors: fill in Gray Lodge counts, the vest follow-up, and the father-son letter we held from #13.",
      date: "Sep 8, 2026",
      read: "6 min read",
      status: "draft",
      updatedAt: now,
      body: `Placeholder draft. Editors can finish the after-action from opening week — birds, wind, and the gear that failed — then hand it to an admin to publish.`,
    },
  ],
  stories: [
    {
      id: "story-first-buck",
      slug: "a-first-buck-two-brothers",
      title: "A first buck, two brothers, and one last hunt",
      author: "Reader submission · Shasta Cascade",
      date: "Aug 16, 2026",
      species: "Blacktail",
      excerpt:
        "Two brothers, one last morning on a ridge they have hunted since they were kids, and a first buck that made the walk out worth every step.",
      body: `We grew up on this ridge. The same saddle, the same glassing knob, the same joke about who would spot him first. This year it was the younger one.

He made a clean shot at first light. We sat with the animal longer than we needed to. Some hunts you rush. This one you don't.

If you have a story like this — a first, a last, or the one you still tell around the tailgate — send it in. We publish the ones that sound like they happened here.`,
      image:
        "https://images.unsplash.com/photo-1642017263197-f55a861ab4dd?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
    {
      id: "story-draft-marsh",
      slug: "gray-lodge-first-limit",
      title: "First limit at Gray Lodge — draft",
      author: "Editor draft",
      date: "Sep 8, 2026",
      species: "Waterfowl",
      excerpt:
        "A draft from the inbox: opening-week teal, a young Lab, and a limit that almost didn't happen.",
      body: `Placeholder draft. Editors can finish this from a reader submission and hand it to an admin to publish.`,
      status: "draft",
      updatedAt: now,
    },
    {
      id: "story-teal-rain",
      slug: "teal-in-the-rain-colusa",
      title: "Teal in the rain, Colusa County",
      author: "Reader submission · Sacramento Valley",
      date: "Sep 3, 2026",
      species: "Waterfowl",
      excerpt:
        "Opening-week teal, a leaky wader, and a Lab that did not care about the weather. The limit almost didn't happen.",
      body: `The rain started on the walk in and never let up. We had two teal on the water at first light and then nothing for an hour. The Lab sat in the rain like it was a job.

A single came in low off the rice. Then a pair. We were one bird short of a limit when the wind shifted and they quit. We walked out wet, smiling, and late for work.

If you have a story like this, send it. We publish the ones that sound like they happened here.`,
      image:
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
  ],
  dogs: [
    {
      id: "dog-scout",
      slug: "scout",
      name: "Scout",
      breed: "English Pointer · 10 months",
      week: "Issue #13 · Aug 30",
      story:
        "Already holding steady on planted birds at ten months. Her owner says she pointed a butterfly at eight weeks and never looked back.",
      image:
        "https://images.unsplash.com/photo-1581562444313-98be7b621dc2?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      credit: "Photo by Cole Wyland on Unsplash",
      status: "published",
      updatedAt: now,
    },
    {
      id: "dog-belle",
      slug: "belle",
      name: "Belle",
      breed: "German Shorthair · 14 years",
      week: "Issue #12 · Aug 23",
      story:
        "Fourteen seasons in and still holding point. Slower to the field these days — but nothing gets past her nose in the first hour.",
      image:
        "https://images.unsplash.com/photo-1514134952839-71312e5b823f?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      credit: "Photo by Andrew Whitham on Unsplash",
      status: "published",
      updatedAt: now,
    },
    {
      id: "dog-tule",
      slug: "tule",
      name: "Tule",
      breed: "Chesapeake Bay Retriever · 5",
      week: "Issue #11 · Aug 16",
      story:
        "Named for the marsh she works. Broke ice on a January goose hunt and delivered to hand like it was a September dove.",
      image:
        "https://images.unsplash.com/photo-1670505343033-ae36ef2854f9?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      credit: "Photo by Marie-Pier Fillion on Unsplash",
      status: "published",
      updatedAt: now,
    },
  ],
  gear: [
    {
      id: "gear-bino",
      slug: "10x42-value-binoculars",
      name: "10x42 value binoculars",
      category: "Optics",
      badge: "Value pick",
      why: "Clear enough to grade a blacktail at 400 yards, cheap enough to live in the truck. The step-up flagship isn't worth 3x the price.",
      body: `We ran these through A-zone timber and a July glassing trip on the east side. Resolution at 400 yards is good enough to tell a legal fork from a spike. The focus wheel is a little stiff with gloves, and they will fog if you leave them on a hot dash then walk into a creek bottom — same as every mid-price roof prism.

What they are not: a $1,200 open-bridge flagship. You do not need that to hunt NorCal public land. You need a pair you will actually leave in the truck all year.

We keep a cheap harness on them and a lens cloth in the lid pocket. If you buy one optic this year, buy this class — then spend the rest on tags and gas.`,
      price: "~$260",
      issue: "Issue #8",
      image: "https://images.unsplash.com/photo-1516731415730-0c607149933a?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
    {
      id: "gear-pack",
      slug: "value-frame-pack",
      name: "Value frame pack",
      category: "Big Game",
      badge: "Field-tested",
      why: "Hauled a boned-out buck 4 miles without a squeak. Load shelf, real hip belt, no gimmicks.",
      body: `The hunt ends when the animal is on ice, not when it hits the ground. This pack took a boned-out blacktail four miles of steep timber in August without a popped stitch or a squeaking stay.

Look for a real load shelf, a hip belt that sits on bone, and a frame you can hang meat on. Skip the hydration-bladder fashion packs. If the hip belt is webbing, keep walking.

We still bone on the mountain. The pack is why the walk out is miserable instead of impossible.`,
      price: "~$220",
      issue: "Issue #12",
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
    {
      id: "gear-vest",
      slug: "dove-upland-vest",
      name: "Dove & upland vest",
      category: "Upland",
      badge: "We trust it",
      why: "Big shell pockets, a blood-proof game bag, mesh back for the September heat. Buy once for a decade of openers.",
      body: `Dove opener in the valley is a heat hunt. You want shells up front, birds in back, and air through the mesh. This vest does that without pretending to be a turkey vest or a turkey vest pretending to be a dove vest.

The game bag wipes clean. The shell loops do not dump #7.5 in the truck. After a decade of openers the stitching is the first thing that goes — not the idea.

Wear it over a t-shirt in September and a hoodie in January pheasant. One vest. Done.`,
      price: "~$70",
      issue: "Issue #13",
      image: "https://images.unsplash.com/photo-1474418397713-7ede21d49118?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
    {
      id: "gear-decoy",
      slug: "spinning-wing-dove-decoy",
      name: "Spinning-wing dove decoy",
      category: "Waterfowl",
      badge: "Set out early",
      why: "Doves finish 20 yards closer — the difference between a limit and a box of excuses.",
      body: `Set it on a stake at the edge of the sunflowers before legal light. Spinning wings pull passing birds that would otherwise slide a hundred yards out.

It is not magic. If you are late, if the wind is wrong, if you are sitting in the open, you will still watch them flare. Used with a few clip-ons and a good hide, it is the cheapest upgrade on the dove line.

Carry spare batteries. The hunt is two hours. The decoy should last three.`,
      price: "~$45",
      issue: "Issue #10",
      image: "https://images.unsplash.com/photo-1564760055775-d63b17a69dd2?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
    {
      id: "gear-loads",
      slug: "non-lead-hunting-loads",
      name: "Non-lead hunting loads",
      category: "Big Game",
      badge: "Zero it now",
      why: "California requires non-lead for all take. Get zeroed before your opener, not the night before.",
      body: `Non-lead is the law for all take in California. Copper does not shoot to the same point of impact as the lead you zeroed in 2019. Confirm it on paper before you walk in.

We run a value copper load that groups inside an inch at 100 in the rifles we actually carry. It is not a match load. It is a hunting load that hits where the crosshairs sit after you do the work.

Do not show up at the range the night before A-zone with a new box and a shrug.`,
      price: "~$55/box",
      issue: "Issue #9",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
    {
      id: "gear-sealer",
      slug: "chamber-vacuum-sealer",
      name: "Chamber vacuum sealer",
      category: "Camp & Kitchen",
      badge: "Pays for itself",
      why: "No more freezer-burned backstrap in February. Buy the chamber style, skip the suction bags.",
      body: `A suction-bag sealer fights wet meat and gives up. A chamber sealer pulls air around the bag and seals it anyway. That is the difference between backstrap in February and a beige brick you throw away.

We run one in the shop and one that rides to camp in a tote. Bags are cheap. The machine is the spend. If you kill one deer a year it still pays for itself the first season you do not waste a quarter.

Cool the meat first. Seal once. Label the date and the cut.`,
      price: "~$180",
      issue: "Issue #7",
      image: "https://images.unsplash.com/photo-1556910103-1c027450aa1d?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
  ],
  locals: [
    {
      id: "local-rice",
      slug: "rice-country-waterfowl",
      group: "Guides & Outfitters",
      name: "Rice Country Waterfowl Co.",
      where: "Butte & Colusa Co. · Waterfowl",
      desc: "Guided duck and goose hunts on private flooded rice. Pit blinds, decoys set before shoot light, dogs welcome.",
      body: `Private flooded rice, pit blinds already set, and a crew that hunts the same water they put you on. Dogs are welcome if they are under control. This is the operation we send first-timers to when they want a real valley duck hunt without guessing which levee to park on.

Book midweek storms if you can. Weekends fill. Bring non-lead shot and a license that is actually current.`,
      image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      featured: true,
      status: "published",
      updatedAt: now,
    },
    {
      id: "local-blacktail",
      slug: "north-state-blacktail-guides",
      group: "Guides & Outfitters",
      name: "North State Blacktail Guides",
      where: "Shasta Cascade · C-Zone deer",
      desc: "DIY-style guided blacktail hunts on timber ridges. Scouting packages for public-land hunters.",
      body: `They will not do the hunt for you. They will put you on the ridges they have glassed since July and tell you why the deer use that saddle. Scouting packages are the move if you already have a tag and a week off.

Public land. Steep timber. Expect to walk. That is the point.`,
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      featured: false,
      status: "published",
      updatedAt: now,
    },
    {
      id: "local-cut",
      slug: "valley-custom-cut-and-wrap",
      group: "Meat Processors",
      name: "Valley Custom Cut & Wrap",
      where: "Yuba City · Deer, pig & birds",
      desc: "Skinning through vacuum-sealed cuts in 7 days. Sausage, jerky, and snack sticks. Non-lead-aware trimming.",
      body: `Drop it off clean and cool. They will skin, break it down, and have vacuum-sealed cuts back in a week. They know non-lead and they will not treat copper-shot meat like a mystery.

Call before rifle opener. The rail fills. Ask for stew meat if you actually make stew.`,
      image: "https://images.unsplash.com/photo-1556911220-bff31c812dfe?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      featured: false,
      status: "published",
      updatedAt: now,
    },
    {
      id: "local-retrievers",
      slug: "marsh-and-field-retrievers",
      group: "Dog Trainers",
      name: "Marsh & Field Retrievers",
      where: "Sacramento Valley · Retrievers",
      desc: "Started and finished duck dogs, force-fetch through blind retrieves. Summer technical-water program.",
      body: `Started dogs that sit, finished dogs that handle a blind across a ditch. The summer water program is what we send people to when their Lab is honest on land and lost in the tules.

This is not a weekend board-and-train for a party trick. They will tell you if the dog is not ready. That is why we list them.`,
      image: "https://images.unsplash.com/photo-1552053831-71594a27632d?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      featured: true,
      status: "published",
      updatedAt: now,
    },
    {
      id: "local-mount",
      slug: "cascade-ridge-taxidermy",
      group: "Taxidermy",
      name: "Cascade Ridge Taxidermy",
      where: "Redding · Deer, pig & birds",
      desc: "Shoulder mounts and birds that look like they still have a heartbeat. Six-month turnaround if you book before rifle season.",
      body: `Cape it right, get it on ice, and call them before the hide turns. Shoulder mounts and birds are the work they are proud of. Six months if you are in the book before rifle season — longer if you show up in November with a surprise.

They will tell you if the cape is too far gone. Pay for honesty.`,
      image: "https://images.unsplash.com/photo-1511497584788-876760111969?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      featured: false,
      status: "published",
      updatedAt: now,
    },
  ],
  market: [
    {
      id: "mkt-rf",
      cat: "Optics",
      where: "Chico",
      title: "Vortex Diamondback HD 2000 rangefinder",
      desc: "Two seasons old, glass is clean, ranges reflective past 1,800. Box and lanyard included.",
      price: "$260",
      status: "published",
      updatedAt: now,
    },
    {
      id: "mkt-boat",
      cat: "Vehicles",
      where: "Colusa",
      title: "2019 duck boat + mud motor",
      desc: "16-ft flat-bottom, 23hp longtail, camo dipped. Ready for the refuge draw — turnkey.",
      price: "$8,500",
      status: "published",
      updatedAt: now,
    },
    {
      id: "mkt-lease",
      cat: "Leases",
      where: "Butte Co.",
      title: "300-acre rice lease, 4 guns",
      desc: "Flooded rice with two pit blinds, season-long access. One gun spot open for 2026–27.",
      price: "By gun",
      status: "published",
      updatedAt: now,
    },
  ],
  recipes: [
    {
      id: "recipe-poppers",
      slug: "bacon-wrapped-dove-poppers",
      title: "Bacon-wrapped dove poppers",
      lede: "The tailgate recipe that ends the argument about how to cook a dove. Breast your birds, wrap them hot and fast, and get them off the grill with a warm pink center.",
      need: [
        "Dove breasts (2 fillets per bird)",
        "Jalapeños, seeded and halved",
        "Cream cheese",
        "Thin-cut bacon",
        "Toothpicks",
        "Nitrile gloves",
        "Ice in the field, not a hot tailgate",
      ],
      method: [
        { h: "Stuff.", t: "A smear of cream cheese in each jalapeño half, then a dove breast." },
        { h: "Wrap.", t: "One strip of bacon, toothpick to hold." },
        { h: "Grill hot.", t: "High heat until bacon renders and the breast is just pink." },
        { h: "Don't overcook.", t: "Past pink it turns dry and livery — that's where doves get their reputation." },
      ],
      note: "Wear gloves when you clean birds and get them onto ice in the field. Same cool-fast rule as Issue #7.",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
    {
      id: "recipe-backstrap",
      slug: "cast-iron-blacktail-backstrap",
      title: "Cast-iron blacktail backstrap",
      lede: "The pan behind every From Field to Table issue. Sears a backstrap properly over coals or a burner.",
      need: ["Backstrap, silver skin off", "Kosher salt", "Black pepper", "12-inch cast iron", "Butter and garlic"],
      method: [
        { h: "Dry and salt.", t: "Pat dry, salt 40 minutes ahead if you can." },
        { h: "Rip the pan.", t: "Cast iron screaming hot, a film of fat." },
        { h: "Sear hard.", t: "90 seconds a side, butter baste the last 30." },
        { h: "Rest.", t: "Five minutes. Slice against the grain." },
      ],
      image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
    {
      id: "recipe-pheasant",
      slug: "valley-pheasant-and-wild-rice",
      title: "Valley pheasant and wild rice",
      lede: "A one-pot bird stew for the nights you actually brought a rooster home. Dark meat, wild rice, and a pot that can sit on the camp stove.",
      need: [
        "Pheasant, quartered (or two if they are small)",
        "Wild rice blend, 1 cup",
        "Onion, carrot, celery",
        "Chicken or game stock",
        "Thyme and bay",
        "Butter",
      ],
      method: [
        { h: "Brown.", t: "Salt the pieces, brown them in butter. Don't crowd the pot." },
        { h: "Sweat.", t: "Onion, carrot, celery until they smell like a kitchen." },
        { h: "Simmer.", t: "Rice, stock, thyme, bay. Cover. Low heat until the rice splits and the bird pulls." },
        { h: "Rest.", t: "Ten minutes off heat. The broth thickens if you leave it alone." },
      ],
      note: "If the bird sat in a warm vest too long, skip the stew and start over next weekend. Cool-fast still wins.",
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?fm=jpg&q=60&w=1600&auto=format&fit=crop",
      status: "published",
      updatedAt: now,
    },
    {
      id: "recipe-goose-draft",
      slug: "smoked-honker-chili",
      title: "Smoked honker chili — draft",
      lede: "Editor draft. Finish the smoke time and bean call before an admin publishes.",
      need: ["Goose legs and thighs", "Chili powder", "Beans or no beans — decide"],
      method: [{ h: "Smoke first.", t: "Then chili. Don't boil a honker like a stew hen." }],
      status: "draft",
      updatedAt: now,
    },
  ],
  board: [
    {
      id: "board-dove",
      label: "Dove — early split",
      detail: "Opens Sep 1 · closes Sep 15. License and HIP required. Non-lead shot.",
      kind: "open",
      status: "published",
      updatedAt: now,
    },
    {
      id: "board-azone",
      label: "A-zone rifle",
      detail: "Open. Week four. Non-lead required for all take.",
      kind: "open",
      status: "published",
      updatedAt: now,
    },
    {
      id: "board-tags",
      label: "Leftover tags",
      detail: "Watch the CDFW leftover list. Premium tags lapse if payment is missed.",
      kind: "deadline",
      status: "published",
      updatedAt: now,
    },
    {
      id: "board-license",
      label: "2026–27 license",
      detail: "New license year started July 1. Don't scout or pig hunt on a dead license.",
      kind: "watch",
      status: "published",
      updatedAt: now,
    },
    {
      id: "board-pigs",
      label: "Wild pig",
      detail: "Open year-round on a hunting license. Non-lead required. Night hunting is a different permit.",
      kind: "open",
      status: "published",
      updatedAt: now,
    },
    {
      id: "board-waterfowl",
      label: "Waterfowl draws",
      detail: "Watch refuge reservation windows. Gray Lodge and Sacramento NWR fill fast on midweek storms.",
      kind: "watch",
      status: "published",
      updatedAt: now,
    },
    {
      id: "board-bow",
      label: "Archery leftover",
      detail: "Draft note: confirm the last weekend of the bow zones before this runs.",
      kind: "deadline",
      status: "draft",
      updatedAt: now,
    },
  ],
  conditions: [
    { id: "c-light", label: "Shoot light today", value: "6:03 AM – 7:30 PM", updatedAt: now },
    { id: "c-wind", label: "Gray Lodge wind", value: "NNW 12 mph", updatedAt: now },
    { id: "c-dove", label: "Dove — early split", value: "Day 3 of 15 · closes Sep 15", updatedAt: now },
    { id: "c-moon", label: "Moon", value: "Waning gibbous · 62%", updatedAt: now },
    { id: "c-fire", label: "Fire map", value: "Check CAL FIRE before any ridge walk", updatedAt: now },
    { id: "c-refuge", label: "Gray Lodge reservation", value: "Midweek storms filling 48 hrs out", updatedAt: now },
  ],
  submissions: [
    {
      id: "sub-1",
      kind: "dog",
      name: "Allen C.",
      email: "allen@example.com",
      title: "Bella, 2-year-old pointer, Forest Ranch",
      body: "Locked up on a pheasant at Clear Creek. Photo attached in email follow-up.",
      createdAt: now,
      state: "new",
    },
  ],
  subscribers: [],
};
