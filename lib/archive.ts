import raw from "./archive.json";
import { withCaliforniaPlace } from "./place";
import type { Dog, GearItem, Issue, LocalListing, Story } from "./types";

type Archived<T> = Omit<T, "state" | "region">;

export type ArchiveSection = {
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export type ShowcaseItem = {
  slug: string;
  title: string;
  week: string;
  body: string;
  image: string;
  /** YouTube URL when one is on file. Empty or omitted means no embed. */
  youtube?: string;
};

type ArchiveFile = {
  logo: string;
  hero: string;
  aboutPoster: string;
  issues: Archived<Issue>[];
  stories: Archived<Story>[];
  dogs: Archived<Dog>[];
  gear: Archived<GearItem>[];
  locals: Archived<LocalListing>[];
  showcase: ShowcaseItem[];
  bagLimits: ArchiveSection[];
  seasons: ArchiveSection[];
  about: ArchiveSection[];
};

const archive = raw as ArchiveFile;

export const archiveAboutPoster = archive.aboutPoster;
export const archiveIssues = withCaliforniaPlace(archive.issues);
export const archiveStories = withCaliforniaPlace(archive.stories);
export const archiveDogs = withCaliforniaPlace(archive.dogs);
export const archiveGear = withCaliforniaPlace(archive.gear);
export const archiveLocals = withCaliforniaPlace(archive.locals);
export const archiveShowcase = archive.showcase;
export const archiveBagLimits = archive.bagLimits;
export const archiveSeasons = archive.seasons;
export const archiveAbout = archive.about;
