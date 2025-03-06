import axios from 'axios';
import { Facility, Resource, Review, Photo } from '@shared/schema';
import { storage } from '../storage';

// Import or access the syncStatus object from routes.ts
// Since we can't easily import it (circular dependency), we'll use a direct reference
declare const syncStatus: {
  status: string;
  message: string;
  processedItems: number;
  totalItems: number;
  startTime: Date | null;
  endTime: Date | null;
};

// Function to update sync status
function updateSyncStatus(message: string, processedItems?: number, totalItems?: number) {
  if (typeof syncStatus !== 'undefined') {
    syncStatus.message = message;
    if (processedItems !== undefined) syncStatus.processedItems = processedItems;
    if (totalItems !== undefined) syncStatus.totalItems = totalItems;
  }
}

interface ApifyRunInput {
  searchStringsArray?: string[];  // Updated from queries to searchStringsArray
  startUrls?: {url: string}[];
  allPlacesNoSearchAction?: boolean;
  maxCrawledPlaces?: number;
  language?: string;
  includeReviews?: boolean;
  maxReviews?: number;
}

interface ApifyRunOptions {
  waitForFinish?: number; // Timeout in seconds
}

interface ApifyDataItem {
  title: string;               // Name of the facility/resource
  categoryName?: string;       // Type/category
  address?: string;           
  city?: string;
  state?: string;
  postalCode?: string;         // ZIP code
  phoneUnformatted?: string;   // Phone number
  phone?: string;              // Formatted phone number
  website?: string;            
  description?: string;        // We may need to generate this
  totalScore?: number;         // Rating
  reviewsCount?: number;
  reviews?: any[];             // Will be transformed to our Review type
  imageUrl?: string;           // Main image
  images?: any[];              // Will be transformed to our Photo type
  imageUrls?: string[];
  location?: {
    lat: number;
    lng: number;
  };
  additionalInfo?: any;        // Can contain amenities and other details
  categories?: string[];
}

export class ApifyService {
  private apiKey: string;
  private actorId: string = 'compass~crawler-google-places'; // Using actor shown in docs
  private batchSize = 10; // Number of items to process in parallel

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Run an Apify actor to scrape senior living data
   * @param input Search parameters for the scraper
   * @param options Additional options like timeout
   * @returns The run ID that can be used to track the run
   */
  public async runScraper(input: ApifyRunInput, options: ApifyRunOptions = {}): Promise<string> {
    try {
      console.log(`Starting Apify scraper with input:`, input);
      updateSyncStatus(`Starting Apify scraper with queries: ${input.searchStringsArray?.join(', ')}`);

      // Format exactly as in the documentation
      const url = `https://api.apify.com/v2/acts/${this.actorId}/runs?token=${this.apiKey}`;
      console.log(`Making API request to: ${url}`);

      const startResponse = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json'
        },
        data: input
      });

      const runId = startResponse.data.data.id;
      console.log(`Apify scraper started with run ID: ${runId}`);
      updateSyncStatus(`Apify scraper started with run ID: ${runId}`);

      // Wait for the run to finish if requested
      if (options.waitForFinish) {
        await this.waitForRun(runId, options.waitForFinish);
      }

      return runId;
    } catch (error: any) {
      // Enhanced error logging
      console.error('Error running Apify scraper:', error);

      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
      }

      updateSyncStatus(`Error running Apify scraper: ${error.message}`);
      throw new Error(`Failed to run Apify scraper: ${error.message}`);
    }
  }

  /**
   * Wait for an Apify run to finish with exponential backoff
   * @param runId The run ID to wait for
   * @param timeoutSeconds Maximum time to wait in seconds
   */
  private async waitForRun(runId: string, timeoutSeconds: number): Promise<void> {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    let retryDelay = 2000; // Start with 2 seconds
    let maxRetryDelay = 30000; // Max 30 seconds

    console.log(`Waiting for run ${runId} to complete (timeout: ${timeoutSeconds} seconds)...`);

    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await this.getRunStatus(runId);
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        console.log(`Run ${runId} status after ${elapsedSeconds}s: ${status}`);
        updateSyncStatus(`Waiting for Apify run to complete, current status: ${status} (${elapsedSeconds}s elapsed)`);

        if (status === 'SUCCEEDED' || status === 'FINISHED') {
          console.log(`Run ${runId} completed successfully after ${elapsedSeconds} seconds`);
          return;
        } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
          console.log(`Run ${runId} ended with status: ${status} after ${elapsedSeconds} seconds`);
          updateSyncStatus(`Apify run ended with status: ${status}`);
          throw new Error(`Apify run ended with status: ${status}`);
        }
      } catch (error: any) {
        console.error(`Error checking run status: ${error.message}`);
        // Continue with retry logic for transient errors
      }

      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retryDelay = Math.min(retryDelay * 1.5, maxRetryDelay);
    }

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const message = `Timeout waiting for Apify run to finish after ${elapsedSeconds} seconds`;
    updateSyncStatus(message);
    console.warn(message);

    // Instead of throwing an error, we'll just warn and return
    // This allows the caller to decide what to do (e.g., check for partial results)
    return;
  }

  /**
   * Get the status of an Apify run
   * @param runId The run ID to check
   * @returns The status of the run
   */
  private async getRunStatus(runId: string): Promise<string> {
    try {
      // Using the correct URL format from documentation
      const url = `https://api.apify.com/v2/actor-runs/${runId}?token=${this.apiKey}`;

      const response = await axios.get(url);
      return response.data.data.status;
    } catch (error: any) {
      console.error('Error checking run status:', error.response?.data || error.message);
      throw new Error(`Failed to check run status: ${error.message}`);
    }
  }

  /**
   * Get results from an Apify run (completed or in progress)
   * @param runId The run ID to get results for
   * @returns Array of data items from the run
   */
  public async getRunResults(runId: string): Promise<ApifyDataItem[]> {
    try {
      updateSyncStatus(`Fetching results from Apify run: ${runId}`);
      // Using the correct URL format from documentation
      const url = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${this.apiKey}`;

      console.log(`Fetching results from: ${url}`);
      const response = await axios.get(url);
      const items = response.data;

      if (!Array.isArray(items)) {
        console.warn(`Warning: Expected array of items but got: ${typeof items}`);
        return [];
      }

      updateSyncStatus(`Retrieved ${items.length} items from Apify`);
      console.log(`Retrieved ${items.length} items from Apify run: ${runId}`);

      return items;
    } catch (error: any) {
      console.error('Error fetching Apify results:', error.response?.data || error.message);
      updateSyncStatus(`Error fetching results: ${error.message}`);
      throw new Error(`Failed to fetch Apify results: ${error.message}`);
    }
  }

  /**
   * Process and store Apify data into our database
   * @param data Array of data items from Apify
   */
  public async processAndStoreData(data: ApifyDataItem[]): Promise<void> {
    console.log(`Processing ${data.length} items from Apify`);
    updateSyncStatus(`Beginning to process ${data.length} items from Apify`, 0, data.length);

    // Process data in batches to avoid overwhelming the system
    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(data.length / this.batchSize);

      console.log(`Processing batch ${batchNumber} of ${totalBatches}, size: ${batch.length}`);
      updateSyncStatus(
        `Processing batch ${batchNumber} of ${totalBatches} (${i} of ${data.length} items)`, 
        i, 
        data.length
      );

      await Promise.all(
        batch.map(async (item) => {
          try {
            // Transform the Apify item to our format
            const transformedItem = this.transformApifyItem(item);

            // Determine if this is a facility or resource based on the data
            const isFacility = this.isFacilityData(transformedItem);

            if (isFacility) {
              await this.processFacility(transformedItem);
            } else {
              await this.processResource(transformedItem);
            }
          } catch (error) {
            console.error(`Error processing Apify data item:`, error, item);
            // Continue with next item - we don't want to stop the entire batch for one error
          }
        })
      );

      // Update processed items count
      updateSyncStatus(
        `Completed batch ${batchNumber} of ${totalBatches} (${Math.min(i + batch.length, data.length)} of ${data.length} items)`,
        Math.min(i + batch.length, data.length),
        data.length
      );

      console.log(`Completed batch ${batchNumber}`);
    }

    updateSyncStatus(`All ${data.length} items processed successfully`, data.length, data.length);
    console.log('All batches processed successfully');
  }

  /**
   * Transform Apify response item to our format
   * @param item Raw data item from Apify
   * @returns Transformed data in our application format
   */
  private transformApifyItem(item: ApifyDataItem): any {
    // Extract and transform reviews
    const reviews: Review[] = (item.reviews || []).map((review: any) => ({
      author: review.name || "Anonymous",
      date: review.publishAt || new Date().toISOString(),
      rating: review.stars || undefined,
      text: review.text || 'No review text',
      source: review.reviewOrigin || 'Google Maps'
    }));

    // Extract and transform photos
    const photos: Photo[] = [];

    // Add main image if available
    if (item.imageUrl) {
      photos.push({
        url: item.imageUrl,
        caption: `${item.title || 'Facility'} main image`,
        source: 'Google Maps'
      });
    }

    // Add additional images if available
    if (item.imageUrls && Array.isArray(item.imageUrls)) {
      item.imageUrls.forEach((imageUrl: string) => {
        photos.push({
          url: imageUrl,
          caption: '',
          source: 'Google Maps'
        });
      });
    }

    // Extract amenities from additionalInfo if available
    const amenities: string[] = [];
    if (item.additionalInfo) {
      for (const [category, options] of Object.entries(item.additionalInfo)) {
        if (Array.isArray(options)) {
          options.forEach((option: any) => {
            for (const [name, value] of Object.entries(option)) {
              if (value === true) {
                amenities.push(name);
              }
            }
          });
        }
      }
    }

    // Extract categories if available and add to amenities
    if (item.categories && Array.isArray(item.categories)) {
      amenities.push(...item.categories);
    }

    return {
      name: item.title || '',
      type: this.determineType(item.categoryName),
      address: item.address || '',
      city: item.city || '',
      state: item.state || 'CO',  // Default to Colorado
      zip: item.postalCode || '',
      phone: item.phone || item.phoneUnformatted || '',
      email: '',  // Not typically available from Google Maps
      website: item.website || '',
      description: item.description || this.generateDescription(item),
      amenities: amenities.length > 0 ? amenities : undefined,
      latitude: item.location?.lat?.toString() || '',
      longitude: item.location?.lng?.toString() || '',
      rating: item.totalScore?.toString() || null,
      reviews_count: item.reviewsCount || reviews.length || 0,
      reviews: reviews.length > 0 ? reviews : undefined,
      photos: photos.length > 0 ? photos : undefined,
      last_updated: new Date()
    };
  }

  /**
   * Determine the type/category of a facility/resource
   * @param categoryName Category name from Apify
   * @returns Standardized category for our application
   */
  private determineType(categoryName?: string): string {
    if (!categoryName) return 'other';

    const category = categoryName.toLowerCase();

    if (category.includes('senior') || category.includes('retirement') || category.includes('assisted')) {
      return 'senior_living';
    }
    if (category.includes('health') || category.includes('medical') || category.includes('care')) {
      return 'health_wellness';
    }
    if (category.includes('community') || category.includes('social') || category.includes('center')) {
      return 'social_community';
    }
    if (category.includes('transport')) {
      return 'transportation';
    }
    if (category.includes('financial') || category.includes('legal') || category.includes('attorney')) {
      return 'financial_legal';
    }

    return 'other';
  }

  /**
   * Generate a simple description if none is provided from Apify
   * @param item Apify data item
   * @returns Generated description text
   */
  private generateDescription(item: ApifyDataItem): string {
    let type = item.categoryName || 'resource';
    let location = item.city ? `in ${item.city}` : '';

    if (item.totalScore) {
      return `${item.title} is a ${type} ${location} with a rating of ${item.totalScore} out of 5 based on ${item.reviewsCount || 0} reviews.`;
    }

    return `${item.title} is a ${type} ${location}.`;
  }

  /**
   * Determine if data represents a facility or resource
   * @param item Transformed data item
   * @returns True if the item is a facility, false if it's a resource
   */
  private isFacilityData(item: any): boolean {
    // Logic to determine if this is a facility
    // For example, facilities typically have physical locations
    const facilityCategories = ['senior_living', 'assisted_living', 'nursing_home', 'retirement'];

    // Check if type matches facility categories
    if (item.type && facilityCategories.some(cat => item.type.includes(cat))) {
      return true;
    }

    // Check if it has a physical address (most facilities do)
    if (item.address && item.city && item.state) {
      return true;
    }

    // If it has latitude and longitude, it's likely a physical facility
    if (item.latitude && item.longitude) {
      return true;
    }

    return false;
  }

  /**
   * Process a facility data item from Apify
   * @param item Transformed facility data
   */
  private async processFacility(item: any): Promise<void> {
    // First check if this facility already exists in our database
    let facility: Facility | undefined;

    // Try to match by name and address if available
    if (item.name && item.address) {
      const facilities = await storage.searchFacilities(`${item.name} ${item.address}`);
      facility = facilities.find(f => 
        f.name.toLowerCase() === item.name.toLowerCase() && 
        f.address?.toLowerCase() === item.address?.toLowerCase()
      );
    }

    if (!facility) {
      // Create a new facility
      facility = await storage.createFacility({
        name: item.name,
        type: item.type || 'senior_living', // Default type
        address: item.address || 'Address unknown',
        city: item.city || 'City unknown',
        state: item.state || 'CO', // Default to Colorado
        zip: item.zip || '',
        phone: item.phone || 'Phone unknown',
        email: item.email || null,
        website: item.website || null,
        description: item.description || 'No description available',
        amenities: item.amenities || [],
        latitude: item.latitude || null,
        longitude: item.longitude || null,
        rating: item.rating || null,
        reviews_count: item.reviews_count || null,
        reviews: item.reviews || null,
        photos: item.photos || null,
        last_updated: new Date()
      });

      console.log(`Created new facility: ${facility.name}`);
    } else {
      // Update existing facility with Apify data
      await storage.updateFacilityWithApifyData(facility.id, {
        rating: item.rating,
        reviews_count: item.reviews_count,
        reviews: item.reviews,
        photos: item.photos,
        last_updated: new Date()
      });

      console.log(`Updated existing facility: ${facility.name}`);
    }
  }

  /**
   * Process a resource data item from Apify
   * @param item Transformed resource data
   */
  private async processResource(item: any): Promise<void> {
    // First check if this resource already exists in our database
    let resource: Resource | undefined;

    // Try to match by name
    if (item.name) {
      const resources = await storage.searchResources(item.name);
      resource = resources.find(r => r.name.toLowerCase() === item.name.toLowerCase());
    }

    if (!resource) {
      // Create a new resource
      resource = await storage.createResource({
        name: item.name,
        category: item.type || 'support_services',
        description: item.description || 'No description available',
        contact: item.phone || 'Contact information unavailable',
        website: item.website || null,
        address: item.address || null,
        city: item.city || null,
        state: item.state || null,
        zip: item.zip || null,
        rating: item.rating || null,
        reviews_count: item.reviews_count || null,
        reviews: item.reviews || null,
        photos: item.photos || null,
        last_updated: new Date()
      });

      console.log(`Created new resource: ${resource.name}`);
    } else {
      // Update existing resource with Apify data
      await storage.updateResourceWithApifyData(resource.id, {
        rating: item.rating,
        reviews_count: item.reviews_count,
        reviews: item.reviews,
        photos: item.photos,
        last_updated: new Date()
      });

      console.log(`Updated existing resource: ${resource.name}`);
    }
  }

  // Modify the runSyncJob method to use the correct input format for the compass~crawler-google-places actor
  public async runSyncJob(locations: string[] = ['Colorado', 'Denver', 'Boulder', 'Fort Collins']): Promise<void> {
    try {
      // Define search terms for senior resources
      const searchTerms = [
        'senior living',
        'assisted living',
        'retirement community',
        'nursing home',
        'senior care',
        'elder care',
        'memory care',
        'senior resources',
        'senior center',
        'senior services'
      ];

      // Convert location and search terms into proper query strings for google-places-crawler
      // For example, "senior living in Denver, CO"
      const queries: string[] = [];

      for (const term of searchTerms) {
        for (const location of locations) {
          queries.push(`${term} in ${location}, CO`);
        }
      }

      // Start the scraper with format for compass~crawler-google-places
      const runId = await this.runScraper(
        {
          searchStringsArray: queries,  // Changed from queries to searchStringsArray
          maxCrawledPlaces: 100,
          language: "en",
          includeReviews: true,
          maxReviews: 10
        },
        { waitForFinish: 0 } // Don't wait for completion, handle it asynchronously
      );

      // Start a background polling process to check status and process results
      this.pollAndProcessResults(runId)
        .then(() => {
          console.log('Apify data sync completed successfully');
        })
        .catch(error => {
          console.error('Error in Apify background processing:', error);
        });

      return;
    } catch (error) {
      console.error('Error in Apify sync job:', error);
      throw error;
    }
  }

  /**
   * Poll for results and process them when ready
   * @param runId The Apify run ID to poll
   */
  private async pollAndProcessResults(runId: string): Promise<void> {
    try {
      let isComplete = false;
      let retryCount = 0;
      const maxRetries = 60; // Retry for a longer time (up to ~30 minutes with exponential backoff)
      let retryDelay = 10000; // Start with 10 seconds
      const maxRetryDelay = 60000; // Max 1 minute between polls

      updateSyncStatus(`Waiting for Apify run ${runId} to complete...`);

      while (!isComplete && retryCount < maxRetries) {
        try {
          // Get the current status
          const status = await this.getRunStatus(runId);
          updateSyncStatus(`Apify run status: ${status} (check ${retryCount + 1} of ${maxRetries})`);

          if (status === 'SUCCEEDED') {
            // Job finished successfully, get the results
            isComplete = true;
            updateSyncStatus(`Apify run ${runId} completed, retrieving results...`);

            // Get the results
            const results = await this.getRunResults(runId);

            // Process and store the data
            await this.processAndStoreData(results);

            updateSyncStatus(`Completed processing ${results.length} items from Apify`, results.length, results.length);
            return;
          } else if (status === 'FAILED' || status === 'ABORTED') {
            // Job failed or was aborted
            isComplete = true;
            throw new Error(`Apify run failed with status: ${status}`);
          }
        } catch (error: any) {
          console.error(`Error checking Apify run status (attempt ${retryCount + 1}):`, error);
          // Only throw error if we've reached max retries
          if (retryCount >= maxRetries - 1) {
            throw error;
          }
        }

        // Wait before checking again (with exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay = Math.min(retryDelay * 1.5, maxRetryDelay);
        retryCount++;
      }

      if (!isComplete) {
        throw new Error(`Timeout waiting for Apify run to finish after ${maxRetries} retries`);
      }
    } catch (error: any) {
      updateSyncStatus(`Error processing Apify results: ${error.message}`, 0, 0);
      throw error;
    }
  }

}

// Create a singleton instance for use in the application
let apifyService: ApifyService | null = null;

export function getApifyService(): ApifyService {
  if (!apifyService) {
    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
      throw new Error('APIFY_API_KEY environment variable is not set');
    }
    apifyService = new ApifyService(apiKey);
  }
  return apifyService;
}