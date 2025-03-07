import { db } from "../db";
import { facilities } from "@shared/schema";
import { firecrawlService } from "../services/firecrawlService";
import { eq, isNotNull } from "drizzle-orm";

async function updateFacilityServices() {
  try {
    console.log("Fetching facilities with websites...");
    const facilitiesWithWebsites = await db.select({
      id: facilities.id,
      name: facilities.name,
      website: facilities.website
    })
    .from(facilities)
    .where(
      // Only process facilities that have a website
      isNotNull(facilities.website)
    );

    console.log(`Found ${facilitiesWithWebsites.length} facilities to process`);

    if (facilitiesWithWebsites.length === 0) {
      console.log("No facilities found with websites. Please ensure facilities have been imported with website URLs.");
      return;
    }

    console.log("\nProcessing facilities:");
    facilitiesWithWebsites.forEach(f => {
      console.log(`- ${f.name}: ${f.website}`);
    });

    const results = await firecrawlService.batchExtractCareServices(facilitiesWithWebsites);

    console.log("\nUpdating facilities with extracted services...");
    let successCount = 0;
    let failureCount = 0;

    for (const [facilityId, services] of results) {
      if (services.length > 0) {
        try {
          await db.update(facilities)
            .set({
              services: services,
              last_updated: new Date()
            })
            .where(eq(facilities.id, facilityId));

          console.log(`Updated facility ${facilityId} with ${services.length} services`);
          successCount++;
        } catch (error) {
          console.error(`Failed to update facility ${facilityId}:`, error);
          failureCount++;
        }
      } else {
        console.log(`No services found for facility ${facilityId}`);
        failureCount++;
      }
    }

    console.log("\nUpdate Summary:");
    console.log(`- Total facilities processed: ${facilitiesWithWebsites.length}`);
    console.log(`- Successfully updated: ${successCount}`);
    console.log(`- Failed or no data: ${failureCount}`);

  } catch (error) {
    console.error("Error updating services:", error);
    throw error;
  }
}

updateFacilityServices()
  .then(() => {
    console.log("\nUpdate completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nUpdate failed:", error);
    process.exit(1);
  });