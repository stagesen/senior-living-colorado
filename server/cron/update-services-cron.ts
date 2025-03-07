import cron from "node-cron";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { firecrawlService } from "../services/firecrawlService";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_FACILITIES = 5000;
const DELAY_BETWEEN_BATCHES = 30000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateFacilityBatch() {
  try {
    console.log("[Cron] Starting facility service update batch...");

    // Get facilities without services or with empty services
    const results = await db.execute(
      sql`SELECT id, name, website 
          FROM facilities 
          WHERE website IS NOT NULL 
          AND (services IS NULL OR services = '[]'::jsonb OR services = 'null'::jsonb)
          ORDER BY id
          LIMIT ${BATCH_SIZE}`
    );

    if (results.rows.length === 0) {
      console.log("[Cron] No facilities need updating at this time");
      return;
    }

    console.log(`[Cron] Processing ${results.rows.length} facilities`);
    let successCount = 0;
    let errorCount = 0;

    for (const facility of results.rows) {
      try {
        if (!facility.website) {
          console.log(`[Cron] Skipping facility ${facility.id} (${facility.name}): No website`);
          continue;
        }

        console.log(`[Cron] Processing facility ${facility.id} (${facility.name})`);
        const serviceData = await firecrawlService.extractServices(facility.website);

        if (serviceData) {
          await db.execute(sql`
            UPDATE facilities 
            SET 
              services = ${JSON.stringify(serviceData.services)}::jsonb,
              pricing_info = ${JSON.stringify(serviceData.pricing || [])}::jsonb,
              facility_blurb = ${serviceData.blurb},
              last_updated = NOW()
            WHERE id = ${facility.id}
          `);

          console.log(`[Cron] Updated services for facility ${facility.id} (${facility.name})`);
          successCount++;
        } else {
          console.log(`[Cron] No data extracted for facility ${facility.id} (${facility.name})`);
          errorCount++;
        }

        // Wait between facilities
        await sleep(DELAY_BETWEEN_FACILITIES);

      } catch (error) {
        console.error(`[Cron] Error processing facility ${facility.id}:`, error);
        errorCount++;
      }
    }

    console.log("\n[Cron] Batch Update Summary:");
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${errorCount}`);

  } catch (error) {
    console.error("[Cron] Batch update failed:", error);
  }
}

// Schedule updates to run every 2 hours
// This gives enough time between batches and helps avoid rate limits
cron.schedule("0 */2 * * *", async () => {
  console.log("[Cron] Running scheduled facility service update");
  await updateFacilityBatch();
});

// Also export for manual running
export { updateFacilityBatch };
