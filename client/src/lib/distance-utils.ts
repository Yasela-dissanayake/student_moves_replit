/**
 * Utilities for calculating and formatting distances, extracting location information,
 * and finding nearby items for the marketplace feature.
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface MarketplaceItem {
  id: number;
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  images?: string[];
  tags?: string[];
  [key: string]: any;
}

interface SimilarItemOptions {
  maxDistance?: number;  // Maximum distance in km
  maxItems?: number;     // Maximum number of similar items to return
  includeSameCategory?: boolean; // Whether to prioritize items of the same category
  includeSimilarCondition?: boolean; // Whether to prioritize items of similar condition
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first coordinate
 * @param lon1 Longitude of first coordinate
 * @param lat2 Latitude of second coordinate
 * @param lon2 Longitude of second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Format a distance for display
 * @param distance Distance in kilometers
 * @param precision Number of decimal places
 * @returns Formatted string with appropriate unit (km or m)
 */
export function formatDistance(distance: number, precision: number = 1): string {
  if (distance < 0.1) {
    // Convert to meters for very short distances
    const meters = Math.round(distance * 1000);
    return `${meters}m`;
  } else if (distance < 1) {
    // Show more precision for distances less than 1km
    return `${distance.toFixed(2)}km`;
  } else {
    return `${distance.toFixed(precision)}km`;
  }
}

/**
 * Check if a location is nearby another location based on a radius
 * @param lat1 Latitude of first coordinate
 * @param lon1 Longitude of first coordinate
 * @param lat2 Latitude of second coordinate
 * @param lon2 Longitude of second coordinate
 * @param radiusKm Maximum distance in kilometers to be considered "nearby"
 * @returns Boolean indicating if the locations are within the specified radius
 */
export function isNearby(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  radiusKm: number
): boolean {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
}

/**
 * Utility to find similar items nearby based on location and category
 * @param currentItem The current item
 * @param allItems Array of all marketplace items
 * @param options Configuration options
 * @returns Array of similar items sorted by relevance and distance
 */
export function findSimilarItemsNearby(
  currentItem: MarketplaceItem,
  allItems: MarketplaceItem[],
  options: SimilarItemOptions = {}
): MarketplaceItem[] {
  const {
    maxDistance = 10, // Default 10 km radius
    maxItems = 5,     // Default 5 items
    includeSameCategory = true,
    includeSimilarCondition = true
  } = options;
  
  // Skip if current item doesn't have coordinates
  if (!currentItem.latitude || !currentItem.longitude) {
    return [];
  }
  
  const currentLat = parseFloat(currentItem.latitude);
  const currentLng = parseFloat(currentItem.longitude);
  
  // Filter and score items
  const scoredItems = allItems
    .filter(item => 
      // Exclude the current item and items without coordinates
      item.id !== currentItem.id && 
      item.latitude && 
      item.longitude
    )
    .map(item => {
      const itemLat = parseFloat(item.latitude!);
      const itemLng = parseFloat(item.longitude!);
      
      const distance = calculateDistance(currentLat, currentLng, itemLat, itemLng);
      
      if (distance > maxDistance) {
        return null; // Skip items that are too far away
      }
      
      // Calculate a relevance score (lower is better)
      let relevanceScore = distance; // Start with distance as the base score
      
      // Adjust score based on category match
      if (includeSameCategory && item.category === currentItem.category) {
        relevanceScore -= 1; // Boost items in the same category
      }
      
      // Adjust score based on condition match
      if (includeSimilarCondition && item.condition === currentItem.condition) {
        relevanceScore -= 0.5; // Boost items in similar condition
      }
      
      return {
        item,
        distance,
        relevanceScore
      };
    })
    .filter(Boolean) // Remove null entries
    .sort((a, b) => a!.relevanceScore - b!.relevanceScore) // Sort by relevance score
    .slice(0, maxItems); // Limit to specified number of items
  
  return scoredItems.map(entry => entry!.item);
}

/**
 * Extract coordinates from a location string
 * @param locationString Location string potentially containing coordinates
 * @returns Coordinates object or null if not found
 */
export function extractCoordinates(locationString: string): { lat: number, lng: number } | null {
  // Check for coordinates pattern like "51.5074° N, 0.1278° W" or "51.5074, -0.1278"
  const regex = /(-?\d+\.?\d*)[°\s]*[NS]?,\s*(-?\d+\.?\d*)[°\s]*[WE]?/i;
  const match = locationString.match(regex);
  
  if (match && match.length >= 3) {
    const lat = parseFloat(match[1]);
    let lng = parseFloat(match[2]);
    
    // Adjust for direction if present
    if (locationString.includes('S')) lat * -1;
    if (locationString.includes('W')) lng * -1;
    
    return { lat, lng };
  }
  
  return null;
}

/**
 * Format a location string for display
 * @param locationString Full location string (may include coordinates)
 * @returns Formatted location string without coordinates
 */
export function formatLocation(locationString: string): string {
  // Remove any coordinates from the location string
  return locationString
    .replace(/\s*\(\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*\)\s*/g, '') // Remove (lat, lng) format
    .replace(/\s*-?\d+\.?\d*[°\s]*[NS]?,\s*-?\d+\.?\d*[°\s]*[WE]?\s*/gi, '') // Remove lat/lng with directions
    .replace(/\s{2,}/g, ' ') // Replace multiple spaces with a single space
    .trim();
}

/**
 * Get the distance between two items
 * @param item1 First marketplace item
 * @param item2 Second marketplace item
 * @returns Distance in kilometers or null if coordinates cannot be determined
 */
export function getDistanceBetweenItems(
  item1: MarketplaceItem,
  item2: MarketplaceItem
): number | null {
  if (!item1.latitude || !item1.longitude || !item2.latitude || !item2.longitude) {
    return null;
  }
  
  const lat1 = parseFloat(item1.latitude);
  const lng1 = parseFloat(item1.longitude);
  const lat2 = parseFloat(item2.latitude);
  const lng2 = parseFloat(item2.longitude);
  
  return calculateDistance(lat1, lng1, lat2, lng2);
}