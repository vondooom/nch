import type { Blind } from "./blinds";
import type { GroupRole, GroupType } from "./groups";
import { Band, Counts, FieldCondition, HuntLog, LocationKind, total, WaterCondition } from "./huntLog";
import { canViewResults } from "./permissions";
import { DEFAULT_VISIBILITY, effectiveVisibility, Visibility } from "./profile";
import { REFUGE_BY_ID } from "./refuges";

// Logbook privacy: the ONE place that decides what another hunter sees of an
// entry. Used by the hunter-profile and feed screens on whatever the server
// hands back, by the "how others see you" preview on your own profile, and by
// the sync mapping (stampForShare). The server enforces the same rules in
// supabase/migrations/20261113_social.sql (nch_can_see_hunt /
// nch_sees_hunt_detail / nch_redact_hunt_payload) — keep the two in step.
//
// Two separate questions:
//
// 1. Can the viewer see the entry at all?
//      owner                                   always
//      client/guest in a group the entry is in never — Build 6 rule: clients and
//                                              guests don't see group results, and
//                                              no privacy setting overrides that
//      only_me                                 nobody else
//      groups                                  a group-mate (shares a group with the
//                                              author, as anything but client/guest)
//      friends                                 group-mate, or a friend (mutual
//                                              accepted follow — lib/social.ts)
//      public                                  any signed-in hunter
//
// 2. If so, does the viewer get the spot? (GPS, spot/blind names, notes,
//    sightings, party, bands — anything that could put someone in your hole.)
//      Only the owner and group-mates. Everyone else gets the coarse area
//      ("Gray Lodge", "Colusa County · rice", "Club ground"), the birds, and
//      the weather. Free-text fields go too: "parked at gate 3" lives in notes.
//
// Group logs are their own audience: a hunt logged into a group shows in that
// group's log per the Build 6 role rules (lib/permissions.ts), whatever the
// entry's visibility. Visibility governs everyone outside that.

/** A group the viewer is in, as seen from one author's point of view. */
export type ViewerGroup = {
  groupId: string;
  type: GroupType;
  viewerRole: GroupRole;
  /** The author is also in this group. */
  withAuthor: boolean;
};

export type ViewerContext = {
  /** Signed-in viewer. null = signed out → sees nothing of anyone else. */
  viewerId: string | null;
  authorId: string;
  /** Mutual accepted follow. */
  isFriend: boolean;
  /** The viewer's groups that matter here: shared with the author, or that the entry is in. */
  groups: ViewerGroup[];
};

export type EntryMeta = {
  visibility: Visibility;
  /** Groups the entry belongs to (logged into, or shared to). */
  groupIds: string[];
};

/** The shareable part of an entry. `detail` is null unless the viewer gets the spot. */
export type HuntView = {
  id: string;
  authorId: string;
  date: string;
  kind: LocationKind;
  /** Coarse area. Never coordinates, never a blind name. */
  area: string;
  visibility: Visibility;
  counts: Counts;
  birds: number;
  partySize: number;
  sky: string;
  windDir: number;
  windMph: number;
  tempF: number;
  start: string;
  end: string;
  waterCondition?: WaterCondition;
  fieldCondition?: FieldCondition;
  bandCount: number;
  detail: HuntDetail | null;
};

export type HuntDetail = {
  locationName: string;
  blind: string;
  blindId?: string;
  groupId?: string;
  notes: string;
  sightings?: string;
  waterLevel?: string;
  party: string[];
  bands?: Band[];
  trophies?: string;
};

const NO_RESULTS_ROLES: GroupRole[] = ["client", "guest"];
const isClientOrGuest = (r: GroupRole) => NO_RESULTS_ROLES.includes(r);

/** Shares a group with the author as someone who isn't a client or guest. */
export const isGroupMate = (ctx: ViewerContext) => ctx.groups.some((g) => g.withAuthor && !isClientOrGuest(g.viewerRole));

/** Viewer is in one of the entry's groups in a role that doesn't see results there. */
function blockedByRole(ctx: ViewerContext, meta: EntryMeta): boolean {
  return meta.groupIds.some((id) => {
    const g = ctx.groups.find((x) => x.groupId === id);
    return !!g && !canViewResults(g.viewerRole, g.type);
  });
}

const isOwner = (ctx: ViewerContext) => !!ctx.viewerId && ctx.viewerId === ctx.authorId;

export function canSeeEntry(ctx: ViewerContext, meta: EntryMeta): boolean {
  if (!ctx.viewerId) return false;
  if (isOwner(ctx)) return true;
  if (blockedByRole(ctx, meta)) return false;
  switch (meta.visibility) {
    case "groups":
      return isGroupMate(ctx);
    case "friends":
      return isGroupMate(ctx) || ctx.isFriend;
    case "public":
      return true;
    default:
      return false;
  }
}

/** GPS / blind / notes. Owner and group-mates only — never via friends or public. */
export function seesDetail(ctx: ViewerContext, meta: EntryMeta): boolean {
  if (isOwner(ctx)) return true;
  return canSeeEntry(ctx, meta) && isGroupMate(ctx);
}

// ── coarse area ──────────────────────────────────────────────────────────

const countyLabel = (c?: string) => {
  const s = (c ?? "").trim();
  if (!s) return "";
  return /county/i.test(s) ? s : `${s} County`;
};

const BLIND_GROUND: Record<string, string> = { rice: "rice", woodland: "timber", pond: "pond", refuge: "refuge", other: "" };

/**
 * What outsiders see instead of the spot. Refuges are public places, so the
 * refuge name stays (it's county-level, and it's what the CDFW reports use).
 * Club and private ground drop to the county + ground type when this phone
 * knows them from the hunt's blind, else a generic label.
 */
export function coarseArea(h: Pick<HuntLog, "locationKind" | "refugeId" | "coarseArea">, blind?: Pick<Blind, "county" | "type">): string {
  if (h.coarseArea?.trim()) return h.coarseArea.trim();
  if (h.locationKind === "refuge" || h.refugeId) {
    const r = h.refugeId ? REFUGE_BY_ID[h.refugeId] : undefined;
    return r ? r.short : "Public refuge";
  }
  const county = countyLabel(blind?.county);
  const ground = blind ? BLIND_GROUND[blind.type] ?? "" : "";
  if (h.locationKind === "club") return [county, "club"].filter(Boolean).join(" · ") || "Club ground";
  return [county, ground].filter(Boolean).join(" · ") || "Private ground";
}

// ── views ────────────────────────────────────────────────────────────────

function baseView(h: HuntLog, authorId: string, visibility: Visibility, area: string): Omit<HuntView, "detail"> {
  return {
    id: h.id,
    authorId,
    date: h.date,
    kind: h.locationKind,
    area,
    visibility,
    counts: h.counts ?? {},
    birds: total(h.counts ?? {}),
    // Party size is fine to share; the names aren't.
    // (A server-redacted payload has no party array, just partySize.)
    partySize: Math.max(1, Array.isArray(h.party) && h.party.length ? h.party.length : Number((h as { partySize?: number }).partySize) || 1),
    sky: h.sky ?? "",
    windDir: h.windDir ?? 0,
    windMph: h.windMph ?? 0,
    tempF: h.tempF ?? 0,
    start: h.start ?? "",
    end: h.end ?? "",
    waterCondition: h.waterCondition,
    fieldCondition: h.fieldCondition,
    bandCount: Array.isArray(h.bands) && h.bands.length ? h.bands.length : Number((h as { bandCount?: number }).bandCount) || 0,
  };
}

function detailOf(h: HuntLog): HuntDetail {
  return {
    locationName: h.locationName ?? "",
    blind: h.blind ?? "",
    blindId: h.blindId,
    groupId: h.groupId,
    notes: h.notes ?? "",
    sightings: h.sightings,
    waterLevel: h.waterLevel,
    party: Array.isArray(h.party) ? h.party : [],
    bands: h.bands,
    trophies: h.trophies,
  };
}

/**
 * The redacted view of one entry for one viewer, or null if they can't see it.
 * `hunt` may already be redacted by the server — missing fields just stay empty.
 */
export function viewHunt(ctx: ViewerContext, hunt: HuntLog, meta: EntryMeta, blind?: Pick<Blind, "county" | "type">): HuntView | null {
  if (!canSeeEntry(ctx, meta)) return null;
  const area = coarseArea(hunt, blind);
  return { ...baseView(hunt, ctx.authorId, meta.visibility, area), detail: seesDetail(ctx, meta) ? detailOf(hunt) : null };
}

/** Your own log, unredacted. */
export function ownerView(hunt: HuntLog, authorId = "me", fallback: Visibility = DEFAULT_VISIBILITY): HuntView {
  const visibility = effectiveVisibility(hunt, fallback);
  return { ...baseView(hunt, authorId, visibility, coarseArea(hunt)), detail: detailOf(hunt) };
}

/** Pretend-viewers for the "how others see your log" preview. */
export type PreviewAs = "group" | "friend" | "public";

export function previewContext(as: PreviewAs): ViewerContext {
  const viewerId = "preview-viewer";
  const authorId = "preview-author";
  return {
    viewerId,
    authorId,
    isFriend: as === "friend",
    groups: as === "group" ? [{ groupId: "preview-group", type: "crew", viewerRole: "member", withAuthor: true }] : [],
  };
}

/**
 * What the server needs alongside a hunt when it leaves the phone: the
 * effective visibility (a real hunt_logs column, so RLS can use it) and the
 * coarse area (so outsiders see "Colusa County · rice", not "Private ground").
 * The payload keeps the hunt's own `visibility` as-is — unset still means
 * "follow my default" after a pull. The full payload goes up because it's the
 * owner's row; the server redacts it for anyone else.
 */
export function shareFields(h: HuntLog, defaultVisibility: Visibility, blinds: Blind[] = []): { visibility: Visibility; coarseArea: string } {
  const blind = h.blindId ? blinds.find((b) => b.id === h.blindId) : undefined;
  return { visibility: effectiveVisibility(h, defaultVisibility), coarseArea: coarseArea({ ...h, coarseArea: undefined }, blind) };
}
