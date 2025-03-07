import { db } from "../db";
import { sql } from "drizzle-orm";

async function migrateServices() {
  try {
    console.log("Starting services migration...");

    // Get all facilities with services data
    const results = await db.execute(
      sql`SELECT id, name, services FROM facilities WHERE services IS NOT NULL`
    );

    console.log(`Found ${results.rows.length} facilities with services`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of results.rows) {
      try {
        const facilityId = row.id;
        const servicesData = row.services;

        // Debug log
        console.log(`Processing facility ${facilityId} (${row.name}):`);
        console.log('Raw services:', servicesData);

        // Extract service names from the complex objects
        let serviceNames: string[] = [];

        if (Array.isArray(servicesData)) {
          serviceNames = servicesData
            .map(service => {
              if (typeof service === 'string') return service;
              if (service && typeof service === 'object' && service.service_name) {
                return service.service_name;
              }
              return null;
            })
            .filter(Boolean);
        } else if (typeof servicesData === 'string') {
          try {
            const parsed = JSON.parse(servicesData);
            if (Array.isArray(parsed)) {
              serviceNames = parsed
                .map(service => {
                  if (typeof service === 'string') return service;
                  if (service && typeof service === 'object' && service.service_name) {
                    return service.service_name;
                  }
                  return null;
                })
                .filter(Boolean);
            }
          } catch (error) {
            console.error(`Error parsing services JSON for facility ${facilityId}:`, error);
          }
        }

        console.log('Extracted service names:', serviceNames);

        // Update the facility with the simplified service names array
        await db.execute(
          sql`UPDATE facilities 
              SET services = ${sql.json(serviceNames)}
              WHERE id = ${facilityId}`
        );

        successCount++;
        console.log(`Migrated services for facility ${facilityId} (${row.name}): ${serviceNames.length} services`);
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

// Run the migration
migrateServices()
  .then(() => {
    console.log("\nMigration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });