import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";
import { careServiceSchema } from "@shared/schema";
import type { CareService } from "@shared/schema";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

export class FirecrawlService {
  private app: FirecrawlApp;

  constructor() {
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY environment variable is required");
    }
    this.app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
  }

  /**
   * Extract care services information from a facility website
   * @param websiteUrl The facility website URL to extract data from
   * @returns Promise with array of care services
   */
  async extractCareServices(websiteUrl: string): Promise<CareService[]> {
    try {
      const schema = z.object({
        care_services: z.array(careServiceSchema)
      });

      const extractResult = await this.app.extract(
        [websiteUrl],
        {
          prompt: "Extract the types of care and services offered on key webpages. Include any available pricing information for each service.",
          schema,
        }
      );

      if (!extractResult.success) {
        console.error(`Failed to extract care services from ${websiteUrl}:`, extractResult.error);
        return [];
      }

      return extractResult.data.care_services;
    } catch (error) {
      console.error(`Error extracting care services from ${websiteUrl}:`, error);
      return [];
    }
  }

  /**
   * Extract care services for multiple facilities in parallel
   * @param facilities Array of facility URLs to process
   * @returns Promise with array of [url, care_services] tuples
   */
  async batchExtractCareServices(
    facilities: { id: number; website: string }[]
  ): Promise<Array<[number, CareService[]]>> {
    try {
      const results = await Promise.allSettled(
        facilities.map(async (facility) => {
          if (!facility.website) {
            return [facility.id, []];
          }
          const services = await this.extractCareServices(facility.website);
          return [facility.id, services];
        })
      );

      return results
        .filter((result): result is PromiseFulfilledResult<[number, CareService[]]> => 
          result.status === "fulfilled"
        )
        .map(result => result.value);
    } catch (error) {
      console.error("Error in batch extraction:", error);
      return [];
    }
  }
}

// Export singleton instance
export const firecrawlService = new FirecrawlService();
