import { getApifyService } from '../services/apifyService';
import { storage } from '../storage';

// Check for the required environment variable
if (!process.env.APIFY_API_KEY) {
  console.error('Error: APIFY_API_KEY environment variable is not set.');
  console.error('Please set this environment variable before running this script.');
  process.exit(1);
}

// First argument should be the run ID
const runId = process.argv[2];
if (!runId) {
  console.error('Error: No run ID provided.');
  console.error('Usage: npx tsx check-apify-run.ts <runId>');
  console.error('Example: npx tsx check-apify-run.ts 1a2b3c4d5e');
  process.exit(1);
}

async function checkRunAndStoreResults() {
  console.log(`Checking Apify run with ID: ${runId}`);

  try {
    const apifyService = getApifyService();

    // We don't need to check the status since we know these runs are complete
    console.log('Attempting to retrieve any available results...');
    const results = await apifyService.getRunResults(runId);
    console.log(`Retrieved ${results.length} results from Apify run: ${runId}`);

    // If we have results, store them
    if (results.length > 0) {
      console.log('Sample result structure:');
      console.log(JSON.stringify(results[0], null, 2));

      // Get initial counts
      const beforeFacilities = await storage.getFacilities();
      const beforeResources = await storage.getResources();
      console.log(`Before processing: ${beforeFacilities.length} facilities and ${beforeResources.length} resources in database`);

      // Process and store the data
      await apifyService.processAndStoreData(results);
      console.log('Data processing completed successfully');

      // Verify data was stored
      const afterFacilities = await storage.getFacilities();
      const afterResources = await storage.getResources();

      console.log(`After processing: ${afterFacilities.length} facilities and ${afterResources.length} resources in database`);
      console.log(`Added ${afterFacilities.length - beforeFacilities.length} new facilities`);
      console.log(`Added ${afterResources.length - beforeResources.length} new resources`);

      if (afterFacilities.length === beforeFacilities.length && afterResources.length === beforeResources.length) {
        console.log('WARNING: No new items were added to the database. Check transformation and storage functions.');
      }
    } else {
      console.log('No results available yet. The run may still be in progress.');
    }

    console.log('Check complete!');
  } catch (error: any) {
    console.error('Error checking Apify run:', error.message);
  }
}

// Run the main function
checkRunAndStoreResults()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('Unhandled error in script:', error);
    process.exit(1);
  });