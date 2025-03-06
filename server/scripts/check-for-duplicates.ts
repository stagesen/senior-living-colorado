import { db } from '../db';
import { facilities, resources } from '@shared/schema';
import { storage } from '../storage';

/**
 * This script analyzes the database for potential duplicates based on name similarity
 * It helps identify any remaining duplicates that might need manual review
 */
async function checkForDuplicates() {
  try {
    console.log('Starting duplicate detection analysis...');

    // Get all facilities
    const allFacilities = await storage.getFacilities();
    console.log(`Analyzing ${allFacilities.length} facilities for duplicates...`);

    // Group facilities by name (normalized to lowercase)
    const facilityGroups = new Map<string, typeof allFacilities>();
    
    // Count of unique Google Place IDs
    const uniqueExternalIds = new Set<string>();
    let facilitiesWithExternalId = 0;

    // Build groups by lowercase name
    for (const facility of allFacilities) {
      if (!facility.name) continue;
      
      // Track external ID statistics
      if (facility.external_id) {
        uniqueExternalIds.add(facility.external_id);
        facilitiesWithExternalId++;
      }
      
      const normalizedName = facility.name.toLowerCase().trim();
      if (!facilityGroups.has(normalizedName)) {
        facilityGroups.set(normalizedName, []);
      }
      facilityGroups.get(normalizedName)!.push(facility);
    }

    // Print external ID statistics
    console.log(`\nExternal ID statistics:`);
    console.log(`- ${facilitiesWithExternalId} out of ${allFacilities.length} facilities have external_id (${((facilitiesWithExternalId / allFacilities.length) * 100).toFixed(1)}%)`);
    console.log(`- ${uniqueExternalIds.size} unique external IDs found`);
    
    // Find groups with more than one facility (potential duplicates)
    let potentialDuplicateCount = 0;
    
    console.log('\nPotential duplicate groups:');
    for (const [normalizedName, group] of facilityGroups.entries()) {
      if (group.length > 1) {
        potentialDuplicateCount += group.length - 1; // Count all but one as duplicates
        console.log(`\nPotential duplicate group: "${normalizedName}" (${group.length} facilities)`);
        
        // Print details for each facility in the group
        for (const facility of group) {
          console.log(`  ID ${facility.id}: "${facility.name}" at "${facility.address}" (external_id: ${facility.external_id || 'none'})`);
        }
      }
    }

    console.log(`\nAnalysis complete. Found ${potentialDuplicateCount} potential duplicate facilities.`);
    console.log(`Total unique facility names: ${facilityGroups.size}`);
    console.log(`Total facilities: ${allFacilities.length}`);
    
    // Check resources as well
    const allResources = await storage.getResources();
    console.log(`\nAlso found ${allResources.length} resources in the database.`);
    
    // Check for resources with external_id
    const resourcesWithExternalId = allResources.filter(r => r.external_id).length;
    console.log(`- ${resourcesWithExternalId} out of ${allResources.length} resources have external_id (${((resourcesWithExternalId / Math.max(allResources.length, 1)) * 100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the duplicate check function
checkForDuplicates()
  .then(() => console.log('Script execution completed'))
  .catch(error => console.error('Unhandled error in script:', error));
