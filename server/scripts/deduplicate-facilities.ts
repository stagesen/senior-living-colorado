import { storage } from '../storage';
import type { Facility } from '@shared/schema';

/**
 * Script to identify and clean up duplicate facilities in the database
 * This script helps identify facilities that might be duplicates based on
 * similar names or addresses, and outputs a report of potential duplicates.
 */
async function deduplicateFacilities() {
  console.log('Starting facility deduplication process...');
  
  // Get all facilities
  const facilities = await storage.getFacilities();
  console.log(`Found ${facilities.length} total facilities in database`);
  
  // Group facilities by name (ignoring case)
  const nameGroups = new Map<string, Facility[]>();
  
  for (const facility of facilities) {
    const normalizedName = facility.name.toLowerCase().trim();
    
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, []);
    }
    
    nameGroups.get(normalizedName)!.push(facility);
  }
  
  // Find groups with more than one facility (potential duplicates)
  let potentialDuplicatesCount = 0;
  let facilitiesToKeep = new Set<number>();
  let facilitiesToRemove = new Set<number>();
  
  for (const [name, group] of nameGroups.entries()) {
    if (group.length > 1) {
      potentialDuplicatesCount++;
      console.log(`\nPotential duplicate group: "${name}" (${group.length} facilities)`);
      
      // Sort by completeness (facilities with more data are preferred)
      group.sort((a, b) => {
        // Count the number of non-null fields as a measure of completeness
        const completenessA = countNonNullFields(a);
        const completenessB = countNonNullFields(b);
        return completenessB - completenessA;
      });
      
      // Keep the most complete facility
      const keepFacility = group[0];
      facilitiesToKeep.add(keepFacility.id);
      
      console.log(`  Keeping facility ID ${keepFacility.id}: "${keepFacility.name}" at "${keepFacility.address}" (most complete data)`);
      
      // Mark others for potential removal
      for (let i = 1; i < group.length; i++) {
        const duplicate = group[i];
        facilitiesToRemove.add(duplicate.id);
        console.log(`  Potential duplicate ID ${duplicate.id}: "${duplicate.name}" at "${duplicate.address}"`);
      }
    }
  }
  
  // Also check for similar addresses but different names
  const cityGroups = new Map<string, Facility[]>();
  
  for (const facility of facilities) {
    if (!facility.city) continue;
    
    const normalizedCity = facility.city.toLowerCase().trim();
    
    if (!cityGroups.has(normalizedCity)) {
      cityGroups.set(normalizedCity, []);
    }
    
    cityGroups.get(normalizedCity)!.push(facility);
  }
  
  // Find addresses that are very similar within the same city
  for (const [city, group] of cityGroups.entries()) {
    if (group.length <= 1) continue;
    
    for (let i = 0; i < group.length; i++) {
      const facility1 = group[i];
      if (!facility1.address) continue;
      
      for (let j = i + 1; j < group.length; j++) {
        const facility2 = group[j];
        if (!facility2.address) continue;
        
        // If the names are different but addresses are similar
        if (facility1.name.toLowerCase() !== facility2.name.toLowerCase() &&
            areSimilarAddresses(facility1.address, facility2.address)) {
          
          console.log(`\nPotential duplicates with similar addresses in ${city}:`);
          console.log(`  Facility 1: ID ${facility1.id} - "${facility1.name}" at "${facility1.address}"`);
          console.log(`  Facility 2: ID ${facility2.id} - "${facility2.name}" at "${facility2.address}"`);
          
          // Prefer the one with more data if they're likely duplicates
          if (countNonNullFields(facility1) > countNonNullFields(facility2)) {
            if (!facilitiesToKeep.has(facility2.id)) {
              facilitiesToKeep.add(facility1.id);
              facilitiesToRemove.add(facility2.id);
              console.log(`  Suggestion: Keep facility 1 (ID ${facility1.id}) as it has more complete data`);
            }
          } else {
            if (!facilitiesToKeep.has(facility1.id)) {
              facilitiesToKeep.add(facility2.id);
              facilitiesToRemove.add(facility1.id);
              console.log(`  Suggestion: Keep facility 2 (ID ${facility2.id}) as it has more complete data`);
            }
          }
        }
      }
    }
  }
  
  console.log(`\n=== Deduplication Summary ===`);
  console.log(`Total facilities: ${facilities.length}`);
  console.log(`Found ${potentialDuplicatesCount} name groups with potential duplicates`);
  console.log(`Facilities to keep: ${facilitiesToKeep.size}`);
  console.log(`Potential duplicates to review: ${facilitiesToRemove.size}`);
  
  console.log(`\nTo remove duplicates, execute SQL like:`);
  console.log(`DELETE FROM facilities WHERE id IN (${Array.from(facilitiesToRemove).join(', ')})`);
  console.log(`\nHowever, please review the duplicates first to ensure you're removing the correct ones.`);
  console.log(`You can also use the admin interface to merge or delete specific duplicates.`);
}

// Helper functions
function countNonNullFields(facility: Facility): number {
  let count = 0;
  
  // Count all non-null, non-empty fields
  for (const [key, value] of Object.entries(facility)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'string') {
        if (value.trim() !== '') count++;
      } else if (Array.isArray(value)) {
        if (value.length > 0) count++;
      } else {
        count++;
      }
    }
  }
  
  return count;
}

function areSimilarAddresses(address1: string, address2: string): boolean {
  // Normalize addresses for comparison
  const norm1 = address1.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const norm2 = address2.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  
  // If they're identical after normalization
  if (norm1 === norm2) return true;
  
  // If one is a substring of the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // If they're very similar based on common words
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));
  
  // Count common words
  let commonWords = 0;
  for (const word of words1) {
    if (words2.has(word) && word.length > 1) {
      commonWords++;
    }
  }
  
  // If there are at least 3 common words in the addresses
  if (commonWords >= 3) return true;
  
  return false;
}

// Run the deduplication function
deduplicateFacilities()
  .then(() => {
    console.log('Deduplication analysis completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during deduplication:', error);
    process.exit(1);
  });
