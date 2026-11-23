export type SeasonPeriod = {
  /** Inclusive open date, YYYY-MM-DD. */
  open: string;
  /** Inclusive close date, YYYY-MM-DD. */
  close: string;
  note: string;
};

/**
 * One season window from a state wildlife agency.
 * A record with an empty sourceUrl or sourceQuote is kept for the next pass and is never shown.
 */
export type SeasonRecord = {
  id: string;
  state: string;
  species: string;
  seasonName: string;
  /** Zone or unit name. Null means statewide. */
  zone: string | null;
  seasonYear: string;
  periods: SeasonPeriod[];
  bagLimit: string;
  possessionLimit: string;
  agency: string;
  sourceTitle: string;
  sourceUrl: string;
  /** Verbatim text from the agency page or booklet. */
  sourceQuote: string;
  /** ISO date (YYYY-MM-DD) the quote was checked. */
  checkedDate: string;
  notes: string;
};
