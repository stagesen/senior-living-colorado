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
  searchTerms: string[];
  locationTerms: string[];
  maxResults?: number;
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
  location?: {
    lat: number;
    lng: number;
  };
  additionalInfo?: any;        // Can contain amenities and other details
}

export class ApifyService {
  private apiKey: string;
  private actorId: string = 'apify/google-maps-scraper'; // Apify's Google Maps Scraper
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
      updateSyncStatus(`Starting Apify scraper with search terms: ${input.searchTerms.join(', ')}`);

      // Start the actor run - Fix: Use the correct URL format as per Apify docs
      const startResponse = await axios.post(
        `https://api.apify.com/v2/acts/${this.actorId}/runs?token=${this.apiKey}`,
        input,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const runId = startResponse.data.data.id;
      console.log(`Apify scraper started with run ID: ${runId}`);
      updateSyncStatus(`Apify scraper started with run ID: ${runId}`);

      // Wait for the run to finish if requested
      if (options.waitForFinish) {
        await this.waitForRun(runId, options.waitForFinish);
      }

      return runId;
    } catch (error: any) {
      console.error('Error running Apify scraper:', error.response?.data || error.message);
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

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getRunStatus(runId);
      console.log(`Run ${runId} status: ${status}`);
      updateSyncStatus(`Waiting for Apify run to complete, current status: ${status}`);

      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED') {
        console.log(`Run ${runId} finished with status: ${status}`);
        if (status !== 'SUCCEEDED') {
          updateSyncStatus(`Apify run failed with status: ${status}`);
          throw new Error(`Apify run failed with status: ${status}`);
        }
        return;
      }

      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retryDelay = Math.min(retryDelay * 1.5, maxRetryDelay);
    }

    updateSyncStatus(`Timeout waiting for Apify run to finish after ${timeoutSeconds} seconds`);
    throw new Error(`Timeout waiting for Apify run to finish after ${timeoutSeconds} seconds`);
  }

  /**
   * Get the status of an Apify run
   * @param runId The run ID to check
   * @returns The status of the run
   */
  private async getRunStatus(runId: string): Promise<string> {
    try {
      // Fix: Use the correct URL format as per Apify docs
      const response = await axios.get(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${this.apiKey}`
      );

      return response.data.data.status;
    } catch (error: any) {
      console.error('Error checking run status:', error.response?.data || error.message);
      throw new Error(`Failed to check run status: ${error.message}`);
    }
  }

  /**
   * Get results from a finished Apify run
   * @param runId The run ID to get results for
   * @returns Array of data items from the run
   */
  public async getRunResults(runId: string): Promise<ApifyDataItem[]> {
    try {
      updateSyncStatus(`Fetching results from Apify run: ${runId}`);
      // Fix: Use the correct URL format as per Apify docs
      const response = await axios.get(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${this.apiKey}`
      );

      updateSyncStatus(`Retrieved ${response.data.length} items from Apify`);
      return response.data;
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
      author: review.name || review.author || 'Anonymous',
      date: review.publishedAtDate || review.publishAt || new Date().toISOString(),
      rating: review.stars || review.rating || undefined,
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
    if (item.images && Array.isArray(item.images)) {
      item.images.forEach((image: any) => {
        photos.push({
          url: image.imageUrl || image.url,
          caption: image.caption || '',
          source: image.authorName ? `Photo by ${image.authorName}` : 'Google Maps'
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

    return {
      name: item.title,
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

  /**
   * Run a data synchronization job to update database with Apify data
   * @param locations Array of location names to search for (e.g., ["Denver", "Boulder"])
   */
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

      // Start the scraper
      const runId = await this.runScraper(
        {
          searchTerms,
          locationTerms: locations,
          maxResults: 100
        },
        { waitForFinish: 300 } // Wait up to 5 minutes
      );

      // Get the results
      const results = await this.getRunResults(runId);

      // Process and store the data
      await this.processAndStoreData(results);

      console.log('Apify data sync completed successfully');
    } catch (error) {
      console.error('Error in Apify sync job:', error);
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