import { facilities, resources, type Facility, type InsertFacility, type Resource, type InsertResource, type Review, type Photo } from "@shared/schema";
import { db } from "./db";
import { eq, like, or, and, desc } from "drizzle-orm";

export interface IStorage {
  // Facilities
  getFacilities(): Promise<Facility[]>;
  getFacility(id: number): Promise<Facility | undefined>;
  getFacilitiesByType(type: string): Promise<Facility[]>;
  searchFacilities(query: string): Promise<Facility[]>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(id: number, facility: Partial<InsertFacility>): Promise<Facility | undefined>;

  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  searchResources(query: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;

  // Apify-related methods
  updateFacilityWithApifyData(id: number, apifyData: ApifyDataUpdate): Promise<Facility | undefined>;
  updateResourceWithApifyData(id: number, apifyData: ApifyDataUpdate): Promise<Resource | undefined>;
}

// Interface for Apify data updates
export interface ApifyDataUpdate {
  rating?: string;
  reviews_count?: number;
  reviews?: Review[];
  photos?: Photo[];
  last_updated?: Date;
}

export class DatabaseStorage implements IStorage {
  // Facilities
  async getFacilities(): Promise<Facility[]> {
    return await db.select().from(facilities).orderBy(desc(facilities.name));
  }

  async getFacility(id: number): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility;
  }

  async getFacilitiesByType(type: string): Promise<Facility[]> {
    return await db.select().from(facilities).where(eq(facilities.type, type));
  }

  async searchFacilities(query: string): Promise<Facility[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(facilities).where(
      or(
        like(facilities.name, searchTerm),
        like(facilities.description, searchTerm),
        like(facilities.city, searchTerm),
        like(facilities.address, searchTerm)
      )
    );
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
  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources).orderBy(desc(resources.name));
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return await db.select().from(resources).where(eq(resources.category, category));
  }

  async searchResources(query: string): Promise<Resource[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(resources).where(
      or(
        like(resources.name, searchTerm),
        like(resources.description, searchTerm)
      )
    );
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
}

// Export the DatabaseStorage instance
export const storage = new DatabaseStorage();