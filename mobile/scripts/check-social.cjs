#!/usr/bin/env node
// Build 7 checks, no device and no server needed:  npm run check:social
//
// 1. Supabase gate. With the URL / anon key blank (as app.json and eas.json
//    ship), isSupabaseConfigured is false, every lib/social.ts call returns a
//    typed "off" result, sync is a no-op, and supabase-js createClient() is
//    never reached. Any new exported social call that isn't listed here fails
//    the check, so it can't slip in ungated.
// 2. lib/privacy.ts rules: who sees an entry, and who gets the spot.
//
// Runs the real TypeScript from lib/ (via sucrase) with React Native / Expo /
// supabase-js swapped for stubs. Never sets real keys.

const Module = require("module");
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const { transform } = require("sucrase");

delete process.env.EXPO_PUBLIC_SUPABASE_URL;
delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const root = path.join(__dirname, "..");
const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));

let createClientCalls = 0;
const mem = new Map();
const STUBS = {
  "react-native-url-polyfill/auto": {},
  "@react-native-async-storage/async-storage": {
    __esModule: true,
    default: { getItem: async (k) => mem.get(k) ?? null, setItem: async (k, v) => void mem.set(k, v) },
  },
  "expo-constants": { __esModule: true, default: { expoConfig: { extra: appJson.expo.extra } } },
  "@supabase/supabase-js": {
    __esModule: true,
    createClient: () => {
      createClientCalls++;
      throw new Error("createClient() reached with Supabase unconfigured");
    },
    isAuthSessionMissingError: () => false,
  },
  react: { __esModule: true, useEffect: () => {}, useState: (v) => [v, () => {}] },
  "@expo/vector-icons": { __esModule: true, Ionicons: { glyphMap: {} } },
};

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request in STUBS) return `stub:${request}`;
  return resolve.call(this, request, ...rest);
};
for (const [name, exports] of Object.entries(STUBS)) {
  const m = new Module(`stub:${name}`);
  m.exports = exports;
  m.loaded = true;
  require.cache[`stub:${name}`] = m;
}
require.extensions[".ts"] = (module, filename) => {
  const src = fs.readFileSync(filename, "utf8");
  module._compile(transform(src, { transforms: ["typescript", "imports"], filePath: filename }).code, filename);
};

const lib = (f) => require(path.join(root, "lib", f));

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${e && e.message}`);
  }
}

(async () => {
  const supabase = lib("supabase.ts");
  const social = lib("social.ts");
  const privacy = lib("privacy.ts");

  console.log("Supabase gate (blank URL / key)");
  await check("app.json extra.supabaseUrl / supabaseAnonKey are blank", () => {
    assert.equal(appJson.expo.extra.supabaseUrl, "");
    assert.equal(appJson.expo.extra.supabaseAnonKey, "");
  });
  await check("eas.json env blanks", () => {
    const eas = JSON.parse(fs.readFileSync(path.join(root, "eas.json"), "utf8"));
    for (const [, b] of Object.entries(eas.build)) {
      if (!b.env) continue;
      assert.equal(b.env.EXPO_PUBLIC_SUPABASE_URL ?? "", "");
      assert.equal(b.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "", "");
    }
  });
  await check("isSupabaseConfigured is false", () => assert.equal(supabase.isSupabaseConfigured, false));

  const hunt = { id: "hunt-1", date: "2026-11-13", locationKind: "club", refugeId: null, locationName: "X", blind: "B3", party: ["Me"], teamCode: "", sky: "", windDir: 0, windMph: 0, tempF: 0, start: "", end: "", notes: "", counts: {}, createdAt: 1 };
  const group = { id: "grp-1", name: "G", type: "crew", owner: true, inviteCode: "ABC-DEF", members: [], spotKeys: [], huntIds: [], ownerUserId: null, createdAt: 1 };
  const profile = { handle: "chris", displayName: "C", homeArea: "", logbookPrivacy: "friends", updatedAt: 0 };
  const uid = "00000000-0000-0000-0000-000000000001";

  // Every exported async call in lib/social.ts, with plausible args.
  const CALLS = {
    saveServerProfile: () => social.saveServerProfile(profile, []),
    fetchMyServerProfile: () => social.fetchMyServerProfile(),
    applyDefaultPrivacy: () => social.applyDefaultPrivacy("public"),
    searchHunters: () => social.searchHunters("chris"),
    getHunter: () => social.getHunter({ userId: uid }),
    requestFollow: () => social.requestFollow(uid),
    respondToFollow: () => social.respondToFollow(uid, true),
    unfollow: () => social.unfollow(uid),
    removeFollower: () => social.removeFollower(uid),
    unfriend: () => social.unfriend(uid),
    myFollows: () => social.myFollows(),
    hunterLog: () => social.hunterLog(uid),
    friendFeed: () => social.friendFeed(),
    publishGroup: () => social.publishGroup(group),
    createInvite: () => social.createInvite(uid, "member", 7, 1),
    listInvites: () => social.listInvites(uid),
    revokeInvite: () => social.revokeInvite(uid),
    peekInvite: () => social.peekInvite("ABCDE-FGHJK"),
    redeemInvite: () => social.redeemInvite("ABCDE-FGHJK"),
  };
  // Pure helpers: no network, nothing to gate.
  const PURE = new Set(["connectState", "hunterName", "invitableRoles", "cleanInviteInput", "parseInviteInput", "inviteLink", "inviteShareText", "inviteStatus"]);

  await check("every exported social function is covered here", () => {
    const fns = Object.entries(social).filter(([, v]) => typeof v === "function").map(([k]) => k);
    const missing = fns.filter((k) => !(k in CALLS) && !PURE.has(k));
    assert.deepEqual(missing, [], `add to CALLS or PURE: ${missing.join(", ")}`);
  });
  for (const [name, call] of Object.entries(CALLS)) {
    await check(`${name} → { ok: false, reason: "off" }`, async () => {
      const r = await call();
      assert.equal(r.ok, false);
      assert.equal(r.reason, "off");
    });
  }
  await check("pushHunts / pullMyHunts are no-ops", async () => {
    assert.deepEqual(await supabase.pushHunts([hunt]), []);
    assert.deepEqual(await supabase.pullMyHunts(), []);
  });
  await check("connectState(null) is 'off'", () => assert.equal(social.connectState(null), "off"));
  await check("getSupabase() still throws when unconfigured", () => assert.throws(() => supabase.getSupabase(), /not configured/));
  await check("supabase-js createClient() was never called", () => assert.equal(createClientCalls, 0));

  console.log("Invite codes");
  await check("parseInviteInput accepts link, path, bare code", () => {
    assert.equal(social.parseInviteInput("norcalhunt://invite/abcde-fghjk"), "ABCDE-FGHJK");
    assert.equal(social.parseInviteInput("https://x/invite/ABCDEFGHJK"), "ABCDE-FGHJK");
    assert.equal(social.parseInviteInput(" abcde fghjk "), "ABCDE-FGHJK");
    assert.equal(social.parseInviteInput("ABC-123"), null);
    assert.equal(social.parseInviteInput("ABCDE-FGHJ0"), null); // 0 isn't in the alphabet
  });
  await check("invitableRoles: never owner, never above yourself", () => {
    assert.deepEqual(social.invitableRoles("guide_service", "owner"), ["guide", "admin", "client"]);
    assert.deepEqual(social.invitableRoles("duck_club", "admin"), ["member", "manager", "guest"]);
    assert.deepEqual(social.invitableRoles("duck_club", "manager"), ["member", "guest"]);
    for (const r of ["guide", "member", "blindmate", "client", "guest"]) assert.deepEqual(social.invitableRoles("crew", r), []);
  });

  console.log("Logbook privacy");
  const full = { ...hunt, locationName: "Butte Sink club", blind: "Blind 3", notes: "gate 3 then north levee", party: ["Me", "Luis"], sightings: "specs over pond 2", counts: { "mallard.drake": 4 } };
  const ctx = (o) => ({ viewerId: "v", authorId: "a", isFriend: false, groups: [], ...o });
  const mate = { groupId: "g1", type: "crew", viewerRole: "member", withAuthor: true };
  const meta = (visibility, groupIds = []) => ({ visibility, groupIds });

  await check("signed out sees nothing, even public", () => assert.equal(privacy.viewHunt(ctx({ viewerId: null }), full, meta("public")), null));
  await check("only_me: nobody else", () => assert.equal(privacy.viewHunt(ctx({ isFriend: true, groups: [mate] }), full, meta("only_me")), null));
  await check("friends: friend sees birds + area, no spot/blind/notes/party", () => {
    const v = privacy.viewHunt(ctx({ isFriend: true }), full, meta("friends"));
    assert.ok(v);
    assert.equal(v.birds, 4);
    assert.equal(v.detail, null);
    assert.equal(v.partySize, 2);
    const json = JSON.stringify(v);
    for (const secret of ["Blind 3", "Butte Sink", "gate 3", "Luis", "pond 2"]) assert.ok(!json.includes(secret), `leaked ${secret}`);
  });
  await check("friends: non-friend stranger sees nothing", () => assert.equal(privacy.viewHunt(ctx(), full, meta("friends")), null));
  await check("public: stranger sees birds, no detail", () => {
    const v = privacy.viewHunt(ctx(), full, meta("public"));
    assert.ok(v && v.detail === null && v.area === "Club ground");
  });
  await check("groups: group-mate sees the detail", () => {
    const v = privacy.viewHunt(ctx({ groups: [mate] }), full, meta("groups"));
    assert.equal(v?.detail?.blind, "Blind 3");
  });
  await check("client in the hunt's guide service sees nothing, even public", () => {
    const client = { groupId: "g2", type: "guide_service", viewerRole: "client", withAuthor: true };
    assert.equal(privacy.viewHunt(ctx({ groups: [client], isFriend: true }), full, meta("public", ["g2"])), null);
  });
  await check("guest shares a group but isn't a group-mate: public entry, no detail", () => {
    const guest = { groupId: "g3", type: "duck_club", viewerRole: "guest", withAuthor: true };
    const v = privacy.viewHunt(ctx({ groups: [guest] }), full, meta("public"));
    assert.ok(v && v.detail === null);
    assert.equal(privacy.viewHunt(ctx({ groups: [guest] }), full, meta("groups")), null);
  });
  await check("owner always sees everything", () => {
    const v = privacy.viewHunt(ctx({ viewerId: "a" }), full, meta("only_me"));
    assert.equal(v?.detail?.notes, "gate 3 then north levee");
  });
  await check("coarseArea: refuge name, county + ground, never blind name", () => {
    assert.equal(privacy.coarseArea({ locationKind: "refuge", refugeId: "gray-lodge" }), "Gray Lodge");
    assert.equal(privacy.coarseArea({ locationKind: "free", refugeId: null }, { county: "Colusa", type: "rice" }), "Colusa County · rice");
    assert.equal(privacy.coarseArea({ locationKind: "club", refugeId: null }), "Club ground");
  });

  console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
})();
