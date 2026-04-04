export type Region =
  | 'Russian River Valley'
  | 'Dry Creek Valley'
  | 'Sonoma Valley'
  | 'Alexander Valley'
  | 'Carneros'
  | 'Sonoma Coast';

export type ReservationType = 'walk_ins_welcome' | 'reservations_recommended' | 'appointment_only';

export type NoiseLevel = 'quiet' | 'moderate' | 'lively';

export type FlightFormat = 'seated' | 'standing' | 'picnic' | 'outdoor' | 'tour' | 'bar';

export type Setting = 'vineyard' | 'estate' | 'downtown' | 'hilltop' | 'cave';

export type BudgetBand = '$' | '$$' | '$$$' | '$$$$';

export type Vibe =
  | 'Relaxed & Scenic'
  | 'Educational'
  | 'Celebratory'
  | 'Adventurous'
  | 'Social & Lively';

export type Varietal =
  | 'Pinot Noir'
  | 'Chardonnay'
  | 'Cabernet Sauvignon'
  | 'Zinfandel'
  | 'Sparkling'
  | 'Rosé'
  | 'Sauvignon Blanc'
  | 'Merlot'
  | 'Syrah';

export type DayHours = {
  open: string;
  close: string;
} | null;

export type WeeklyHours = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};

export type Flight = {
  id: string;
  wineryId: string;
  name: string;
  price: number;
  durationMinutes: number;
  winesIncluded: number;
  format: FlightFormat;
  hasFoodPairing: boolean;
  description: string;
};

export type StyleScores = {
  styleRelaxed: number;
  styleAdventurous: number;
  styleEducational: number;
  styleCelebratory: number;
  styleSocial: number;
};

export type Winery = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  story: string;
  region: Region;
  city: string;
  latitude: number;
  longitude: number;
  setting: Setting | null;
  hours: WeeklyHours;
  reservationType: ReservationType;
  bookingUrl: string;
  groupSizeMax: number | null;
  parking: string;
  varietals: Varietal[];
  signatureVarietals: Varietal[];
  vibes: Vibe[];
  noiseLevel: NoiseLevel;
  styleScores: StyleScores;
  minFlightPrice: number;
  maxFlightPrice: number;
  flights: Flight[];
  isDogFriendly: boolean;
  isKidFriendly: boolean;
  isWheelchairAccessible: boolean;
  hasFoodPairing: boolean;
  hasOutdoorSeating: boolean;
  hasViews: boolean;
  isMembersOnly: boolean;
  averageRating: number | null;
  ratingsCount: number | null;
  qualityScore: number | null;
  popularityScore: number | null;
  ratingGoogle: number | null;
};

export type MustHaves = {
  views: boolean;
  foodPairing: boolean;
  outdoorSeating: boolean;
  dogFriendly: boolean;
  kidFriendly: boolean;
  wheelchairAccessible: boolean;
};

export type QuizAnswers = {
  selectedVarietals: Varietal[];
  selectedVibes: Vibe[];
  budgetBand: BudgetBand | null;
  mustHaves: MustHaves;
  preferredRegions: Region[];
  numStops: number;
  includeMembersOnly: boolean;
  groupSize: number | null;
};

export type MatchResult = {
  winery: Winery;
  rank: number;
  score: number;
  matchReasons: string[];
};

/**
 * Pre-joined, flat shape consumed by the scoring engine.
 * All fields needed for hard filters + soft scoring in one object —
 * no extra DB queries inside the scoring loop.
 */
export type WineryForMatching = {
  id: string;
  slug: string;
  region: Region;
  reservationType: ReservationType;
  isMembersOnly: boolean;
  groupSizeMax: number | null;

  // Hard filter: varietals (OR logic)
  varietals: Varietal[];

  // Hard filter: budget (minFlightPrice ≤ maxBudget)
  minFlightPrice: number | null;

  // Hard filter: must-haves
  isDogFriendly: boolean;
  isKidFriendly: boolean;
  isWheelchairAccessible: boolean;
  hasFoodPairing: boolean;
  hasOutdoorSeating: boolean;
  hasViews: boolean;

  // Soft scoring: style match (§4.1)
  styleScores: StyleScores;

  // Soft scoring: rating blend (§4.4)
  qualityScore: number | null;
  popularityScore: number | null;
  ratingGoogle: number | null;
};

/**
 * Everything the UI needs to render a winery across all pages
 * (cards, detail, plan stops, map markers). Excludes scoring-only
 * fields like styleScores and qualityScore/popularityScore/ratingGoogle.
 */
export type WineryForDisplay = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  story: string;
  region: Region;
  city: string;
  latitude: number;
  longitude: number;
  setting: Setting | null;
  hours: WeeklyHours;
  reservationType: ReservationType;
  bookingUrl: string;
  groupSizeMax: number | null;
  parking: string;
  noiseLevel: NoiseLevel;
  varietals: Varietal[];
  signatureVarietals: Varietal[];
  minFlightPrice: number;
  maxFlightPrice: number;
  flights: Flight[];
  averageRating: number | null;
  ratingsCount: number | null;

  // Experience flags (displayed as badges/amenities)
  isDogFriendly: boolean;
  isKidFriendly: boolean;
  isWheelchairAccessible: boolean;
  hasFoodPairing: boolean;
  hasOutdoorSeating: boolean;
  hasViews: boolean;
  isMembersOnly: boolean;
};
