import { db } from '../db';
import { facilities, resources } from '@shared/schema';
import { getApifyService } from '../routes';
import { storage } from '../storage';

// The ID of a completed Apify run to use for import
// Update this with a valid run ID before running
const APIFY_RUN_ID = '0s1kk8irNYKylbbDW'; // Replace with your completed run ID

/**
 * This script will:
 * 1. Clear all facilities and resources from the database
 * 2. Import data from a specified Apify run
 * 
 * WARNING: This will delete ALL existing facilities and resources!
 */
async function resetDatabaseAndImportApifyData() {
  try {
    console.log('Starting database reset and Apify import process...');

    // Step 1: Get current counts
    const beforeFacilities = await storage.getFacilities();
    const beforeResources = await storage.getResources();
    console.log(`Before reset: Database contains ${beforeFacilities.length} facilities and ${beforeResources.length} resources`);

    // Step 2: Delete all facilities and resources (without waiting)
    console.log('Deleting all facilities...');
    await db.delete(facilities);

    console.log('Deleting all resources...');
    await db.delete(resources);

    // Step 3: Verify deletion worked
    const afterDeleteFacilities = await storage.getFacilities();
    const afterDeleteResources = await storage.getResources();
    console.log(`After delete: Database contains ${afterDeleteFacilities.length} facilities and ${afterDeleteResources.length} resources`);

    if (afterDeleteFacilities.length > 0 || afterDeleteResources.length > 0) {
      throw new Error('Failed to delete all records! Aborting import to avoid potential duplicate issues.');
    }

    // Step 4: Import data from the specified Apify run
    console.log(`\nImporting data from Apify run: ${APIFY_RUN_ID}`);
    const apifyService = getApifyService();

    // Retrieve the results from the run
    const results = await apifyService.getRunResults(APIFY_RUN_ID);
    console.log(`Retrieved ${results.length} items from Apify run`);

    // Process and store the data
    await apifyService.processAndStoreData(results);

    // Step 5: Verify import worked
    const afterImportFacilities = await storage.getFacilities();
    const afterImportResources = await storage.getResources();
    console.log(`\nAfter import: Database contains ${afterImportFacilities.length} facilities and ${afterImportResources.length} resources`);

    console.log('\nReset and import process completed successfully!');
  } catch (error) {
    console.error('Error during reset and import process:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the reset and import function
resetDatabaseAndImportApifyData()
  .then(() => console.log('Script execution completed'))
  .catch(error => console.error('Unhandled error in script:', error));