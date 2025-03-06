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
  openingHours?: any[];
  email?: string;
  placeId?: string;            // Google Place ID for unique identification
  fid?: string;                // Another unique identifier from Google
}

export class ApifyService {
  private apiKey: string;
  private actorId: string = 'compass~crawler-google-places'; // Using actor shown in docs
  private batchSize = 10; // Number of items to process in parallel

  // Statistics tracking for deduplication
  private stats = {
    facilitiesCreated: 0,
    facilitiesUpdated: 0,
    facilitiesSkipped: 0,
    resourcesCreated: 0,
    resourcesUpdated: 0,
    resourcesSkipped: 0,
    itemsErrored: 0,
    uniqueGoogleIds: new Set<string>()  // Track unique Google IDs to prevent duplicates
  };

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

    // Reset statistics for this processing run
    this.resetStats();

    // First pass: create a map of unique Google IDs to detect duplicates within this batch
    const uniqueItems = new Map<string, ApifyDataItem>();
    let duplicatesWithinBatch = 0;

    for (const item of data) {
      // Check if we have a unique identifier (Google Place ID or FID)
      const uniqueId = this.getUniqueIdentifier(item);

      if (uniqueId) {
        if (!uniqueItems.has(uniqueId)) {
          uniqueItems.set(uniqueId, item);
        } else {
          duplicatesWithinBatch++;
          // If this is a duplicate, we'll keep the more complete record
          const existingItem = uniqueItems.get(uniqueId)!;
          const existingCompleteness = this.calculateDataCompleteness(existingItem);
          const newCompleteness = this.calculateDataCompleteness(item);

          if (newCompleteness > existingCompleteness) {
            uniqueItems.set(uniqueId, item);
            console.log(`Replaced duplicate item with more complete version (ID: ${uniqueId})`);
          }
        }
      } else {
        // If there's no unique ID, we'll still process the item (can't deduplicate)
        uniqueItems.set(`unknown-${item.title}-${Date.now()}-${Math.random()}`, item);
      }
    }

    console.log(`Found ${duplicatesWithinBatch} duplicates within this batch. Processing ${uniqueItems.size} unique items.`);

    // Process data in batches to avoid overwhelming the system
    let processedCount = 0;
    const uniqueItemsArray = Array.from(uniqueItems.values());

    for (let i = 0; i < uniqueItemsArray.length; i += this.batchSize) {
      const batch = uniqueItemsArray.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(uniqueItemsArray.length / this.batchSize);

      console.log(`Processing batch ${batchNumber} of ${totalBatches}, size: ${batch.length}`);
      updateSyncStatus(
        `Processing batch ${batchNumber} of ${totalBatches} (${processedCount} of ${uniqueItemsArray.length} items)`, 
        processedCount, 
        uniqueItemsArray.length
      );

      // Process items sequentially to better track issues
      for (const item of batch) {
        try {
          // Transform the Apify item to our format
          console.log(`Transforming item: "${item.title || 'Unnamed item'}"`);
          const transformedItem = this.transformApifyItem(item);

          // Determine if this is a facility or resource based on the data
          const isFacility = this.isFacilityData(transformedItem);
          console.log(`Item "${transformedItem.name}" classified as: ${isFacility ? 'FACILITY' : 'RESOURCE'}`);

          // Store the unique identifier from Google if available
          const uniqueId = this.getUniqueIdentifier(item);
          if (uniqueId) {
            transformedItem.external_id = uniqueId;
          }

          if (isFacility) {
            await this.processFacility(transformedItem);
          } else {
            await this.processResource(transformedItem);
          }
        } catch (error: any) {
          this.stats.itemsErrored++;
          console.error(`Error processing Apify data item:`, error);
          console.error('Item data:', JSON.stringify(item, null, 2));
          // Continue with next item - we don't want to stop the entire batch for one error
        }

        processedCount++;
      }

      // Update processed items count
      updateSyncStatus(
        `Completed batch ${batchNumber} of ${totalBatches} (${processedCount} of ${uniqueItemsArray.length} items)`,
        processedCount,
        uniqueItemsArray.length
      );

      console.log(`Completed batch ${batchNumber}`);
    }

    // Get final counts
    const facilities = await storage.getFacilities();
    const resources = await storage.getResources();

    console.log(`
===== APIFY DATA PROCESSING COMPLETE =====
Total items processed: ${uniqueItemsArray.length}
- Facilities created: ${this.stats.facilitiesCreated}
- Facilities updated: ${this.stats.facilitiesUpdated}
- Facilities skipped (duplicates): ${this.stats.facilitiesSkipped}
- Resources created: ${this.stats.resourcesCreated}
- Resources updated: ${this.stats.resourcesUpdated}
- Resources skipped (duplicates): ${this.stats.resourcesSkipped}
- Items with errors: ${this.stats.itemsErrored}
- Unique Google IDs: ${this.stats.uniqueGoogleIds.size}

Current database counts:
- Total facilities: ${facilities.length}
- Total resources: ${resources.length}
====================================
    `);

    updateSyncStatus(`All ${uniqueItemsArray.length} items processed successfully`, uniqueItemsArray.length, uniqueItemsArray.length);
  }

  /**
   * Reset statistics for a new processing run
   */
  private resetStats(): void {
    this.stats = {
      facilitiesCreated: 0,
      facilitiesUpdated: 0,
      facilitiesSkipped: 0,
      resourcesCreated: 0,
      resourcesUpdated: 0,
      resourcesSkipped: 0,
      itemsErrored: 0,
      uniqueGoogleIds: new Set<string>()
    };
  }

  /**
   * Get a unique identifier from an Apify item if available
   * @param item Apify data item
   * @returns Unique identifier string or undefined
   */
  private getUniqueIdentifier(item: ApifyDataItem): string | undefined {
    // Try to get Google Place ID first
    if (item.placeId && item.placeId.length > 5) {
      return `google_place_${item.placeId}`;
    }

    // Try to get Google FID as backup
    if (item.fid && item.fid.length > 5) {
      return `google_fid_${item.fid}`;
    }

    // No reliable unique identifier found
    return undefined;
  }

  /**
   * Calculate how complete a data item is (more fields = more complete)
   * @param item Data item to evaluate
   * @returns Numeric score representing completeness
   */
  private calculateDataCompleteness(item: ApifyDataItem): number {
    let score = 0;

    // Add points for each significant field that has data
    if (item.title) score += 1;
    if (item.description) score += 2;
    if (item.address) score += 1;
    if (item.city) score += 1;
    if (item.state) score += 1;
    if (item.phone || item.phoneUnformatted) score += 1;
    if (item.website) score += 1;
    if (item.email) score += 1;
    if (item.totalScore) score += 1;
    if (item.reviewsCount && item.reviewsCount > 0) score += 1;
    if (item.reviews && item.reviews.length > 0) score += 2;
    if (item.imageUrl) score += 1;
    if (item.images && item.images.length > 0) score += 2;
    if (item.imageUrls && item.imageUrls.length > 0) score += 2;
    if (item.location && item.location.lat && item.location.lng) score += 2;
    if (item.categories && item.categories.length > 0) score += 2;
    if (item.openingHours && item.openingHours.length > 0) score += 1;
    if (item.additionalInfo && Object.keys(item.additionalInfo).length > 0) score += 2;

    return score;
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

    // Extract opening hours if available
    if (item.openingHours && Array.isArray(item.openingHours)) {
      amenities.push('Hours: ' + item.openingHours.map((hour: any) => 
        `${hour.day}: ${hour.hours}`).join(', '));
    }

    // Build a better description if none is provided
    let description = item.description || '';
    if (!description) {
      description = this.generateDescription(item);
    }

    // Ensure we have a valid email (this field is often missing in Google Places data)
    const email = item.email || '';

    // Add unique identifiers from Google
    const external_id = this.getUniqueIdentifier(item);

    return {
      name: item.title || '',
      type: this.determineType(item.categoryName),
      address: item.address || '',
      city: item.city || '',
      state: item.state || 'CO',  // Default to Colorado
      zip: item.postalCode || '',
      phone: item.phone || item.phoneUnformatted || '',
      email: email,
      website: item.website || '',
      description: description,
      amenities: amenities.length > 0 ? amenities : undefined,
      latitude: item.location?.lat?.toString() || '',
      longitude: item.location?.lng?.toString() || '',
      rating: item.totalScore?.toString() || null,
      reviews_count: item.reviewsCount || reviews.length || 0,
      reviews: reviews.length > 0 ? reviews : undefined,
      photos: photos.length > 0 ? photos : undefined,
      last_updated: new Date(),
      external_id: external_id  // Store Google's unique ID to help prevent duplicates
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
    let amenities = '';

    if (item.categories && item.categories.length > 0) {
      amenities = ` specializing in ${item.categories.slice(0, 3).join(', ')}`;
    }

    if (item.totalScore) {
      return `${item.title} is a ${type} ${location}${amenities} with a rating of ${item.totalScore} out of 5 based on ${item.reviewsCount || 0} reviews.`;
    }

    return `${item.title} is a ${type} ${location}${amenities}.`;
  }

  /**
   * Calculate string similarity score (0-1)
   * Higher score = more similar
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score between 0 and 1
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Exact match
    if (s1 === s2) return 1;

    // Check if one is a substring of the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const maxLength = Math.max(s1.length, s2.length);
      const minLength = Math.min(s1.length, s2.length);
      return minLength / maxLength; // Longer overlap = higher similarity
    }

    // Simple word overlap calculation
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));

    let commonWords = 0;
    for (const word of words1) {
      if (words2.has(word)) commonWords++;
    }

    return commonWords / Math.max(words1.size, words2.size);
  }

  /**
   * Determine if data represents a facility or resource
   * @param item Transformed data item
   * @returns True if the item is a facility, false if it's a resource
   */
  private isFacilityData(item: any): boolean {
    console.log(`Determining if "${item.name}" is a facility or resource...`);
    // Keep track of criteria matches for logging
    const matchingCriteria: string[] = [];

    // List of keywords likely to appear in facility/senior living names or types
    const facilityKeywords = [
      'senior', 'assisted', 'living', 'retirement', 'nursing', 'care', 'home', 
      'residence', 'residential', 'apartments', 'community', 'village'
    ];

    // Check if type matches facility categories
    if (item.type) {
      const facilityCategories = ['senior_living', 'assisted_living', 'nursing_home', 'retirement', 'memory_care'];
      if (facilityCategories.some(cat => item.type.includes(cat))) {
        matchingCriteria.push('type_match');
      }
    }

    // Check for facility keywords in name
    if (item.name) {
      const lowerName = item.name.toLowerCase();
      if (facilityKeywords.some(keyword => lowerName.includes(keyword))) {
        matchingCriteria.push('name_keyword_match');
      }
    }

    // Check if it has a physical address (most facilities do)
    if (item.address && item.city && item.state) {
      matchingCriteria.push('full_address_match');
    }

    // If it has latitude and longitude, it's likely a physical facility
    if (item.latitude && item.longitude) {
      matchingCriteria.push('coordinates_match');
    }

    // Check if categoryName contains facility-related terms
    if (item.categoryName) {
      const lowerCategory = item.categoryName.toLowerCase();
      if (facilityKeywords.some(keyword => lowerCategory.includes(keyword))) {
        matchingCriteria.push('category_keyword_match');
      }
    }

    const isFacility = matchingCriteria.length > 0;
    console.log(`Classification result for "${item.name}": ${isFacility ? 'FACILITY' : 'RESOURCE'} (matched criteria: ${matchingCriteria.join(', ') || 'none'})`);

    return isFacility;
  }

  /**
   * Process a facility data item from Apify
   * @param item Transformed facility data
   */
  private async processFacility(item: any): Promise<void> {
    try {
      // Track the Google ID if available to prevent duplicates
      if (item.external_id) {
        if (this.stats.uniqueGoogleIds.has(item.external_id)) {
          console.log(`Skipping duplicate facility by external ID: ${item.external_id}`);
          this.stats.facilitiesSkipped++;
          return;
        }
        this.stats.uniqueGoogleIds.add(item.external_id);
      }

      // First check if this facility already exists in our database
      let facility: Facility | undefined;
      let isNewFacility = false;

      // Check by external_id first (most reliable)
      if (item.external_id) {
        // This is a custom query to find by external_id
        try {
          const results = await storage.searchFacilities(`external_id:${item.external_id}`);
          if (results.length > 0) {
            facility = results[0];
            console.log(`Matched existing facility by external_id: ${facility.name} (ID: ${facility.id})`);
          }
        } catch (err) {
          // If this fails, we'll fall back to other matching methods
          console.log(`External ID search failed, falling back to name/address matching`);
        }
      }

      // If no match by external_id, try name and address
      if (!facility && item.name && item.address) {
        console.log(`Looking for existing facility: "${item.name}" at "${item.address}"`);

        // First try an exact match search
        const exactMatches = await storage.searchFacilities(`"${item.name}" "${item.address}"`);
        console.log(`Found ${exactMatches.length} exact matches in database`);

        // Then try a broader search if no exact matches
        const broadMatches = exactMatches.length === 0 ? 
          await storage.searchFacilities(`${item.name}`) : [];
        console.log(`Found ${broadMatches.length} broad matches by name in database`);

        // Combine the results
        const facilities = [...exactMatches, ...broadMatches];

        // First try to find an exact match by name and address
        facility = facilities.find(f => 
          f.name.toLowerCase() === item.name.toLowerCase() && 
          f.address?.toLowerCase() === item.address?.toLowerCase()
        );

        // If no exact match, look for a close match using advanced similarity
        if (!facility && facilities.length > 0) {
          let bestMatchScore = 0;
          let bestMatchFacility: Facility | undefined;

          for (const f of facilities) {
            // Calculate combined similarity score for name and address
            const nameSimilarity = this.calculateStringSimilarity(f.name, item.name);
            const addressSimilarity = f.address ? this.calculateStringSimilarity(f.address, item.address) : 0;

            // Weight name more heavily than address (70% name, 30% address)
            const combinedScore = (nameSimilarity * 0.7) + (addressSimilarity * 0.3);

            // Consider it a match if combined score is high enough
            if (combinedScore > 0.7 && combinedScore > bestMatchScore) {
              bestMatchScore = combinedScore;
              bestMatchFacility = f;
            }
          }

          if (bestMatchFacility) {
            facility = bestMatchFacility;
            console.log(`Found similar facility match with score ${bestMatchScore.toFixed(2)}: ${facility.name} (ID: ${facility.id})`);
          }
        }

        if (facility) {
          console.log(`Matched existing facility: ${facility.name} (ID: ${facility.id})`);
        }
      }

      if (!facility) {
        // Create a new facility
        console.log(`Creating new facility: "${item.name}"`);
        isNewFacility = true;

        try {
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
            external_id: item.external_id || null,
            last_updated: new Date()
          });

          console.log(`Successfully created new facility: ${facility.name} (ID: ${facility.id})`);
          this.stats.facilitiesCreated++;
        } catch (error: any) {
          console.error(`Error creating facility "${item.name}":`, error.message);
          // Log detailed error info but don't throw to continue processing other items
          console.error('Item data:', JSON.stringify(item, null, 2));
          return;
        }
      } else {
        // Update existing facility with Apify data
        console.log(`Updating existing facility: ${facility.name} (ID: ${facility.id})`);

        try {
          // Update it with new data from Apify
          const updateData: any = {
            rating: item.rating,
            reviews_count: item.reviews_count,
            reviews: item.reviews,
            photos: item.photos,
            last_updated: new Date()
          };

          // Add external_id if we have it and the facility doesn't
          if (item.external_id && !facility.external_id) {
            updateData.external_id = item.external_id;
          }

          await storage.updateFacilityWithApifyData(facility.id, updateData);

          console.log(`Successfully updated facility: ${facility.name} (ID: ${facility.id})`);
          this.stats.facilitiesUpdated++;
        } catch (error: any) {
          console.error(`Error updating facility "${facility.name}" (ID: ${facility.id}):`, error.message);
          // Log but don't throw
          return;
        }
      }
    } catch (error: any) {
      console.error(`Unexpected error processing facility:`, error);
      // Don't throw so we can continue processing other items
    }
  }

  /**
   * Process a resource data item from Apify
   * @param item Transformed resource data
   */
  private async processResource(item: any): Promise<void> {
    try {
      // Track the Google ID if available to prevent duplicates
      if (item.external_id) {
        if (this.stats.uniqueGoogleIds.has(item.external_id)) {
          console.log(`Skipping duplicate resource by external ID: ${item.external_id}`);
          this.stats.resourcesSkipped++;
          return;
        }
        this.stats.uniqueGoogleIds.add(item.external_id);
      }

      // First check if this resource already exists in our database
      let resource: Resource | undefined;
      let isNewResource = false;

      // Check by external_id first (most reliable)
      if (item.external_id) {
        // This is a custom query to find by external_id
        try {
          const results = await storage.searchResources(`external_id:${item.external_id}`);
          if (results.length > 0) {
            resource = results[0];
            console.log(`Matched existing resource by external_id: ${resource.name} (ID: ${resource.id})`);
          }
        } catch (err) {
          // If this fails, we'll fall back to other matching methods
          console.log(`External ID search failed, falling back to name matching`);
        }
      }

      // If no match by external_id, try name
      if (!resource && item.name) {
        console.log(`Looking for existing resource: "${item.name}"`);
        const resources = await storage.searchResources(item.name);

        // Log the search results
        console.log(`Found ${resources.length} potential matches in database`);

        // Try to find exact name match first
        resource = resources.find(r => r.name.toLowerCase() === item.name.toLowerCase());

        // If no exact match, look for similar names
        if (!resource && resources.length > 0) {
          let bestMatchScore = 0;
          let bestMatchResource: Resource | undefined;

          for (const r of resources) {
            const nameSimilarity = this.calculateStringSimilarity(r.name, item.name);

            // Consider it a match if name similarity is high enough
            if (nameSimilarity > 0.8 && nameSimilarity > bestMatchScore) {
              bestMatchScore = nameSimilarity;
              bestMatchResource = r;
            }
          }

          if (bestMatchResource) {
            resource = bestMatchResource;
            console.log(`Found similar resource match with score ${bestMatchScore.toFixed(2)}: ${resource.name} (ID: ${resource.id})`);
          }
        }

        if (resource) {
          console.log(`Matched existing resource: ${resource.name} (ID: ${resource.id})`);
        }
      }

      if (!resource) {
        // Create a new resource
        console.log(`Creating new resource: "${item.name}"`);
        isNewResource = true;

        try {
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
            external_id: item.external_id || null,
            last_updated: new Date()
          });

          console.log(`Successfully created new resource: ${resource.name} (ID: ${resource.id})`);
          this.stats.resourcesCreated++;
        } catch (error: any) {
          console.error(`Error creating resource "${item.name}":`, error.message);
          // Log detailed error info but don't throw to continue processing other items
          console.error('Item data:', JSON.stringify(item, null, 2));
          return;
        }
      } else {
        // Update existing resource with Apify data
        console.log(`Updating existing resource: ${resource.name} (ID: ${resource.id})`);

        try {
          // Update it with new data from Apify
          const updateData: any = {
            rating: item.rating,
            reviews_count: item.reviews_count,
            reviews: item.reviews,
            photos: item.photos,
            last_updated: new Date()
          };

          // Add external_id if we have it and the resource doesn't
          if (item.external_id && !resource.external_id) {
            updateData.external_id = item.external_id;
          }

          await storage.updateResourceWithApifyData(resource.id, updateData);

          console.log(`Successfully updated resource: ${resource.name} (ID: ${resource.id})`);
          this.stats.resourcesUpdated++;
        } catch (error: any) {
          console.error(`Error updating resource "${resource.name}" (ID: ${resource.id}):`, error.message);
          // Log but don't throw
          return;
        }
      }
    } catch (error: any) {
      console.error(`Unexpected error processing resource:`, error);
      // Don't throw so we can continue processing other items
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