/**
 * Utility functions for working with Clearbit logo API
 */

/**
 * Extract domain from a website URL
 * @param websiteUrl The full website URL
 * @returns The domain without protocol and www prefix
 */
export function extractDomain(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null;
  
  try {
    // Parse the URL to extract domain
    const url = new URL(websiteUrl);
    let domain = url.hostname;
    
    // Remove www. prefix if present
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch (error) {
    // Handle invalid URLs by attempting to extract domain directly
    // This handles cases where the protocol is missing
    try {
      // If no protocol, try adding one and parsing again
      if (!websiteUrl.startsWith('http')) {
        return extractDomain(`https://${websiteUrl}`);
      }
      
      // If we still can't parse, try a regex approach
      const domainMatch = websiteUrl.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
      return domainMatch ? domainMatch[1] : null;
    } catch {
      console.error(`Could not extract domain from URL: ${websiteUrl}`);
      return null;
    }
  }
}

/**
 * Generate a Clearbit logo URL for a given website domain
 * @param websiteUrl The facility's website URL
 * @returns A URL to the company's logo via Clearbit
 */
export function getClearbitLogoUrl(websiteUrl: string | null): string | null {
  const domain = extractDomain(websiteUrl);
  if (!domain) return null;
  
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * Get the appropriate logo URL for a facility
 * If the facility has a stored logo URL, use that
 * Otherwise, generate one from the website domain
 * @param facility Facility with potential logo and website fields
 * @returns The best available logo URL or null
 */
export function getFacilityLogoUrl(facility: { 
  logo?: string | null, 
  website?: string | null 
}): string | null {
  // If facility has a stored logo URL, use it
  if (facility.logo) return facility.logo;
  
  // Otherwise try to generate one from the website
  if (facility.website) {
    return getClearbitLogoUrl(facility.website);
  }
  
  return null;
}
