export type SeasonPeriod = {
  /** Inclusive open date, YYYY-MM-DD. Null when the agency prints a schedule in note instead of dates. */
  open: string | null;
  /** Inclusive close date, YYYY-MM-DD. Null when open is null. */
  close: string | null;
  /** Null when the source row has no period note. */
  note: string | null;
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
  /** Null when the agency source did not print a bag limit for this row. */
  bagLimit: string | null;
  /** Null when the agency source did not print a possession limit for this row. */
  possessionLimit: string | null;
  agency: string;
  sourceTitle: string;
  sourceUrl: string;
  /** Verbatim text from the agency page or booklet. */
  sourceQuote: string;
  /** ISO date (YYYY-MM-DD) the quote was checked. */
  checkedDate: string;
  /** Null when the source row has no extra note. */
  notes: string | null;
};
