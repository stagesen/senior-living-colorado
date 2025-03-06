import { getApifyService } from '../services/apifyService';
import { storage } from '../storage';

// Check for the required environment variable
if (!process.env.APIFY_API_KEY) {
  console.error('Error: APIFY_API_KEY environment variable is not set.');
  console.error('Please set this environment variable before running this script.');
  process.exit(1);
}

async function runTest() {
  console.log('Starting Apify integration test...');
  console.log('Using API key:', process.env.APIFY_API_KEY?.substring(0, 5) + '...');

  try {
    // Get the Apify service instance
    const apifyService = getApifyService();

    // Run a small test query to limit data
    // Use a small geographical area and just one type of facility
    const testLocations = ['Littleton, CO'];
    const searchTerms = ['assisted living']; // Just one search term for testing

    // Convert location and search terms into proper query strings
    const queries: string[] = [];
    for (const term of searchTerms) {
      for (const location of testLocations) {
        queries.push(`${term} in ${location}`);
      }
    }

    console.log(`Running Apify scraper with ${queries.length} queries:`, queries);

    // Start the scraper with a smaller max places value for testing
    const runId = await apifyService.runScraper(
      {
        searchStringsArray: queries,
        maxCrawledPlaces: 3, // Reduce from 5 to 3 to speed up the process
        language: "en",
        includeReviews: true,
        maxReviews: 3
      },
      { waitForFinish: 600 } // Increased from 300 to 600 seconds
    );

    console.log(`Apify run started with ID: ${runId}`);
    console.log('Waiting for results (this may take up to 10 minutes)...');

    // Since we're in a test script, we'll attempt to get results even if the run
    // might still be in progress. In a real sync job, we would wait for completion.
    try {
      console.log('Attempting to retrieve partial or complete results');
      const results = await apifyService.getRunResults(runId);
      console.log(`Retrieved ${results.length} results from Apify`);

      // Log the first result to see structure
      if (results.length > 0) {
        console.log('Sample result structure:');
        console.log(JSON.stringify(results[0], null, 2));

        // Process and store the data
        await apifyService.processAndStoreData(results);
        console.log('Data processing completed successfully');

        // Verify data was stored
        const facilities = await storage.getFacilities();
        console.log(`Database now contains ${facilities.length} facilities`);
      } else {
        console.log('No results available yet. The Apify run may still be in progress.');
        console.log('You can check the status of the run in the Apify dashboard.');
        console.log(`Run ID: ${runId}`);
      }
    } catch (error: any) {
      console.error('Error retrieving results:', error.message);
      console.log('The Apify run may still be in progress. You can check the status later.');
      console.log(`Run ID: ${runId}`);
    }

    console.log('Test execution completed!');
  } catch (error) {
    console.error('Error during Apify test:', error);
  }
}

// Run the test
runTest()
  .then(() => {
    console.log('Test script execution completed');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('Unhandled error in test script:', error);
    process.exit(1);
  });