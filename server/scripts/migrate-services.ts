import { db } from "../db";
import { facilities, facilityServices } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function migrateServices() {
  try {
    console.log("Starting services migration...");

    // Get all facilities with services data
    const results = await db.execute(
      `SELECT id, services FROM facilities WHERE services IS NOT NULL AND services != 'null'::jsonb`
    );

    console.log(`Found ${results.rows.length} facilities with services to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of results.rows) {
      try {
        const facilityId = row.id;
        const services = row.services;

        if (!Array.isArray(services)) {
          console.log(`Skipping facility ${facilityId}: Invalid services data`);
          errorCount++;
          continue;
        }

        // Insert each service into the new table
        for (const service of services) {
          if (service && typeof service === 'object' && service.service_name) {
            await db.insert(facilityServices).values({
              facilityId: facilityId,
              serviceName: service.service_name,
              description: service.description || null,
              pricingInfo: service.pricing_info || null
            });
          }
        }

        // Clear the old services column using raw SQL
        await db.execute(
          sql`UPDATE facilities SET services = NULL WHERE id = ${facilityId}`
        );

        successCount++;
        console.log(`Migrated services for facility ${facilityId}`);
      } catch (error) {
        console.error(`Error migrating facility ${row.id}:`, error);
        errorCount++;
      }
    }

    console.log("\nMigration Summary:");
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed or no data: ${errorCount}`);

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

migrateServices()
  .then(() => {
    console.log("\nMigration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });