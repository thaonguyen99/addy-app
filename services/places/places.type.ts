export type PlaceSummary = {
  id: string;
  externalPlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
};

/** Normalized place from GET /places/search (Goong place_id in `placeId`). */
export type PlaceSuggestion = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

/** Full place record from GET /places/resolve. */
export type PlaceRecord = {
  id: string;
  externalPlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
};

export type ReverseGeocodeResult = {
  externalPlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
};

export type PlaceInput = {
  externalPlaceId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types?: string[];
};
