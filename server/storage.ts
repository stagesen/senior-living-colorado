import { facilities, resources, type Facility, type InsertFacility, type Resource, type InsertResource } from "@shared/schema";

export interface IStorage {
  // Facilities
  getFacilities(): Promise<Facility[]>;
  getFacility(id: number): Promise<Facility | undefined>;
  getFacilitiesByType(type: string): Promise<Facility[]>;
  searchFacilities(query: string): Promise<Facility[]>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  
  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  searchResources(query: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
}

export class MemStorage implements IStorage {
  private facilities: Map<number, Facility>;
  private resources: Map<number, Resource>;
  private facilityId: number;
  private resourceId: number;

  constructor() {
    this.facilities = new Map();
    this.resources = new Map();
    this.facilityId = 1;
    this.resourceId = 1;
    
    // Add some sample data
    this.initializeSampleData();
  }

  async getFacilities(): Promise<Facility[]> {
    return Array.from(this.facilities.values());
  }

  async getFacility(id: number): Promise<Facility | undefined> {
    return this.facilities.get(id);
  }

  async getFacilitiesByType(type: string): Promise<Facility[]> {
    return Array.from(this.facilities.values()).filter(f => f.type === type);
  }

  async searchFacilities(query: string): Promise<Facility[]> {
    const lcQuery = query.toLowerCase();
    return Array.from(this.facilities.values()).filter(f => 
      f.name.toLowerCase().includes(lcQuery) || 
      f.description.toLowerCase().includes(lcQuery) ||
      f.city.toLowerCase().includes(lcQuery)
    );
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const id = this.facilityId++;
    const newFacility = { ...facility, id };
    this.facilities.set(id, newFacility);
    return newFacility;
  }

  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(r => r.category === category);
  }

  async searchResources(query: string): Promise<Resource[]> {
    const lcQuery = query.toLowerCase();
    return Array.from(this.resources.values()).filter(r => 
      r.name.toLowerCase().includes(lcQuery) || 
      r.description.toLowerCase().includes(lcQuery)
    );
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const id = this.resourceId++;
    const newResource = { ...resource, id };
    this.resources.set(id, newResource);
    return newResource;
  }

  private initializeSampleData() {
    // Sample facilities
    this.createFacility({
      name: "Sunrise Senior Living",
      type: "assisted_living",
      address: "1234 Main Street",
      city: "Boulder",
      state: "CO",
      zip: "80301",
      phone: "(303) 555-0123",
      email: "info@sunrisesenior.com",
      website: "https://www.sunrisesenior.com",
      description: "Luxury assisted living facility with 24/7 care",
      amenities: ["24/7 Care", "Dining", "Activities", "Transportation"],
      latitude: "40.0150",
      longitude: "-105.2705"
    });

    // Sample resources
    this.createResource({
      name: "Boulder County Area Agency on Aging",
      category: "support_services",
      description: "Provides resources and support for seniors in Boulder County",
      contact: "(303) 441-3570",
      website: "https://www.bouldercounty.org/aging",
      address: "3482 Broadway",
      city: "Boulder",
      state: "CO",
      zip: "80304"
    });
  }
}

export const storage = new MemStorage();
