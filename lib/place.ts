export type HuntPlace = {
  state: string;
  region: string;
};

/** Existing newsletter, story, zone, and species content is California. */
export const CALIFORNIA_PLACE: HuntPlace = {
  state: "california",
  region: "pacific-coast",
};

export function withCaliforniaPlace<T extends object>(rows: T[]): (T & HuntPlace)[] {
  return rows.map((row) => ({ ...CALIFORNIA_PLACE, ...row }));
}

export function ensurePlace<T extends Partial<HuntPlace>>(row: T): T & HuntPlace {
  return {
    ...row,
    state: row.state || CALIFORNIA_PLACE.state,
    region: row.region || CALIFORNIA_PLACE.region,
  };
}
