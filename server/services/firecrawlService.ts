import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";
import { serviceSchema } from "@shared/schema";
import type { Service } from "@shared/schema";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const BATCH_DELAY = 2000; // 2 second delay between facilities

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
  // General extraction prompt
  "Extract all services, living options, and amenities offered here. Include the name, description, and any pricing for each option.",

  // Structure focused prompt
  "Find information about residential options and services. Look for any packages, programs, or living arrangements with their descriptions and costs.",

  // Features focused prompt
  "List all available features and services, including their descriptions and any pricing details. Focus on main offerings and included amenities."
];

// Rate limiting queue
class RateLimiter {
  private requestTimes: number[] = [];

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests older than the window
    this.requestTimes = this.requestTimes.filter(time => now - time < RATE_LIMIT_WINDOW);
    return this.requestTimes.length < RATE_LIMIT;
  }

  async waitForSlot(): Promise<void> {
    while (!this.canMakeRequest()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.requestTimes.push(Date.now());
  }
}

export class FirecrawlService {
  private app: FirecrawlApp;
  private rateLimiter: RateLimiter;

  constructor() {
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY environment variable is required");
    }
    this.app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Extract services information from a facility website
   * @param websiteUrl The facility website URL to extract data from
   * @returns Promise with array of services
   */
  async extractServices(websiteUrl: string): Promise<Service[]> {
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
          // Wait for rate limit slot
          await this.rateLimiter.waitForSlot();

          console.log(`[FirecrawlService] Attempting extraction with prompt ${EXTRACTION_PROMPTS.indexOf(prompt) + 1}/${EXTRACTION_PROMPTS.length} (attempt ${retries + 1}/${MAX_RETRIES + 1})`);

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
            const errorType = extractResult.error?.toString().toLowerCase() || '';
            const isRateLimit = errorType.includes('rate') || errorType.includes('limit');

            console.error(`[FirecrawlService] Extraction failed:`, {
              error: extractResult.error,
              isRateLimit,
              attempt: retries + 1
            });

            if (retries < MAX_RETRIES) {
              retries++;
              const delay = isRateLimit ? 
                RATE_LIMIT_WINDOW / RATE_LIMIT : // If rate limited, wait for a slot
                RETRY_DELAY * Math.pow(2, retries); // Otherwise use exponential backoff
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            break; // Try next prompt
          }

          if (!extractResult.data.services || extractResult.data.services.length === 0) {
            console.log(`[FirecrawlService] No services found with prompt ${EXTRACTION_PROMPTS.indexOf(prompt) + 1}`);
            if (retries < MAX_RETRIES) {
              retries++;
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries)));
              continue;
            }
            break; // Try next prompt
          }

          // Validate extracted data
          const services = extractResult.data.services;
          const validServices = services.filter(service => {
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

          if (validServices.length > bestResult.length) {
            bestResult = validServices;
            console.log(`[FirecrawlService] Found better result with ${bestResult.length} valid services`);
          }

          // If we found enough services, stop here
          if (bestResult.length >= 2) {
            console.log(`[FirecrawlService] Found sufficient services (${bestResult.length})`);
            return bestResult;
          }

        } catch (error) {
          console.error(`[FirecrawlService] Error during extraction:`, error);
          lastError = error;
          if (retries < MAX_RETRIES) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries)));
            continue;
          }
          break; // Try next prompt
        }
      }
    }

    if (bestResult.length > 0) {
      console.log(`[FirecrawlService] Successfully extracted ${bestResult.length} services`);
      return bestResult;
    }

    // All prompts failed
    console.error(`[FirecrawlService] All extraction attempts failed. Last error:`, lastError);
    return [];
  }

  /**
   * Extract services for multiple facilities sequentially
   * @param facilities Array of facility URLs to process
   * @returns Promise with array of [url, services] tuples
   */
  async batchExtractServices(
    facilities: { id: number; website: string; name: string }[]
  ): Promise<Array<[number, Service[]]>> {
    try {
      console.log(`[FirecrawlService] Starting batch extraction for ${facilities.length} facilities`);

      // Process facilities sequentially with progress tracking
      const results: Array<[number, Service[]]> = [];
      let processed = 0;

      for (const facility of facilities) {
        processed++;
        console.log(`\n[FirecrawlService] Processing facility ${processed}/${facilities.length}`);

        if (!facility.website) {
          console.log(`[FirecrawlService] Skipping facility ${facility.id} (${facility.name}): No website URL`);
          results.push([facility.id, []]);
          continue;
        }

        console.log(`[FirecrawlService] Processing: ${facility.name} (${facility.website})`);
        const services = await this.extractServices(facility.website);

        if (services.length === 0) {
          console.log(`[FirecrawlService] No services extracted from ${facility.name}`);
        } else {
          console.log(`[FirecrawlService] Extracted ${services.length} services from ${facility.name}`);
        }

        results.push([facility.id, services]);

        // Add delay between facilities to help avoid rate limits
        if (processed < facilities.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      return results;
    } catch (error) {
      console.error("[FirecrawlService] Error in batch extraction:", error);
      return [];
    }
  }
}

// Export singleton instance
export const firecrawlService = new FirecrawlService();