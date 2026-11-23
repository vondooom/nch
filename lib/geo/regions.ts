export type Region = {
  slug: string;
  name: string;
  summary: string;
};

/** Region order matches the national structure. State membership lives on each state. */
export const regions: Region[] = [
  {
    slug: "pacific-coast",
    name: "Pacific Coast",
    summary: "California, Oregon, and Washington.",
  },
  {
    slug: "great-basin-desert-southwest",
    name: "Great Basin and Desert Southwest",
    summary: "Nevada, Utah, and Arizona.",
  },
  {
    slug: "rocky-mountains",
    name: "Rocky Mountains",
    summary: "Idaho, Montana, Wyoming, Colorado, and New Mexico.",
  },
  {
    slug: "northern-plains",
    name: "Northern Plains",
    summary: "North Dakota, South Dakota, Nebraska, and Kansas.",
  },
  {
    slug: "southern-plains",
    name: "Southern Plains",
    summary: "Texas and Oklahoma.",
  },
  {
    slug: "upper-midwest-great-lakes",
    name: "Upper Midwest and Great Lakes",
    summary: "Minnesota, Wisconsin, Michigan, Iowa, Illinois, Indiana, and Ohio.",
  },
  {
    slug: "mid-south-delta",
    name: "Mid-South and Delta",
    summary: "Missouri, Arkansas, Louisiana, Mississippi, Tennessee, Kentucky, and Alabama.",
  },
  {
    slug: "southeast",
    name: "Southeast",
    summary: "Florida, Georgia, South Carolina, and North Carolina.",
  },
  {
    slug: "mid-atlantic",
    name: "Mid-Atlantic",
    summary: "Virginia, West Virginia, Maryland, Delaware, Pennsylvania, New Jersey, and New York.",
  },
  {
    slug: "new-england",
    name: "New England",
    summary: "Maine, New Hampshire, Vermont, Massachusetts, Rhode Island, and Connecticut.",
  },
  {
    slug: "alaska",
    name: "Alaska",
    summary: "Alaska, on its own.",
  },
  {
    slug: "hawaii",
    name: "Hawaii",
    summary: "Hawaii, on its own.",
  },
];

export function findRegion(slug: string) {
  return regions.find((region) => region.slug === slug);
}
