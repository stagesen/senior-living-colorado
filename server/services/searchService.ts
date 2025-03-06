import { storage } from "../storage";
import type { Facility, Resource } from "@shared/schema";

/**
 * SearchService provides enhanced search capabilities 
 * and prepares for future AI-powered search enhancements
 */
export class SearchService {
  /**
   * Perform a facility search with improved relevance and matching
   * @param query The search query string
   * @param limit Optional limit for pagination
   * @param offset Optional offset for pagination
   * @returns Promise with array of matching facilities
   */
  async searchFacilities(query: string, limit?: number, offset?: number): Promise<Facility[]> {
    // Parse and clean the search query
    const cleanQuery = this.preprocessQuery(query);
    
    // For now, delegate to the storage layer's enhanced search
    return await storage.searchFacilities(cleanQuery, limit, offset);
    
    // In the future, this is where we'll add OpenAI integration:
    // 1. Send query to OpenAI for semantic understanding
    // 2. Use expanded/enriched query for better search
    // 3. Potentially re-rank results based on relevance scores
  }
  
  /**
   * Perform a resource search with improved relevance and matching
   * @param query The search query string
   * @param limit Optional limit for pagination
   * @param offset Optional offset for pagination
   * @returns Promise with array of matching resources
   */
  async searchResources(query: string, limit?: number, offset?: number): Promise<Resource[]> {
    // Parse and clean the search query
    const cleanQuery = this.preprocessQuery(query);
    
    // For now, delegate to the storage layer's enhanced search
    return await storage.searchResources(cleanQuery, limit, offset);
    
    // This will also be enhanced with OpenAI later
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
   * @param limit Optional result limit
   * @param offset Optional result offset
   * @returns Promise with combined search results
   */
  async unifiedSearch(query: string, limit?: number, offset?: number): Promise<{
    facilities: Facility[],
    resources: Resource[]
  }> {
    // Calculate limits for each type to maintain the overall limit
    const typeLimit = limit ? Math.ceil(limit / 2) : undefined;
    
    // Perform both searches in parallel
    const [facilities, resources] = await Promise.all([
      this.searchFacilities(query, typeLimit, offset),
      this.searchResources(query, typeLimit, offset)
    ]);
    
    return {
      facilities,
      resources
    };
  }
}

// Export a singleton instance
export const searchService = new SearchService();
