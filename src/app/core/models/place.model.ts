export interface PlaceCategory {
  id: number;
  name: string;
  icon: { prefix: string; suffix: string };
}

export interface PlaceLocation {
  address?: string;
  locality?: string;
  region?: string;
  country?: string;
  formatted_address?: string;
}

export interface Place {
  fsq_place_id: string;
  name: string;
  categories: PlaceCategory[];
  location: PlaceLocation;
  distance?: number;
  geocodes?: {
    main: { latitude: number; longitude: number };
  };
}

export interface PlaceDetails extends Place {
  rating?: number;
  price?: number;
  hours?: { display?: string; open_now?: boolean };
  tel?: string;
  website?: string;
  description?: string;
}

export interface Photo {
  id: string;
  prefix: string;
  suffix: string;
  width: number;
  height: number;
}

export interface Tip {
  id: string;
  text: string;
  created_at: string;
}

export interface WishlistItem {
  place: Place;
  addedAt: number;
}
