import type { GroupRole, GroupType, HuntGroup } from "./groups";
import { myRole } from "./groups";

// Client-side role rules. They hide what a role shouldn't see on this phone;
// the same rules are enforced server-side by RLS in
// supabase/migrations/20261112_user_types_blinds_assignments.sql
// (nch_role_sees_results and friends). Keep the two in step.
//
//   owner / admin / manager  everything; manage the group
//   guide                     guide services: log + see results, build the daily slate
//   member / blindmate        see the shared group log and blind results
//   client                    NO harvest numbers, performance or other hunters' bags
//   guest                     same as client

const STAFF: GroupRole[] = ["owner", "admin", "manager"];

export const isStaff = (r: GroupRole) => STAFF.includes(r);

/** Can this role see bird counts, performance and other hunters' bags in a group? */
export function canViewResults(role: GroupRole, type?: GroupType): boolean {
  if (role === "client" || role === "guest") return false;
  // Guide services: results are for the operation (owner/admin/manager/guide), never members-at-large.
  if (type === "guide_service") return isStaff(role) || role === "guide";
  return true;
}

export const canManageGroup = (role: GroupRole) => isStaff(role);

/** Build the daily guide / blind / client slate, or a lease's hunt schedule. */
export function canAssign(role: GroupRole, type?: GroupType): boolean {
  if (isStaff(role)) return true;
  if (type === "guide_service") return role === "guide";
  if (type === "blind_lease" || type === "crew") return role === "blindmate" || role === "member";
  return false;
}

export const canRunDraw = (role: GroupRole) => isStaff(role);

export function canEditBlind(role: GroupRole, type?: GroupType): boolean {
  if (isStaff(role)) return true;
  if (type === "guide_service") return role === "guide";
  if (type === "blind_lease" || type === "crew") return role === "blindmate" || role === "member";
  return false;
}

/** Tag / log hunts into a group's shared log. Clients and guests can't. */
export const canLogToGroup = (role: GroupRole, type?: GroupType) => role !== "client" && role !== "guest" && (type !== "guide_service" || isStaff(role) || role === "guide");

/** Club guest days: managers log for anyone; a member logs their own. */
export const canLogGuestDay = (role: GroupRole) => isStaff(role) || role === "member";

export const groupCan = {
  viewResults: (g: HuntGroup) => canViewResults(myRole(g), g.type),
  manage: (g: HuntGroup) => canManageGroup(myRole(g)),
  assign: (g: HuntGroup) => canAssign(myRole(g), g.type),
  runDraw: (g: HuntGroup) => canRunDraw(myRole(g)),
  editBlind: (g: HuntGroup) => canEditBlind(myRole(g), g.type),
  log: (g: HuntGroup) => canLogToGroup(myRole(g), g.type),
  logGuestDay: (g: HuntGroup) => canLogGuestDay(myRole(g)),
};

export const RESULTS_HIDDEN_LINE = "Results are hidden for clients and guests — the outfit owner and guides see the numbers.";
