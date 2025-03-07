import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";
import { serviceSchema } from "@shared/schema";
import type { Service } from "@shared/schema";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Clean and normalize URLs
function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove common tracking parameters
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
      'utm_term', 'source', 'cid', 'y_source', 'ref'
    ];
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));

    // Ensure HTTPS
    urlObj.protocol = 'https:';

    // Remove trailing slashes
    return urlObj.toString().replace(/\/$/, '');
  } catch (error) {
    console.error(`[FirecrawlService] Error cleaning URL ${url}:`, error);
    return url;
  }
}

// Different prompts to try for extraction
const EXTRACTION_PROMPTS = [
  // General service extraction
  "Extract all types of services and living options offered at this senior community. For each service, include its name, a detailed description of what's included, and any available pricing or fee information. Focus on key service pages and pricing information.",

  // Focused on living options
  "Find the different living arrangements and service options offered at this community. Look for sections describing residential options, support services, or specialized care programs. Extract the service name, description, and any monthly fees or pricing details.",

  // Cost-focused extraction
  "Analyze the website for information about residential options and their costs. Extract each type of service or living arrangement offered, along with detailed descriptions and pricing information if available.",

  // Service-focused extraction
  "Locate all services mentioned on the website, particularly in sections about 'Our Services', 'Living Options', or 'Lifestyle Choices'. For each type, capture the service name, any descriptive text about what's included, and pricing details if shown.",

  // Amenity-based extraction
  "Find information about different programs and services offered, looking in sections about amenities, lifestyle options, or resident services. Extract details about each option, including service descriptions and cost information.",

  // Service types with common terminology
  "Look for specific senior living options: short-term stays, long-term residency, specialized care programs, support services, wellness programs. For each found service, extract its name, description, and any pricing details.",

  // Pricing structure focused
  "Find monthly rates, base fees, or pricing information for different service levels. Look for terms like 'starting at', 'monthly fee', or 'pricing plans' and associate them with specific services.",

  // Simplified extraction
  "Extract basic information about residential options and services offered, including descriptions and costs. Look for any mentions of different living arrangements, support services, or specialized programs."
];

export class FirecrawlService {
  private app: FirecrawlApp;

  constructor() {
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY environment variable is required");
    }
    this.app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
  }

  /**
   * Extract services information from a facility website
   * @param websiteUrl The facility website URL to extract data from
   * @returns Promise with array of services
   */
  async extractCareServices(websiteUrl: string): Promise<Service[]> {
    let lastError: any = null;
    let bestResult: Service[] = [];

    // Clean the URL first
    const cleanedUrl = cleanUrl(websiteUrl);
    console.log(`[FirecrawlService] Using cleaned URL: ${cleanedUrl} (original: ${websiteUrl})`);

    // Try each prompt in sequence
    for (const prompt of EXTRACTION_PROMPTS) {
      let retries = 0;

      while (retries <= MAX_RETRIES) {
        try {
          console.log(`[FirecrawlService] Attempting extraction from ${cleanedUrl} with prompt ${EXTRACTION_PROMPTS.indexOf(prompt) + 1}/${EXTRACTION_PROMPTS.length} (attempt ${retries + 1}/${MAX_RETRIES + 1})`);

          const schema = z.object({
            services: z.array(serviceSchema)
          });

          const extractResult = await this.app.extract(
            [cleanedUrl],
            {
              prompt,
              schema,
            }
          );

          if (!extractResult.success) {
            console.error(`[FirecrawlService] Failed to extract with prompt ${EXTRACTION_PROMPTS.indexOf(prompt) + 1}:`, extractResult.error);
            lastError = extractResult.error;
            if (retries < MAX_RETRIES) {
              retries++;
              console.log(`[FirecrawlService] Retrying in ${RETRY_DELAY}ms...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              continue;
            }
            break; // Try next prompt
          }

          if (!extractResult.data.services || extractResult.data.services.length === 0) {
            console.log(`[FirecrawlService] No services found with prompt ${EXTRACTION_PROMPTS.indexOf(prompt) + 1}. ${retries < MAX_RETRIES ? "Retrying..." : "Trying next prompt..."}`);
            if (retries < MAX_RETRIES) {
              retries++;
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              continue;
            }
            break; // Try next prompt
          }

          // Validate extracted data
          const services = extractResult.data.services;
          const validServices = services.filter(service => {
            // Basic validation checks
            if (!service.service_name || service.service_name.length < 3) {
              console.log(`[FirecrawlService] Invalid service name: ${service.service_name}`);
              return false;
            }
            if (!service.description || service.description.length < 20) {
              console.log(`[FirecrawlService] Invalid description for ${service.service_name}`);
              return false;
            }
            return true;
          });

          // Keep track of the best result (most valid services found)
          if (validServices.length > bestResult.length) {
            bestResult = validServices;
            console.log(`[FirecrawlService] Found better result with ${bestResult.length} valid services using prompt ${EXTRACTION_PROMPTS.indexOf(prompt) + 1}`);
          }

        } catch (error) {
          console.error(`[FirecrawlService] Error during extraction with prompt ${EXTRACTION_PROMPTS.indexOf(prompt) + 1} (attempt ${retries + 1}):`, error);
          lastError = error;
          if (retries < MAX_RETRIES) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            continue;
          }
          break; // Try next prompt
        }
      }

      // If we found a good result, no need to try more prompts
      if (bestResult.length >= 2) {
        console.log(`[FirecrawlService] Found sufficient services (${bestResult.length}), stopping extraction`);
        break;
      }
    }

    if (bestResult.length > 0) {
      console.log(`[FirecrawlService] Successfully extracted ${bestResult.length} services from ${cleanedUrl}`);
      return bestResult;
    }

    // All prompts failed
    console.error(`[FirecrawlService] All extraction attempts failed for ${cleanedUrl}. Last error:`, lastError);
    return [];
  }

  /**
   * Extract services for multiple facilities in parallel
   * @param facilities Array of facility URLs to process
   * @returns Promise with array of [url, services] tuples
   */
  async batchExtractCareServices(
    facilities: { id: number; website: string; name: string }[]
  ): Promise<Array<[number, Service[]]>> {
    try {
      console.log(`[FirecrawlService] Starting batch extraction for ${facilities.length} facilities`);

      const results = await Promise.allSettled(
        facilities.map(async (facility) => {
          if (!facility.website) {
            console.log(`[FirecrawlService] Skipping facility ${facility.id} (${facility.name}): No website URL provided`);
            return [facility.id, []];
          }

          console.log(`[FirecrawlService] Processing facility ${facility.id} (${facility.name}): ${facility.website}`);
          const services = await this.extractCareServices(facility.website);

          if (services.length === 0) {
            console.log(`[FirecrawlService] No services extracted from facility ${facility.id} (${facility.name})`);
          } else {
            console.log(`[FirecrawlService] Successfully extracted ${services.length} services from facility ${facility.id} (${facility.name})`);
          }
          return [facility.id, services];
        })
      );

      return results
        .filter((result): result is PromiseFulfilledResult<[number, Service[]]> =>
          result.status === "fulfilled"
        )
        .map(result => result.value);
    } catch (error) {
      console.error("[FirecrawlService] Error in batch extraction:", error);
      return [];
    }
  }
}

// Export singleton instance
export const firecrawlService = new FirecrawlService();