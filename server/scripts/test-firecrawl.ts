import { firecrawlService } from "../services/firecrawlService";

async function testFirecrawlExtraction() {
  try {
    console.log("Testing FireCrawl extraction with goldenpond.com...");
    const services = await firecrawlService.extractServices("https://goldenpond.com");

    // Log the extracted services more verbosely
    console.log("\nExtracted services (raw):");
    console.log(JSON.stringify(services, null, 2));

    // Convert complex service objects to simple strings if needed
    const serviceNames = services.map(service => {
      if (typeof service === 'string') return service;
      if (service && typeof service === 'object' && 'service_name' in service) {
        return service.service_name;
      }
      return null;
    }).filter(Boolean);

    console.log("\nExtracted service names:");
    console.log(JSON.stringify(serviceNames, null, 2));

    return serviceNames;
  } catch (error) {
    console.error("Error during extraction:", error);
    throw error;
  }
}

testFirecrawlExtraction()
  .then(() => {
    console.log("\nExtraction test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nExtraction test failed:", error);
    process.exit(1);
  });