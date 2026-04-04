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
