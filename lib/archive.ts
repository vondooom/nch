import raw from "./archive.json";
import type { Dog, GearItem, Issue, LocalListing, Story } from "./types";

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
};

type ArchiveFile = {
  logo: string;
  hero: string;
  aboutPoster: string;
  issues: Issue[];
  stories: Story[];
  dogs: Dog[];
  gear: GearItem[];
  locals: LocalListing[];
  showcase: ShowcaseItem[];
  bagLimits: ArchiveSection[];
  seasons: ArchiveSection[];
  about: ArchiveSection[];
};

const archive = raw as ArchiveFile;

export const archiveAboutPoster = archive.aboutPoster;
export const archiveIssues = archive.issues;
export const archiveStories = archive.stories;
export const archiveDogs = archive.dogs;
export const archiveGear = archive.gear;
export const archiveLocals = archive.locals;
export const archiveShowcase = archive.showcase;
export const archiveBagLimits = archive.bagLimits;
export const archiveSeasons = archive.seasons;
export const archiveAbout = archive.about;
