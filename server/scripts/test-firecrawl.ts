import { firecrawlService } from "../services/firecrawlService";

async function testFirecrawlExtraction() {
  try {
    console.log("Testing FireCrawl extraction with goldenpond.com...");
    const services = await firecrawlService.extractServices("https://goldenpond.com");

    console.log("\nExtracted services:");
    console.log(JSON.stringify(services, null, 2));

    return services;
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