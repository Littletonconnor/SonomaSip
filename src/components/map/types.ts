export type MapItem = {
  id: string;
  latitude: number;
  longitude: number;
  rank?: number;
  label: string;
  region: string;
  slug: string;
  priceRange?: string;
  rating?: number | null;
  bookingUrl?: string;
};
