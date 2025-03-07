import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";
import { serviceSchema, type ServiceData } from "@shared/schema";

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
  "Generate a one sentence blurb about the offerings and list all specific services provided. Look for pricing details and living options. Include descriptions for each service.",

  // Pricing focused prompt
  "List all pricing information, service packages, and living options available. Generate a summary of the main offerings.",

  // Services focused prompt
  "Detail all available services, amenities, and care options. Create a brief overview of what makes this facility unique."
];

// Rate limiting queue
class RateLimiter {
  private requestTimes: number[] = [];

  canMakeRequest(): boolean {
    const now = Date.now();
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
   * @returns Promise with extracted service data
   */
  async extractServices(websiteUrl: string): Promise<ServiceData | null> {
    let lastError: any = null;
    let bestResult: ServiceData | null = null;

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

          const extractResult = await this.app.extract(
            [cleanedUrl],
            {
              prompt,
              schema: serviceSchema
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

          const result = extractResult.data;

          // Validate the extracted data
          if (!result.blurb || !result.services || result.services.length === 0) {
            console.log(`[FirecrawlService] Insufficient data with prompt ${EXTRACTION_PROMPTS.indexOf(prompt) + 1}`);
            if (retries < MAX_RETRIES) {
              retries++;
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries)));
              continue;
            }
            break; // Try next prompt
          }

          // If this result has more services than our best result, or we don't have a best result yet
          if (!bestResult || (result.services.length > bestResult.services.length)) {
            bestResult = result;
            console.log(`[FirecrawlService] Found better result with ${result.services.length} services`);
          }

          // If we have a good amount of data, stop here
          if (bestResult.services.length >= 3) {
            console.log(`[FirecrawlService] Found sufficient data`);
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

    if (bestResult) {
      console.log(`[FirecrawlService] Successfully extracted data with ${bestResult.services.length} services`);
      return bestResult;
    }

    // All prompts failed
    console.error(`[FirecrawlService] All extraction attempts failed. Last error:`, lastError);
    return null;
  }

  /**
   * Extract services for multiple facilities sequentially
   * @param facilities Array of facility URLs to process
   * @returns Promise with array of [id, extracted data] tuples
   */
  async batchExtractServices(
    facilities: { id: number; website: string; name: string }[]
  ): Promise<Array<[number, ServiceData | null]>> {
    try {
      console.log(`[FirecrawlService] Starting batch extraction for ${facilities.length} facilities`);

      // Process facilities sequentially with progress tracking
      const results: Array<[number, ServiceData | null]> = [];
      let processed = 0;

      for (const facility of facilities) {
        processed++;
        console.log(`\n[FirecrawlService] Processing facility ${processed}/${facilities.length}`);

        if (!facility.website) {
          console.log(`[FirecrawlService] Skipping facility ${facility.id} (${facility.name}): No website URL`);
          results.push([facility.id, null]);
          continue;
        }

        console.log(`[FirecrawlService] Processing: ${facility.name} (${facility.website})`);
        const serviceData = await this.extractServices(facility.website);

        if (!serviceData) {
          console.log(`[FirecrawlService] No data extracted from ${facility.name}`);
        } else {
          console.log(`[FirecrawlService] Extracted ${serviceData.services.length} services from ${facility.name}`);
        }

        results.push([facility.id, serviceData]);

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