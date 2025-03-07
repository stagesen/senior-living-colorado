import { facilities, resources, favorites, facilityServices, type Facility, type InsertFacility, type Resource, type InsertResource, type Review, type Photo, type Favorite, type FacilityService } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Facilities
  getFacilities(limit?: number, offset?: number): Promise<Facility[]>;
  getFacility(id: number): Promise<Facility | undefined>;
  getFacilitiesByType(type: string): Promise<Facility[]>;
  searchFacilities(query: string, limit?: number, offset?: number): Promise<Facility[]>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(id: number, facility: Partial<InsertFacility>): Promise<Facility | undefined>;

  // Resources
  getResources(limit?: number, offset?: number): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  searchResources(query: string, limit?: number, offset?: number): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;

  // Apify-related methods
  updateFacilityWithApifyData(id: number, apifyData: ApifyDataUpdate): Promise<Facility | undefined>;
  updateResourceWithApifyData(id: number, apifyData: ApifyDataUpdate): Promise<Resource | undefined>;

  // Favorites
  getFavorites(): Promise<Favorite[]>;
  addFavorite(type: string, itemId: number): Promise<Favorite>;
  removeFavorite(type: string, itemId: number): Promise<void>;
  isFavorite(type: string, itemId: number): Promise<boolean>;
  getFacilityServices(facilityId: number): Promise<FacilityService[]>;
}

// Interface for Apify data updates
export interface ApifyDataUpdate {
  rating?: string;
  reviews_count?: number;
  reviews?: Review[];
  photos?: Photo[];
  last_updated?: Date;
}

// Assuming Favorite type is defined elsewhere,  e.g., in @shared/schema
export interface Favorite {
    id?: number;
    type: string;
    itemId: number;
}

export class DatabaseStorage implements IStorage {
  // Facilities
  async getFacilities(limit?: number, offset?: number): Promise<Facility[]> {
    let query = db
      .select({
        facility: facilities,
        services: sql<FacilityService[]>`json_agg(${facilityServices})`
      })
      .from(facilities)
      .leftJoin(facilityServices, eq(facilities.id, facilityServices.facilityId))
      .groupBy(facilities.id)
      .orderBy(desc(facilities.name));

    // Apply pagination if provided
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    if (offset !== undefined) {
      query = query.offset(offset);
    }

    const results = await query;
    return results.map(r => ({
      ...r.facility,
      services: r.services.filter(Boolean) // Remove null entries from json_agg
    }));
  }

  async getFacility(id: number): Promise<Facility | undefined> {
    const results = await db
      .select({
        facility: facilities,
        services: sql<FacilityService[]>`json_agg(${facilityServices})`
      })
      .from(facilities)
      .leftJoin(facilityServices, eq(facilities.id, facilityServices.facilityId))
      .where(eq(facilities.id, id))
      .groupBy(facilities.id);

    if (results.length === 0) return undefined;

    return {
      ...results[0].facility,
      services: results[0].services.filter(Boolean)
    };
  }

  async getFacilitiesByType(type: string): Promise<Facility[]> {
    return await db.select().from(facilities).where(eq(facilities.type, type));
  }

  async searchFacilities(query: string, limit?: number, offset?: number): Promise<Facility[]> {
    // Process the search query to handle multiple words
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    // Build conditions for each search term
    const conditions = searchTerms.map(term => {
      const searchTerm = `%${term}%`;
      return or(
        ilike(facilities.name, searchTerm),
        ilike(facilities.description, searchTerm),
        ilike(facilities.city, searchTerm),
        ilike(facilities.address, searchTerm),
        ilike(facilities.state, searchTerm)
      );
    });

    // If there are multiple terms, require all terms to match somewhere
    let searchQuery = db.select().from(facilities);

    if (conditions.length > 0) {
      if (conditions.length === 1) {
        searchQuery = searchQuery.where(conditions[0]);
      } else {
        // For multiple terms, require each term to match somewhere in the record
        searchQuery = searchQuery.where(and(...conditions));
      }
    }

    // Order by relevance (name matches first, then description, etc.)
    searchQuery = searchQuery.orderBy(sql`
      CASE 
        WHEN ${facilities.name} ILIKE ${`%${query}%`} THEN 1
        WHEN ${facilities.address} ILIKE ${`%${query}%`} THEN 2
        WHEN ${facilities.city} ILIKE ${`%${query}%`} THEN 3
        WHEN ${facilities.description} ILIKE ${`%${query}%`} THEN 4
        ELSE 5
      END
    `);

    // Apply pagination if provided
    if (limit !== undefined) {
      searchQuery = searchQuery.limit(limit);
    }
    if (offset !== undefined) {
      searchQuery = searchQuery.offset(offset);
    }

    return await searchQuery;
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const [newFacility] = await db.insert(facilities).values(facility).returning();
    return newFacility;
  }

  async updateFacility(id: number, facilityUpdate: Partial<InsertFacility>): Promise<Facility | undefined> {
    const [updatedFacility] = await db
      .update(facilities)
      .set(facilityUpdate)
      .where(eq(facilities.id, id))
      .returning();
    return updatedFacility;
  }

  // Resources
  async getResources(limit?: number, offset?: number): Promise<Resource[]> {
    let query = db.select().from(resources).orderBy(desc(resources.name));

    // Apply pagination if provided
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    if (offset !== undefined) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return await db.select().from(resources).where(eq(resources.category, category));
  }

  async searchResources(query: string, limit?: number, offset?: number): Promise<Resource[]> {
    // Process the search query to handle multiple words
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    // Build conditions for each search term
    const conditions = searchTerms.map(term => {
      const searchTerm = `%${term}%`;
      return or(
        ilike(resources.name, searchTerm),
        ilike(resources.description, searchTerm),
        ilike(resources.city, searchTerm),
        ilike(resources.address, searchTerm),
        ilike(resources.category, searchTerm)
      );
    });

    // If there are multiple terms, require all terms to match somewhere
    let searchQuery = db.select().from(resources);

    if (conditions.length > 0) {
      if (conditions.length === 1) {
        searchQuery = searchQuery.where(conditions[0]);
      } else {
        // For multiple terms, require each term to match somewhere in the record
        searchQuery = searchQuery.where(and(...conditions));
      }
    }

    // Order by relevance (name matches first, then description, etc.)
    searchQuery = searchQuery.orderBy(sql`
      CASE 
        WHEN ${resources.name} ILIKE ${`%${query}%`} THEN 1
        WHEN ${resources.address} ILIKE ${`%${query}%`} THEN 2
        WHEN ${resources.city} ILIKE ${`%${query}%`} THEN 3
        WHEN ${resources.description} ILIKE ${`%${query}%`} THEN 4
        ELSE 5
      END
    `);

    // Apply pagination if provided
    if (limit !== undefined) {
      searchQuery = searchQuery.limit(limit);
    }
    if (offset !== undefined) {
      searchQuery = searchQuery.offset(offset);
    }

    return await searchQuery;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: number, resourceUpdate: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set(resourceUpdate)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  // Apify-related methods
  async updateFacilityWithApifyData(id: number, apifyData: ApifyDataUpdate): Promise<Facility | undefined> {
    const [updatedFacility] = await db
      .update(facilities)
      .set({
        ...apifyData,
        last_updated: apifyData.last_updated || new Date()
      })
      .where(eq(facilities.id, id))
      .returning();
    return updatedFacility;
  }

  async updateResourceWithApifyData(id: number, apifyData: ApifyDataUpdate): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set({
        ...apifyData,
        last_updated: apifyData.last_updated || new Date()
      })
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  // Favorites implementation
  async getFavorites(): Promise<Favorite[]> {
    return await db.select().from(favorites);
  }

  async addFavorite(type: string, itemId: number): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values({ type, itemId })
      .returning();
    return favorite;
  }

  async removeFavorite(type: string, itemId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.type, type),
          eq(favorites.itemId, itemId)
        )
      );
  }

  async isFavorite(type: string, itemId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.type, type),
          eq(favorites.itemId, itemId)
        )
      );
    return Boolean(favorite);
  }

  // Add new method to get facility services
  async getFacilityServices(facilityId: number): Promise<FacilityService[]> {
    return await db
      .select()
      .from(facilityServices)
      .where(eq(facilityServices.facilityId, facilityId));
  }
}

export const storage = new DatabaseStorage();