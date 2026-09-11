export type Role = "admin" | "editor";

export type PublishStatus = "draft" | "published";

export type StaffUser = {
  email: string;
  name: string;
  role: Role;
};

export type Issue = {
  id: string;
  number: number;
  slug: string;
  title: string;
  blurb: string;
  date: string;
  read: string;
  body: string;
  image?: string;
  status: PublishStatus;
  updatedAt: string;
};

export type Story = {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  species: string;
  excerpt: string;
  body: string;
  image?: string;
  status: PublishStatus;
  updatedAt: string;
};

export type Dog = {
  id: string;
  name: string;
  breed: string;
  week: string;
  story: string;
  image?: string;
  credit?: string;
  status: PublishStatus;
  updatedAt: string;
};

export type GearItem = {
  id: string;
  name: string;
  category: string;
  badge: string;
  why: string;
  price: string;
  issue: string;
  status: PublishStatus;
  updatedAt: string;
};

export type LocalListing = {
  id: string;
  group: string;
  name: string;
  where: string;
  desc: string;
  featured: boolean;
  status: PublishStatus;
  updatedAt: string;
};

export type MarketListing = {
  id: string;
  cat: string;
  where: string;
  title: string;
  desc: string;
  price: string;
  status: PublishStatus;
  updatedAt: string;
};

export type Recipe = {
  id: string;
  slug: string;
  title: string;
  lede: string;
  need: string[];
  method: { h: string; t: string }[];
  note?: string;
  status: PublishStatus;
  updatedAt: string;
};

export type BoardItem = {
  id: string;
  label: string;
  detail: string;
  kind: "open" | "deadline" | "watch";
  status: PublishStatus;
  updatedAt: string;
};

export type ConditionStat = {
  id: string;
  label: string;
  value: string;
  updatedAt: string;
};

export type Submission = {
  id: string;
  kind: "story" | "dog";
  name: string;
  email: string;
  title: string;
  body: string;
  createdAt: string;
  state: "new" | "accepted" | "declined";
};

export type StoreData = {
  issues: Issue[];
  stories: Story[];
  dogs: Dog[];
  gear: GearItem[];
  locals: LocalListing[];
  market: MarketListing[];
  recipes: Recipe[];
  board: BoardItem[];
  conditions: ConditionStat[];
  submissions: Submission[];
};
