export type Region =
  | 'Russian River Valley'
  | 'Dry Creek Valley'
  | 'Sonoma Valley'
  | 'Alexander Valley'
  | 'Carneros';

export type ReservationType = 'walk-in' | 'appointment' | 'members-only';

export type NoiseLevel = 'quiet' | 'moderate' | 'lively';

export type FlightFormat = 'seated' | 'standing' | 'picnic' | 'outdoor';

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
  hours: WeeklyHours;
  reservationType: ReservationType;
  bookingUrl: string;
  groupSizeMax: number | null;
  parking: string;
  varietals: Varietal[];
  primaryVarietal: Varietal;
  vibes: Vibe[];
  noiseLevel: NoiseLevel;
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
