import { storage } from "../storage";
import type { Facility, Resource } from "@shared/schema";

/**
 * SearchService provides enhanced search capabilities 
 * and prepares for future AI-powered search enhancements
 */
export class SearchService {
  // Location mappings updated with comprehensive Front Range coverage
  private locationMapping: Record<string, string[]> = {
    'denver_metro': ['denver', 'metro', 'downtown', 'capitol hill', 'cherry creek', 'washington park', 'highland'],
    'boulder_broomfield': ['boulder', 'broomfield', 'louisville', 'lafayette', 'superior', 'gunbarrel'],
    'jefferson_county': ['golden', 'arvada', 'wheat ridge', 'lakewood', 'morrison', 'evergreen'],
    'arapahoe_county': ['aurora', 'centennial', 'englewood', 'littleton', 'greenwood village', 'cherry hills'],
    'douglas_county': ['castle rock', 'parker', 'highlands ranch', 'lone tree', 'roxborough'],
    'larimer_county': ['fort collins', 'loveland', 'estes park', 'windsor', 'timnath'],
    'weld_county': ['greeley', 'evans', 'windsor', 'johnstown', 'frederick'],
    'colorado_springs': ['colorado springs', 'manitou springs', 'fountain', 'monument'],
    'northern_colorado': ['longmont', 'berthoud', 'mead', 'firestone', 'frederick', 'dacono'],
    'western_suburbs': ['golden', 'morrison', 'lakewood', 'wheat ridge'],
    'eastern_suburbs': ['aurora', 'bennett', 'strasburg', 'watkins'],
    'southern_suburbs': ['centennial', 'parker', 'castle rock', 'sedalia'],
    'mountain_communities': ['evergreen', 'conifer', 'bailey', 'morrison', 'idaho springs']
  };

  // Enhanced care type categorization
  private careTypeMapping: Record<string, string[]> = {
    'independent_living': [
      'independent living',
      'retirement community',
      '55+ community',
      'active adult',
      'senior apartments'
    ],
    'assisted_living': [
      'assisted living',
      'personal care',
      'residential care',
      'board and care',
      'adult care home'
    ],
    'memory_care': [
      'memory care',
      'alzheimers care',
      'dementia care',
      'cognitive care',
      'secured memory unit'
    ],
    'skilled_nursing': [
      'skilled nursing',
      'rehabilitation',
      'nursing home',
      'long term care',
      'post-acute care'
    ],
    'continuing_care': [
      'continuing care',
      'life plan community',
      'CCRC',
      'tiered care',
      'progressive care'
    ],
    'respite_care': [
      'respite care',
      'short term stay',
      'temporary care',
      'relief care',
      'adult day care'
    ],
    'hospice_care': [
      'hospice',
      'end of life care',
      'palliative care',
      'comfort care'
    ]
  };

  /**
   * Perform a facility search with improved relevance and matching
   * @param query The search query string
   * @param filters Optional filters (category, location, needs)
   * @param limit Optional limit for pagination
   * @param offset Optional result offset for pagination
   * @returns Promise with array of matching facilities
   */
  async searchFacilities(
    query: string, 
    filters?: { 
      category?: string, 
      location?: string, 
      needs?: string[] 
    },
    limit?: number, 
    offset?: number
  ): Promise<Facility[]> {
    // Parse and clean the search query
    const cleanQuery = this.preprocessQuery(query);
    console.log(`[SearchService] Searching facilities with query: "${cleanQuery}" and filters:`, filters);

    // For now, delegate to the storage layer's enhanced search
    let results = await storage.searchFacilities(cleanQuery, limit, offset);
    console.log(`[SearchService] Initial results count: ${results.length}`);

    // Apply filters if provided
    if (filters) {
      if (filters.location) {
        // Get mapped locations or use the original location value
        const locationTerms = this.getEnhancedLocationTerms(filters.location);
        console.log(`[SearchService] Filtering by location terms:`, locationTerms);

        const beforeCount = results.length;
        results = results.filter(facility => {
          // Check if any location term is present in the address, city, or state
          const matches = locationTerms.some(term => 
            facility.city?.toLowerCase().includes(term.toLowerCase()) || 
            (facility.address && facility.address.toLowerCase().includes(term.toLowerCase())) ||
            facility.state?.toLowerCase().includes(term.toLowerCase()) ||
            (facility.county && facility.county.toLowerCase().includes(term.toLowerCase())) ||
            (facility.zip && facility.zip.includes(term))
          );

          // For debugging specific facilities
          if (facility.city?.toLowerCase().includes('littleton') && !matches) {
            console.log(`[SearchService] Facility in Littleton not matching location filter:`, 
              { id: facility.id, name: facility.name, city: facility.city, address: facility.address });
          }

          return matches;
        });
        console.log(`[SearchService] After location filter: ${results.length} (removed ${beforeCount - results.length})`);
      }

      if (filters.category) {
        // Get mapped categories or use the original
        const categoryTerms = this.getEnhancedCareTypeTerms(filters.category);
        console.log(`[SearchService] Filtering by care type terms:`, categoryTerms);

        const beforeCount = results.length;
        results = results.filter(facility => 
          // Check if any of the category terms match the facility type
          categoryTerms.some(term => 
            facility.type?.toLowerCase().includes(term.toLowerCase())
          ) ||
          // Or check if any amenities contain the category terms
          (facility.amenities && 
            facility.amenities.some(a => 
              categoryTerms.some(term => 
                a.toLowerCase().includes(term.toLowerCase())
              )
            )
          )
        );
        console.log(`[SearchService] After category filter: ${results.length} (removed ${beforeCount - results.length})`);
      }

      if (filters.needs && filters.needs.length > 0) {
        console.log(`[SearchService] Filtering by needs:`, filters.needs);
        const beforeCount = results.length;
        results = results.filter(facility => {
          // Check if any of the facility's amenities match any of the needs
          if (!facility.amenities) return false;

          return filters.needs!.some(need => 
            facility.amenities!.some(a => a.toLowerCase().includes(need.toLowerCase()))
          );
        });
        console.log(`[SearchService] After needs filter: ${results.length} (removed ${beforeCount - results.length})`);
      }
    }

    console.log(`[SearchService] Final results count: ${results.length}`);
    return results;
  }

  /**
   * Perform a resource search with improved relevance and matching
   * @param query The search query string
   * @param filters Optional filters (category, location, needs)
   * @param limit Optional limit for pagination
   * @param offset Optional offset for pagination
   * @returns Promise with array of matching resources
   */
  async searchResources(
    query: string, 
    filters?: { 
      category?: string, 
      location?: string, 
      needs?: string[] 
    },
    limit?: number, 
    offset?: number
  ): Promise<Resource[]> {
    // Parse and clean the search query
    const cleanQuery = this.preprocessQuery(query);

    // For now, delegate to the storage layer's enhanced search
    let results = await storage.searchResources(cleanQuery, limit, offset);

    // Apply filters if provided
    if (filters) {
      if (filters.category) {
        const categoryMapping: Record<string, string[]> = {
          'senior_living': ['assisted living', 'nursing home', 'retirement', 'senior', 'elder'],
          'health_wellness': ['health', 'wellness', 'medical', 'therapy', 'care'],
          'transportation': ['transportation', 'mobility', 'transit', 'ride'],
          'financial_legal': ['financial', 'legal', 'estate', 'attorney', 'planning'],
          'education_learning': ['education', 'learning', 'class', 'workshop', 'training']
        };

        // Get mapped categories or use the original
        const categoryTerms = categoryMapping[filters.category] || [filters.category.replace('_', ' ')];

        results = results.filter(resource => 
          // Check if any category term matches resource category
          categoryTerms.some(term => 
            resource.category?.toLowerCase().includes(term.toLowerCase())
          ) ||
          // Or check description
          categoryTerms.some(term => 
            resource.description?.toLowerCase().includes(term.toLowerCase())
          )
        );
      }

      if (filters.location) {
        const locationTerms = this.getEnhancedLocationTerms(filters.location);

        results = results.filter(resource => {
          // Check if any location term is present in the address, city, or state
          return locationTerms.some(term => 
            resource.city?.toLowerCase().includes(term.toLowerCase()) || 
            (resource.address && resource.address.toLowerCase().includes(term.toLowerCase())) ||
            resource.state?.toLowerCase().includes(term.toLowerCase()) ||
            (resource.zip && resource.zip.includes(term))
          );
        });
      }

      // For resources, "needs" filtering is more generic since resources don't have an amenities array
      if (filters.needs && filters.needs.length > 0) {
        results = results.filter(resource => {
          return filters.needs!.some(need => 
            resource.description?.toLowerCase().includes(need.toLowerCase()) ||
            resource.name?.toLowerCase().includes(need.toLowerCase()) ||
            resource.category?.toLowerCase().includes(need.toLowerCase())
          );
        });
      }
    }

    return results;
  }

  /**
   * Clean and normalize search queries for better matching
   * @param query The raw search query from user input
   * @returns Cleaned and normalized query
   */
  private preprocessQuery(query: string): string {
    // Remove excess whitespace and lowercase
    let cleanQuery = query.trim().toLowerCase();

    // Handle special characters
    cleanQuery = cleanQuery.replace(/[^\w\s]/g, ' ');

    // Normalize whitespace
    cleanQuery = cleanQuery.replace(/\s+/g, ' ');

    // Remove common stop words (consider more sophisticated NLP later)
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const words = cleanQuery.split(' ').filter(word => !stopWords.includes(word));

    // Rejoin meaningful words
    cleanQuery = words.join(' ');

    return cleanQuery;
  }

  /**
   * Perform a unified search across both facilities and resources
   * This will be useful for global search functionality
   * @param query The search query
   * @param filters Optional filters (category, location, needs)
   * @param limit Optional result limit
   * @param offset Optional result offset
   * @returns Promise with combined search results
   */
  async unifiedSearch(
    query: string, 
    filters?: { 
      category?: string, 
      location?: string, 
      needs?: string[] 
    },
    limit?: number, 
    offset?: number
  ): Promise<{
    facilities: Facility[],
    resources: Resource[]
  }> {
    // Calculate limits for each type to maintain the overall limit
    const typeLimit = limit ? Math.ceil(limit / 2) : undefined;

    // Perform both searches in parallel
    const [facilities, resources] = await Promise.all([
      this.searchFacilities(query, filters, typeLimit, offset),
      this.searchResources(query, filters, typeLimit, offset)
    ]);

    return {
      facilities,
      resources
    };
  }

  private getEnhancedLocationTerms(location: string): string[] {
    return this.locationMapping[location] || [location.replace('_', ' ')];
  }

  private getEnhancedCareTypeTerms(careType: string): string[] {
    return this.careTypeMapping[careType] || [careType.replace('_', ' ')];
  }
}

// Export a singleton instance
export const searchService = new SearchService();