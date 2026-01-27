import type { DetectedLocation } from '../types/locations';

// Counter for generating unique IDs within a single detection run
let idCounter = 0;

/**
 * Generate a unique ID for a location based on its content and context
 */
function generateLocationId(
  type: 'maps_link' | 'address' | 'coordinates',
  content: string,
  coordinates?: { lat: number; lng: number },
  messageId?: string,
  index?: number
): string {
  idCounter++;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  
  // Include original coordinates in ID if available to ensure uniqueness
  const coordHash = coordinates 
    ? `${coordinates.lat.toFixed(6)}-${coordinates.lng.toFixed(6)}`
    : '';
  
  // Include message ID and index if available
  const context = messageId ? `-msg${messageId}-idx${index ?? idCounter}` : `-idx${idCounter}`;
  
  // Create a hash of the content for uniqueness
  const contentHash = content.substring(0, 20).replace(/\s+/g, '-').toLowerCase();
  
  return `${type}-${contentHash}-${coordHash}${context}-${timestamp}-${random}`;
}

/**
 * Detect Google Maps links in text
 * Examples:
 * - https://www.google.com/maps/place/37.7749,-122.4194
 * - https://maps.google.com/?q=37.7749,-122.4194
 */
export function detectMapsLinks(text: string, messageId?: string): DetectedLocation[] {
  const locations: DetectedLocation[] = [];
  
  // Pattern for Google Maps URLs (standard only, no shortened links)
  const mapsUrlPattern = /https?:\/\/(www\.|maps\.)?google\.(com|maps)[^\s]*/gi;
  
  // Find standard Google Maps URLs
  const standardMatches = text.match(mapsUrlPattern);
  if (standardMatches) {
    standardMatches.forEach((url, index) => {
      // Try to extract coordinates from URL
      const coordMatch = url.match(/[@=](-?\d+\.?\d*),(-?\d+\.?\d*)/);
      
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        
        if (isValidCoordinate(lat, lng)) {
          locations.push({
            id: generateLocationId('maps_link', url, { lat, lng }, messageId, index),
            text: url,
            type: 'maps_link',
            coordinates: { lat, lng },
          });
        }
      } else {
        // URL without direct coordinates
        locations.push({
          id: generateLocationId('maps_link', url, undefined, messageId, index),
          text: url,
          type: 'maps_link',
        });
      }
    });
  }
  
  return locations;
}

/**
 * Detect lat,lng coordinates in text
 * Examples:
 * - 37.7749, -122.4194
 * - 37.7749,-122.4194
 * - Lat: 37.7749, Lng: -122.4194
 */
export function detectCoordinates(text: string, messageId?: string): DetectedLocation[] {
  const locations: DetectedLocation[] = [];
  
  // Pattern for coordinate pairs with optional Lat/Lng labels
  // Supports both integer and decimal coordinates (e.g., "10,10" or "37.7749,-122.4194")
  const coordPattern = /(?:lat[itude]*\s*[:=]\s*)?(-?\d+(?:\.\d+)?)\s*,\s*(?:lng|lon[gitude]*\s*[:=]\s*)?(-?\d+(?:\.\d+)?)/gi;
  let match;
  let matchIndex = 0;
  
  while ((match = coordPattern.exec(text)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    
    // Validate coordinates (supports both integer and decimal coordinates)
    if (isValidCoordinate(lat, lng)) {
      console.log(`    🔍 Detected coordinate pair: ${lat}, ${lng}`);
      locations.push({
        id: generateLocationId('coordinates', match[0], { lat, lng }, messageId, matchIndex),
        text: match[0],
        type: 'coordinates',
        coordinates: { lat, lng },
      });
      matchIndex++;
    }
  }
  
  return locations;
}

// ================================
// Locale configuration
// ================================

interface LocaleConfig {
  streetClassifiers: string[];
  unitMarkers: string[];
  postalCodes: RegExp[];
}

const LOCALES: Record<string, LocaleConfig> = {
  en: {
    streetClassifiers: [
      "street", "st",
      "avenue", "ave",
      "road", "rd",
      "boulevard", "blvd",
      "drive", "dr",
      "lane", "ln",
      "way", "court", "ct",
      "parkway", "pkwy"
    ],
    unitMarkers: ["apt", "apartment", "suite", "ste", "unit", "#"],
    postalCodes: [
      /\b\d{5}(-\d{4})?\b/ // US
    ]
  },

  es: {
    streetClassifiers: [
      "calle", "c",
      "avenida", "av",
      "pasaje", "pje",
      "camino", "km"
    ],
    unitMarkers: ["depto", "departamento", "piso", "oficina", "#"],
    postalCodes: [
      /\b\d{7}\b/ // Chile
    ]
  },

  fr: {
    streetClassifiers: ["rue", "avenue", "boulevard"],
    unitMarkers: ["apt", "appartement"],
    postalCodes: [
      /\b\d{5}\b/
    ]
  }
};

// ================================
// Generic helpers (language-agnostic)
// ================================

function hasHouseNumber(text: string): boolean {
  return /\b\d{1,5}\b/.test(text);
}

function hasStreetClassifier(text: string, locale: LocaleConfig): boolean {
  const r = new RegExp(
    `\\b(${locale.streetClassifiers.join("|")})\\b`,
    "i"
  );
  return r.test(text);
}

function hasUnitMarker(text: string, locale: LocaleConfig): boolean {
  const r = new RegExp(
    `\\b(${locale.unitMarkers.join("|")})\\b`,
    "i"
  );
  return r.test(text);
}

function hasPostalCode(text: string, locale: LocaleConfig): boolean {
  return locale.postalCodes.some(r => r.test(text));
}

function looksLikePlaceName(text: string): boolean {
  // capitalized words sequence (works across Latin languages)
  return /\b[A-ZÁÉÍÓÚÑÄÖÜ][\wÁÉÍÓÚÑäöü]+(?:\s+[A-ZÁÉÍÓÚÑÄÖÜ][\wÁÉÍÓÚÑäöü]+)+\b/.test(text);
}

// ================================
// Scoring model
// ================================

function scoreAddress(candidate: string, locale: LocaleConfig): number {
  let score = 0;

  if (hasHouseNumber(candidate)) score += 2;
  if (hasStreetClassifier(candidate, locale)) score += 3;
  if (hasPostalCode(candidate, locale)) score += 3;
  if (hasUnitMarker(candidate, locale)) score += 1;
  if (looksLikePlaceName(candidate)) score += 1;

  return score;
}

// ================================
// Candidate extraction (agnostic)
// ================================

function extractCandidates(text: string): string[] {
  return text.match(
    /\b[\wÁÉÍÓÚÑäöü.,#-]{3,80}\d{1,5}[\wÁÉÍÓÚÑäöü\s.,#-]{5,80}\b/g
  ) || [];
}

// ================================
// Address detection with locale support
// ================================

/**
 * Detect addresses in text using locale-aware scoring
 * Examples:
 * - "Enviar a Calle San Martín 123, Santiago 7500000"
 * - "1600 Amphitheatre Parkway, Mountain View CA 94043"
 * - Also supports explicit ADDRESS: or DIRECTION: prefix
 */
export function detectAddresses(text: string, localeKey: string = "en", messageId?: string): DetectedLocation[] {
  const locations: DetectedLocation[] = [];
  
  const locale = LOCALES[localeKey];
  if (!locale) {
    console.warn(`    ⚠️  Unsupported locale: ${localeKey}, falling back to 'en'`);
    return detectAddresses(text, "en", messageId);
  }

  // First, check for explicit ADDRESS: or DIRECTION: prefix (keep backward compatibility)
  const explicitAddressPattern = /(?:ADDRESS|DIRECTION):\s*([^\n\r]+)/gi;
  let match;
  let explicitIndex = 0;
  while ((match = explicitAddressPattern.exec(text)) !== null) {
    const address = match[1].trim();
    
    console.log(`    🔍 Explicit address pattern match found: "${match[0]}" -> extracted: "${address}"`);
    
    if (address && address.length > 2) {
      locations.push({
        id: generateLocationId('address', address, undefined, messageId, explicitIndex),
        text: match[0],
        type: 'address',
        address: address,
      });
      console.log(`    ✅ Added explicit address location: "${address}"`);
      explicitIndex++;
    }
  }

  // Hard negatives - skip if contains URLs or emails
  if (/https?:\/\//i.test(text)) return locations;
  if (/\S+@\S+\.\S+/.test(text)) return locations;

  // Extract and score candidates
  const candidates = extractCandidates(text)
    .map(c => c.trim())
    .filter(c => {
      // Filter out candidates that are too short or were already captured as explicit addresses
      if (c.length < 5) return false;
      
      // Skip if this candidate is already in locations (from explicit pattern)
      const isAlreadyCaptured = locations.some(loc => 
        loc.address && c.includes(loc.address) || loc.address?.includes(c)
      );
      if (isAlreadyCaptured) return false;
      
      return scoreAddress(c, locale) >= 4;
    });

  // Add detected addresses
  let candidateIndex = explicitIndex;
  candidates.forEach((candidate) => {
    console.log(`    🔍 Detected address candidate: "${candidate}"`);
    locations.push({
      id: generateLocationId('address', candidate, undefined, messageId, candidateIndex),
      text: candidate,
      type: 'address',
      address: candidate,
    });
    console.log(`    ✅ Added address location: "${candidate}"`);
    candidateIndex++;
  });

  return locations;
}

/**
 * Validate if coordinates are within valid ranges
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Main function to detect all types of locations in text
 */
export function detectAllLocations(
  text: string,
  messageId?: string,
  timestamp?: string,
  author?: string
): DetectedLocation[] {
  // Reset counter for each detection run to ensure uniqueness within a message
  idCounter = 0;
  
  const mapsLinks = detectMapsLinks(text, messageId);
  const coordinates = detectCoordinates(text, messageId);
  const addresses = detectAddresses(text, "en", messageId);
  
  // Log detections
  if (mapsLinks.length > 0) {
    console.log(`  📍 Found ${mapsLinks.length} maps link(s) from ${author || 'Unknown'}:`);
    mapsLinks.forEach((l, i) => {
      console.log(`      [${i + 1}] ${l.text} (ID: ${l.id})`);
      if (l.coordinates) {
        console.log(`          → Coords: ${l.coordinates.lat}, ${l.coordinates.lng}`);
      }
    });
  }
  if (coordinates.length > 0) {
    console.log(`  📍 Found ${coordinates.length} coordinate(s) from ${author || 'Unknown'}:`);
    coordinates.forEach((l, i) => {
      console.log(`      [${i + 1}] ${l.text} (ID: ${l.id})`);
      if (l.coordinates) {
        console.log(`          → Coords: ${l.coordinates.lat}, ${l.coordinates.lng}`);
      }
    });
  }
  if (addresses.length > 0) {
    console.log(`  📍 Found ${addresses.length} address(es) from ${author || 'Unknown'}:`);
    addresses.forEach((l, i) => {
      console.log(`      [${i + 1}] ${l.text} → ${l.address} (ID: ${l.id})`);
    });
  }
  
  // Combine all and add metadata
  const allLocations = [...mapsLinks, ...coordinates, ...addresses].map(loc => ({
    ...loc,
    messageId,
    timestamp,
    author,
  }));
  
  return allLocations;
}

/**
 * Geocode an address to coordinates using Nominatim (OpenStreetMap)
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    console.log(`    🌍 Geocoding address: "${address}"`);
    // Use Nominatim geocoding API (free, no API key required)
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    console.log(`    📡 Requesting: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FrontMapsApp/1.0', // Required by Nominatim
      },
    });
    
    if (!response.ok) {
      console.warn(`    ⚠️  Geocoding request failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`    📥 Geocoding response:`, data);
    
    if (data && data.length > 0) {
      const result = data[0];
      const coords = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
      console.log(`    ✅ Geocoded successfully: ${coords.lat}, ${coords.lng} (${result.display_name || 'No name'})`);
      return coords;
    } else {
      console.warn(`    ⚠️  No results found for address: "${address}"`);
      return null;
    }
  } catch (error) {
    console.error(`    ❌ Error geocoding address:`, error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get a human-readable address using Nominatim
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    // Use Nominatim reverse geocoding API (free, no API key required)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FrontMapsApp/1.0', // Required by Nominatim
      },
    });
    
    if (!response.ok) {
      console.log(`    ⚠️  Reverse geocoding request failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      return data.display_name;
    } else {
      console.log(`    ⚠️  No address found for coordinates`);
      return null;
    }
  } catch (error) {
    console.error('    ❌ Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Resolve shortened Google Maps URL to coordinates
 * Strategy: Try to fetch the URL and extract coordinates from the redirected URL
 */
export async function resolveShortenedMapsLink(
  url: string
): Promise<{ lat: number; lng: number; resolvedUrl?: string } | null> {
  try {
    console.log(`    🔗 Attempting to resolve shortened Maps link...`);
    
    // Strategy: Try to fetch and follow redirect
    try {
      console.log(`    📥 Fetching URL with GET request...`);
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
      });
      
      // Get the final URL after redirects
      const finalUrl = response.url;
      console.log(`    ✅ Followed redirect to: ${finalUrl}`);
      
      // Try to extract coordinates from the final URL
      // Pattern: @lat,lng or ?q=lat,lng or /place/name/@lat,lng
      const coordMatch = finalUrl.match(/[@](-?\d+\.?\d+),(-?\d+\.?\d+)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log(`    ✅ Extracted coordinates from URL: ${lat}, ${lng}`);
          return { lat, lng, resolvedUrl: finalUrl };
        }
      }
      
      // Try to get the page content and extract data
      const html = await response.text();
      
      // Try to extract coordinates from HTML meta tags or embedded data
      const metaCoordMatch = html.match(/"center":\{"lat":(-?\d+\.?\d+),"lng":(-?\d+\.?\d+)\}/);
      if (metaCoordMatch) {
        const lat = parseFloat(metaCoordMatch[1]);
        const lng = parseFloat(metaCoordMatch[2]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log(`    ✅ Extracted coordinates from page content: ${lat}, ${lng}`);
          return { lat, lng, resolvedUrl: finalUrl };
        }
      }
      
      // Try to extract place name from URL and geocode it
      const placeMatch = finalUrl.match(/place\/([^/\s@]+)/);
      if (placeMatch) {
        const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        console.log(`    🔍 Found place name in URL: ${placeName}`);
        const coords = await geocodeAddress(placeName);
        if (coords) {
          return { lat: coords.lat, lng: coords.lng, resolvedUrl: finalUrl };
        }
      }
      
      console.log(`    ℹ️  Resolved URL but couldn't extract coordinates, will try geocoding`);
      
    } catch (fetchError) {
      console.log(`    ⚠️  Fetch failed (likely CORS): ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }
    
    // Fallback: Try geocoding the URL as an address
    const coords = await geocodeAddress(url);
    if (coords) {
      return { lat: coords.lat, lng: coords.lng };
    }
    
    return null;
  } catch (error) {
    console.error('    ❌ Error resolving shortened URL:', error);
    return null;
  }
}

/**
 * Extract place from Google Maps URL using Nominatim geocoding
 */
export async function extractPlaceFromMapsUrl(
  url: string,
  _map: any // Leaflet map, not used but kept for compatibility
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Try to extract place name from URL
    const placeNameMatch = url.match(/place\/([^/\s@]+)/);
    
    if (placeNameMatch) {
      const placeName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
      console.log(`    🔍 Found place name in URL: ${placeName}`);
      
      // Geocode the place name using Nominatim
      const coords = await geocodeAddress(placeName);
      if (coords) {
        console.log(`    ✅ Geocoded place name successfully`);
        return coords;
      }
    }
    
    // Try to extract coordinates directly from URL
    const coordMatch = url.match(/[@=](-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log(`    ✅ Extracted coordinates from URL: ${lat}, ${lng}`);
        return { lat, lng };
      }
    }
    
    return null;
  } catch (error) {
    console.error('    ❌ Error extracting place from URL:', error);
    return null;
  }
}
