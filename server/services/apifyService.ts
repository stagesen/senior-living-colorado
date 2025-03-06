import axios from 'axios';
import { Facility, Resource, Review, Photo } from '@shared/schema';
import { storage } from '../storage';

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

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Run an Apify actor to scrape senior living data
   */
  public async runScraper(input: ApifyRunInput, options: ApifyRunOptions = {}) {
    try {
      console.log(`Starting Apify scraper with input:`, input);

      // Start the actor run
      const startResponse = await axios.post(
        `https://api.apify.com/v2/acts/${this.actorId}/runs`,
        input,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const runId = startResponse.data.data.id;
      console.log(`Apify scraper started with run ID: ${runId}`);

      // Wait for the run to finish if requested
      if (options.waitForFinish) {
        await this.waitForRun(runId, options.waitForFinish);
      }

      return runId;
    } catch (error) {
      console.error('Error running Apify scraper:', error);
      throw new Error(`Failed to run Apify scraper: ${error}`);
    }
  }

  /**
   * Wait for an Apify run to finish
   */
  private async waitForRun(runId: string, timeoutSeconds: number): Promise<void> {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getRunStatus(runId);
      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED') {
        console.log(`Run ${runId} finished with status: ${status}`);
        if (status !== 'SUCCEEDED') {
          throw new Error(`Apify run failed with status: ${status}`);
        }
        return;
      }

      // Wait for 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error(`Timeout waiting for Apify run to finish`);
  }

  /**
   * Get the status of an Apify run
   */
  private async getRunStatus(runId: string): Promise<string> {
    const response = await axios.get(
      `https://api.apify.com/v2/actor-runs/${runId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );

    return response.data.data.status;
  }

  /**
   * Get results from a finished Apify run
   */
  public async getRunResults(runId: string): Promise<ApifyDataItem[]> {
    try {
      const response = await axios.get(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Apify results:', error);
      throw new Error(`Failed to fetch Apify results: ${error}`);
    }
  }

  /**
   * Process and store Apify data into our database
   */
  public async processAndStoreData(data: ApifyDataItem[]): Promise<void> {
    console.log(`Processing ${data.length} items from Apify`);

    for (const item of data) {
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
        // Continue with next item
      }
    }
  }

  /**
   * Transform Apify response item to our format
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