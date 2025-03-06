import { storage } from '../storage';
import { db } from '../db';
import { facilities } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Extract domain from a website URL
 * @param websiteUrl The full website URL
 * @returns The domain without protocol and www prefix
 */
function extractDomain(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null;
  
  try {
    // Try to parse as a URL
    let urlObj: URL;
    
    if (websiteUrl.startsWith('http')) {
      urlObj = new URL(websiteUrl);
    } else {
      urlObj = new URL(`https://${websiteUrl}`);
    }
    
    let domain = urlObj.hostname;
    
    // Remove www. prefix if present
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch (error) {
    // If standard URL parsing fails, try regex extraction
    const domainMatch = websiteUrl.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
    return domainMatch ? domainMatch[1] : null;
  }
}

/**
 * Generate a Clearbit logo URL for a given website domain
 * @param websiteUrl The facility's website URL
 * @returns A URL to the company's logo via Clearbit
 */
function getClearbitLogoUrl(websiteUrl: string | null): string | null {
  const domain = extractDomain(websiteUrl);
  if (!domain) return null;
  
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * Update all facilities in the database with Clearbit logo URLs
 * based on their website domains
 */
async function updateFacilityLogos() {
  console.log('Starting facility logo update process...');
  
  // Get all facilities from the database
  const allFacilities = await storage.getFacilities();
  console.log(`Found ${allFacilities.length} total facilities in database`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let noWebsiteCount = 0;
  
  // Process each facility
  for (const facility of allFacilities) {
    // Skip facilities that already have a logo
    if (facility.logo) {
      console.log(`Skipping facility ID ${facility.id}: "${facility.name}" - already has logo URL`);
      skippedCount++;
      continue;
    }
    
    // Skip facilities without a website
    if (!facility.website) {
      console.log(`Skipping facility ID ${facility.id}: "${facility.name}" - no website URL available`);
      noWebsiteCount++;
      continue;
    }
    
    // Generate Clearbit logo URL
    const logoUrl = getClearbitLogoUrl(facility.website);
    
    if (logoUrl) {
      console.log(`Updating facility ID ${facility.id}: "${facility.name}" with logo URL: ${logoUrl}`);
      
      // Update the facility with the logo URL
      await db.update(facilities)
        .set({ logo: logoUrl })
        .where(eq(facilities.id, facility.id));
      
      updatedCount++;
    } else {
      console.log(`Could not generate logo URL for facility ID ${facility.id}: "${facility.name}" with website: ${facility.website}`);
      noWebsiteCount++;
    }
  }
  
  console.log('\n=== Logo Update Summary ===');
  console.log(`Total facilities: ${allFacilities.length}`);
  console.log(`Facilities updated with logo URLs: ${updatedCount}`);
  console.log(`Facilities skipped (already had logo): ${skippedCount}`);
  console.log(`Facilities without valid website URL: ${noWebsiteCount}`);
  console.log('============================');
}

// Run the logo update function
updateFacilityLogos()
  .then(() => {
    console.log('Logo update process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during logo update process:', error);
    process.exit(1);
  });
