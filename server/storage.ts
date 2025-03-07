import { facilities, resources, favorites, type Facility, type InsertFacility, type Resource, type InsertResource, type Favorite } from "@shared/schema";
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

  // Favorites
  getFavorites(): Promise<Favorite[]>;
  addFavorite(type: string, itemId: number): Promise<Favorite>;
  removeFavorite(type: string, itemId: number): Promise<void>;
  isFavorite(type: string, itemId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Facilities
  async getFacilities(limit?: number, offset?: number): Promise<Facility[]> {
    let query = db.select().from(facilities);

    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getFacility(id: number): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility;
  }

  async getFacilitiesByType(type: string): Promise<Facility[]> {
    return await db.select().from(facilities).where(eq(facilities.type, type));
  }

  async searchFacilities(query: string, limit?: number, offset?: number): Promise<Facility[]> {
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

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

    let searchQuery = db.select().from(facilities);

    if (conditions.length > 0) {
      if (conditions.length === 1) {
        searchQuery = searchQuery.where(conditions[0]);
      } else {
        searchQuery = searchQuery.where(and(...conditions));
      }
    }

    if (limit) {
      searchQuery = searchQuery.limit(limit);
    }
    if (offset) {
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
    let query = db.select().from(resources);

    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
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
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    const conditions = searchTerms.map(term => {
      const searchTerm = `%${term}%`;
      return or(
        ilike(resources.name, searchTerm),
        ilike(resources.description, searchTerm),
        ilike(resources.category, searchTerm),
        ilike(resources.contact, searchTerm),
        ilike(resources.city, searchTerm)
      );
    });

    let searchQuery = db.select().from(resources);

    if (conditions.length > 0) {
      if (conditions.length === 1) {
        searchQuery = searchQuery.where(conditions[0]);
      } else {
        searchQuery = searchQuery.where(and(...conditions));
      }
    }

    if (limit) {
      searchQuery = searchQuery.limit(limit);
    }
    if (offset) {
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

  // Favorites
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
}

export const storage = new DatabaseStorage();