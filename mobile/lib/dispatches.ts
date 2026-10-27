import data from "../data/dispatches.json";

// Newsletter issues and reader field stories, snapshotted from the website's
// archive by scripts/build-dispatches.mjs.

export type Dispatch = {
  id: string;
  kind: "issue" | "story";
  title: string;
  blurb: string;
  date: string;
  read: string;
  byline: string;
  image: string;
  waterfowl: boolean;
  body: string;
  url: string;
};

const file = data as { issues: Dispatch[]; stories: Dispatch[] };

export const ISSUES: Dispatch[] = file.issues;
export const STORIES: Dispatch[] = file.stories;
export const ALL_DISPATCHES: Dispatch[] = [...ISSUES, ...STORIES];
