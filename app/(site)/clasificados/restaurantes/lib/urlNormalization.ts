/**
 * URL and actionable text normalization utilities for Restaurantes CTAs
 */

/**
 * Check if a string looks like a URL
 */
export function isProbablyUrl(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('http://') || 
         trimmed.startsWith('https://') || 
         trimmed.startsWith('www.') ||
         trimmed.includes('://') ||
         /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
}

/**
 * Check if a string looks like address/location text
 */
export function isProbablyAddressLikeText(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  
  // Common address indicators
  const addressIndicators = [
    'calle', 'avenida', 'boulevard', 'carretera', 'camino',
    'colonia', 'barrio', 'zona', 'sector', 'manzana',
    'esquina', 'número', '#', 'y', 'entre', 's/n', 'local',
    'edif', 'piso', 'apartamento', 'oficina', 'centro',
    'norte', 'sur', 'este', 'oeste'
  ];
  
  const hasAddressWords = addressIndicators.some(indicator => 
    trimmed.toLowerCase().includes(indicator)
  );
  
  // Contains numbers and street-like patterns
  const hasNumbersAndStreet = /\d/.test(trimmed) && 
    (trimmed.includes('calle') || trimmed.includes('avenida') || 
     trimmed.includes('boulevard') || trimmed.includes('carretera'));
  
  return hasAddressWords || hasNumbersAndStreet;
}

/**
 * Normalize URL-like values to absolute URLs
 */
export function normalizeUrlLikeValue(value: string): string | null {
  if (!value || typeof value !== 'string') return null;
  
  const trimmed = value.trim();
  
  // Already a full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      return url.toString();
    } catch {
      return trimmed; // Return as-is if invalid URL
    }
  }
  
  // Starts with www. - normalize to https://www.
  if (trimmed.startsWith('www.')) {
    return `https://www.${trimmed.substring(4)}`;
  }
  
  // Not URL-like - return null for address handling
  return null;
}

/**
 * Generate Google Maps search URL for address-like text
 */
export function buildGoogleMapsSearchHref(address: string): string {
  const encoded = encodeURIComponent(address.trim());
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/**
 * Main normalization function for actionable text values
 */
export function normalizeActionableUrl(value: string): string | null {
  // First try to normalize as URL
  const urlResult = normalizeUrlLikeValue(value);
  if (urlResult) {
    return urlResult;
  }
  
  // If not URL-like but looks like address, generate Google Maps link
  if (isProbablyAddressLikeText(value)) {
    return buildGoogleMapsSearchHref(value);
  }
  
  // Not actionable - return null
  return null;
}
