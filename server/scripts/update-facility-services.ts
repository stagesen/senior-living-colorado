import { db } from "../db";
import { sql } from "drizzle-orm";
import { firecrawlService } from "../services/firecrawlService";

const BATCH_SIZE = 5; // Process 5 facilities at a time
const DELAY_BETWEEN_FACILITIES = 5000; // 5 seconds between each facility
const DELAY_BETWEEN_BATCHES = 30000; // 30 seconds between batches

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateFacilityServices() {
  try {
    console.log("Starting service data update process...");

    // Get facilities without services or with empty services
    const results = await db.execute(
      sql`SELECT id, name, website 
          FROM facilities 
          WHERE website IS NOT NULL 
          AND (services IS NULL OR services = '[]'::jsonb OR services = 'null'::jsonb)
          ORDER BY id`
    );

    console.log(`Found ${results.rows.length} facilities to process`);

    let successCount = 0;
    let errorCount = 0;
    let batchCount = 0;

    // Process facilities in batches
    for (let i = 0; i < results.rows.length; i += BATCH_SIZE) {
      const batch = results.rows.slice(i, i + BATCH_SIZE);
      batchCount++;
      console.log(`\nProcessing batch ${batchCount}...`);

      // Process each facility in the batch
      for (const facility of batch) {
        try {
          if (!facility.website) {
            console.log(`Skipping facility ${facility.id} (${facility.name}): No website`);
            continue;
          }

          console.log(`\nProcessing facility ${facility.id} (${facility.name})`);
          console.log(`Website: ${facility.website}`);

          // Extract services using FireCrawl
          const serviceData = await firecrawlService.extractServices(facility.website);
          console.log('Extracted data:', JSON.stringify(serviceData, null, 2));

          if (serviceData) {
            // Update the facility with the extracted data
            await db.execute(sql`
              UPDATE facilities 
              SET 
                services = ${JSON.stringify(serviceData.services)}::jsonb,
                pricing_info = ${JSON.stringify(serviceData.pricing || [])}::jsonb,
                facility_blurb = ${serviceData.blurb},
                last_updated = NOW()
              WHERE id = ${facility.id}
            `);

            console.log(`Updated services for facility ${facility.id} (${facility.name})`);
            successCount++;
          } else {
            console.log(`No services found for facility ${facility.id} (${facility.name})`);
            errorCount++;
          }

          // Wait between facilities to avoid rate limiting
          await sleep(DELAY_BETWEEN_FACILITIES);

        } catch (error) {
          console.error(`Error processing facility ${facility.id}:`, error);
          errorCount++;
        }
      }

      // Wait between batches
      if (i + BATCH_SIZE < results.rows.length) {
        console.log(`\nWaiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log("\nService Update Summary:");
    console.log(`Total facilities processed: ${results.rows.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${errorCount}`);

  } catch (error) {
    console.error("Service update process failed:", error);
    throw error;
  }
}

// Run the update
updateFacilityServices()
  .then(() => {
    console.log("\nService update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nService update failed:", error);
    process.exit(1);
  });