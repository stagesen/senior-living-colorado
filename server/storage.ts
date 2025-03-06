import { facilities, resources, type Facility, type InsertFacility, type Resource, type InsertResource, type Review, type Photo } from "@shared/schema";

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
    const newFacility = {
      ...facility,
      id,
      email: facility.email ?? null,
      website: facility.website ?? null,
      amenities: facility.amenities ?? null,
      latitude: facility.latitude ?? null,
      longitude: facility.longitude ?? null,
      // Initialize Apify fields
      rating: null,
      reviews_count: null,
      reviews: null,
      photos: null,
      last_updated: null,
    };
    this.facilities.set(id, newFacility);
    return newFacility;
  }

  async updateFacility(id: number, facilityUpdate: Partial<InsertFacility>): Promise<Facility | undefined> {
    const existingFacility = this.facilities.get(id);
    if (!existingFacility) {
      return undefined;
    }

    const updatedFacility = {
      ...existingFacility,
      ...facilityUpdate,
    };

    this.facilities.set(id, updatedFacility);
    return updatedFacility;
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
    const newResource = {
      ...resource,
      id,
      website: resource.website ?? null,
      address: resource.address ?? null,
      city: resource.city ?? null,
      state: resource.state ?? null,
      zip: resource.zip ?? null,
      // Initialize Apify fields
      rating: null,
      reviews_count: null,
      reviews: null,
      photos: null,
      last_updated: null,
    };
    this.resources.set(id, newResource);
    return newResource;
  }

  async updateResource(id: number, resourceUpdate: Partial<InsertResource>): Promise<Resource | undefined> {
    const existingResource = this.resources.get(id);
    if (!existingResource) {
      return undefined;
    }

    const updatedResource = {
      ...existingResource,
      ...resourceUpdate,
    };

    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async updateFacilityWithApifyData(id: number, apifyData: ApifyDataUpdate): Promise<Facility | undefined> {
    const existingFacility = this.facilities.get(id);
    if (!existingFacility) {
      return undefined;
    }

    const updatedFacility = {
      ...existingFacility,
      ...apifyData,
      last_updated: apifyData.last_updated || new Date(),
    };

    this.facilities.set(id, updatedFacility);
    return updatedFacility;
  }

  async updateResourceWithApifyData(id: number, apifyData: ApifyDataUpdate): Promise<Resource | undefined> {
    const existingResource = this.resources.get(id);
    if (!existingResource) {
      return undefined;
    }

    const updatedResource = {
      ...existingResource,
      ...apifyData,
      last_updated: apifyData.last_updated || new Date(),
    };

    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  private initializeSampleData() {
    // Sample facilities with Apify data
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
    }).then(facility => {
      // Add sample Apify data
      this.updateFacilityWithApifyData(facility.id, {
        rating: "4.5",
        reviews_count: 28,
        reviews: [
          {
            author: "John Smith",
            date: "2023-08-15",
            rating: 5,
            text: "My mother has been living at Sunrise for 2 years and loves it. The staff is exceptional.",
            source: "Google"
          },
          {
            author: "Mary Johnson",
            date: "2023-06-22",
            rating: 4,
            text: "Beautiful facility with caring staff. The food could be better, but overall a great place.",
            source: "Yelp"
          }
        ],
        photos: [
          {
            url: "https://example.com/sunrise1.jpg",
            caption: "Main entrance",
            source: "Facility website"
          },
          {
            url: "https://example.com/sunrise2.jpg",
            caption: "Dining area",
            source: "Google"
          }
        ],
        last_updated: new Date()
      });
    });

    // Add another facility example
    this.createFacility({
      name: "Golden Acres Retirement Community",
      type: "independent_living",
      address: "567 Oak Drive",
      city: "Denver",
      state: "CO",
      zip: "80220",
      phone: "(303) 555-7890",
      email: "contact@goldenacres.com",
      website: "https://www.goldenacres.com",
      description: "Independent living community for active seniors in the heart of Denver",
      amenities: ["Fitness Center", "Community Garden", "Social Activities", "Gated Community"],
      latitude: "39.7392",
      longitude: "-104.9903"
    }).then(facility => {
      // Add sample Apify data
      this.updateFacilityWithApifyData(facility.id, {
        rating: "4.2",
        reviews_count: 15,
        reviews: [
          {
            author: "Robert Davis",
            date: "2023-09-10",
            rating: 4,
            text: "Great community for active seniors. Lots of activities and friendly residents.",
            source: "Google"
          }
        ],
        photos: [
          {
            url: "https://example.com/golden1.jpg",
            caption: "Community center",
            source: "Facility website"
          }
        ],
        last_updated: new Date()
      });
    });

    // Sample resources with Apify data
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
    }).then(resource => {
      // Add sample Apify data
      this.updateResourceWithApifyData(resource.id, {
        rating: "4.8",
        reviews_count: 45,
        reviews: [
          {
            author: "Patricia Wilson",
            date: "2023-07-12",
            rating: 5,
            text: "Incredibly helpful staff. They helped my father get access to crucial services.",
            source: "Google"
          },
          {
            author: "James Taylor",
            date: "2023-05-18",
            rating: 4,
            text: "Great information provided. Wait times can be long, but worth it.",
            source: "Facebook"
          }
        ],
        photos: [
          {
            url: "https://example.com/agency1.jpg",
            caption: "Office building",
            source: "Google Maps"
          }
        ],
        last_updated: new Date()
      });
    });

    // Add another resource example
    this.createResource({
      name: "Denver Senior Transport Network",
      category: "transportation",
      description: "Volunteer-based transportation service for seniors in the Denver metro area",
      contact: "(303) 555-4321",
      website: "https://www.denverseniortransport.org",
      address: "789 Elm Street",
      city: "Denver",
      state: "CO",
      zip: "80210"
    }).then(resource => {
      // Add sample Apify data
      this.updateResourceWithApifyData(resource.id, {
        rating: "4.6",
        reviews_count: 32,
        reviews: [
          {
            author: "Susan Brown",
            date: "2023-08-05",
            rating: 5,
            text: "This service has been a lifesaver for my aunt who can no longer drive. Reliable and friendly drivers.",
            source: "Google"
          }
        ],
        photos: [
          {
            url: "https://example.com/transport1.jpg",
            caption: "Transportation van",
            source: "Organization website"
          }
        ],
        last_updated: new Date()
      });
    });
  }
}

export const storage = new MemStorage();