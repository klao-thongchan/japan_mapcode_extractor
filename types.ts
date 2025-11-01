
export type Candidate = {
  raw: string;
  main_name: string;
  hint_city?: string;
  position: number;
};

export type GooglePlaceCandidate = {
  place_id: string;
  name: string;
  address: string;
};

export type RowStatus = 'pending' | 'enriching' | 'error' | 'review' | 'complete' | 'disambiguation';

export type ManualOverrides = Partial<Pick<Row, 'mapcode' | 'telephone' | 'address'>>;

export type Row = {
  id: string; // A unique ID for the row, e.g., from candidate position
  candidate: Candidate;
  status: RowStatus;
  statusMessage?: string;
  
  // Enriched data
  place_id?: string;
  place_name_en?: string;
  place_name_ja?: string;
  display_name?: string;
  mapcode?: string | null;
  telephone?: string | null;
  address?: string;
  
  // Data for disambiguation
  googleCandidates?: GooglePlaceCandidate[];

  manual_overrides: ManualOverrides;
  isInvalidMapcode?: boolean;
};

export type EnrichedDetails = {
  place_name_en: string;
  place_name_ja: string;
  mapcode: string;
  telephone: string;
  address: string;
  error?: string;
};
