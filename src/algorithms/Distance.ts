/**
 * Distance.ts
 * Geographic Distance Calculations
 *
 * Haversine Formula:
 * ------------------
 * Calculates the great-circle distance between two points on the Earth's surface
 * given their latitude and longitude in decimal degrees.
 *
 * This gives the straight-line geographic distance (as-the-crow-flies).
 * For actual road distances, we prefer the road segment length from OSM data.
 *
 * Formula:
 *   a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
 *   c = 2 × atan2(√a, √(1−a))
 *   d = R × c
 *
 * Where R = Earth's radius ≈ 6371 km
 */

const EARTH_RADIUS_METERS = 6371000; // Earth's mean radius in meters

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the Haversine distance between two geographic coordinates.
 * Returns distance in METERS.
 *
 * @param lat1 Latitude of point 1 (decimal degrees)
 * @param lon1 Longitude of point 1 (decimal degrees)
 * @param lat2 Latitude of point 2 (decimal degrees)
 * @param lon2 Longitude of point 2 (decimal degrees)
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate the bounding box that encompasses two coordinate pairs
 * Used to form Overpass API queries
 */
export function getBoundingBox(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  paddingFactor: number = 0.2
): { south: number; west: number; north: number; east: number } {
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);
  const minLon = Math.min(lon1, lon2);
  const maxLon = Math.max(lon1, lon2);

  const latPad = Math.max((maxLat - minLat) * paddingFactor, 0.005);
  const lonPad = Math.max((maxLon - minLon) * paddingFactor, 0.005);

  return {
    south: minLat - latPad,
    west: minLon - lonPad,
    north: maxLat + latPad,
    east: maxLon + lonPad,
  };
}

/**
 * Calculate approximate travel time given distance and speed
 * @param distanceMeters Distance in meters
 * @param speedKmh Speed in km/h (default: 50 for urban roads)
 * @returns Time in seconds
 */
export function estimateTravelTime(distanceMeters: number, speedKmh: number = 50): number {
  const speedMs = speedKmh / 3.6;
  return distanceMeters / speedMs;
}

/**
 * Format seconds into human-readable string
 */
export function formatTravelTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}
