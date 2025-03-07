import { db } from "../db";
import { sql } from "drizzle-orm";

async function migrateServices() {
  try {
    console.log("Starting services migration...");

    // Get all facilities with services data
    const results = await db.execute(
      sql`SELECT id, services FROM facilities WHERE services IS NOT NULL AND services != 'null'::jsonb`
    );

    console.log(`Found ${results.rows.length} facilities with services to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of results.rows) {
      try {
        const facilityId = row.id;
        const servicesData = row.services;

        // Extract service names from the complex objects
        let serviceNames: string[] = [];

        if (Array.isArray(servicesData)) {
          serviceNames = servicesData
            .filter(service => service && typeof service === 'object' && service.service_name)
            .map(service => service.service_name);
        }

        // Update the facility with the simplified service names array
        await db.execute(
          sql`UPDATE facilities 
              SET services = ${sql.json(serviceNames)}
              WHERE id = ${facilityId}`
        );

        successCount++;
        console.log(`Migrated services for facility ${facilityId}: ${serviceNames.length} services`);
      } catch (error) {
        console.error(`Error migrating facility ${row.id}:`, error);
        errorCount++;
      }
    }

    console.log("\nMigration Summary:");
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed: ${errorCount}`);

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