import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ApifyService } from "./services/apifyService";
import { searchService } from "./services/searchService";

// Simple in-memory tracking of sync status
const syncStatus = {
  status: "idle", // idle, running, completed, error
  message: "",
  processedItems: 0,
  totalItems: 0,
  startTime: null as Date | null,
  endTime: null as Date | null,
};

// Function to get an instance of the Apify service
export function getApifyService(): ApifyService {
  const apiKey = process.env.APIFY_API_KEY || '';
  return new ApifyService(apiKey);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Facilities routes
  app.get("/api/facilities", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const category = req.query.category as string | undefined;
    const location = req.query.location as string | undefined;
    const needs = req.query.needs ? (req.query.needs as string).split(',') : undefined;

    // If we have any filter parameters, use the search service instead
    if (category || location || needs) {
      // Use enhanced search via searchService with an empty query
      const facilities = await searchService.searchFacilities(
        "", // empty query to match all facilities but apply filters
        { category, location, needs },
        limit, 
        offset
      );
      res.json(facilities);
    } else {
      // No filters, use standard retrieval
      const facilities = await storage.getFacilities(limit, offset);
      res.json(facilities);
    }
  });

  app.get("/api/facilities/:id", async (req, res) => {
    const facility = await storage.getFacility(parseInt(req.params.id));
    if (!facility) {
      res.status(404).json({ message: "Facility not found" });
      return;
    }
    res.json(facility);
  });

  app.get("/api/facilities/type/:type", async (req, res) => {
    const facilities = await storage.getFacilitiesByType(req.params.type);
    res.json(facilities);
  });

  app.get("/api/facilities/search/:query", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const category = req.query.category as string | undefined;
    const location = req.query.location as string | undefined;
    const needs = req.query.needs ? (req.query.needs as string).split(',') : undefined;

    // Use enhanced search via searchService
    const facilities = await searchService.searchFacilities(
      req.params.query, 
      { category, location, needs },
      limit, 
      offset
    );
    res.json(facilities);
  });

  app.post("/api/facilities", async (req, res) => {
    try {
      const facility = await storage.createFacility(req.body);
      res.status(201).json(facility);
    } catch (error) {
      res.status(400).json({ message: `Failed to create facility: ${error}` });
    }
  });

  app.patch("/api/facilities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedFacility = await storage.updateFacility(id, req.body);
      if (!updatedFacility) {
        res.status(404).json({ message: "Facility not found" });
        return;
      }
      res.json(updatedFacility);
    } catch (error) {
      res.status(400).json({ message: `Failed to update facility: ${error}` });
    }
  });

  // Resources routes
  app.get("/api/resources", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const category = req.query.category as string | undefined;
    const location = req.query.location as string | undefined;
    const needs = req.query.needs ? (req.query.needs as string).split(',') : undefined;

    // If we have any filter parameters, use the search service instead
    if (category || location || needs) {
      // Use enhanced search via searchService with an empty query
      const resources = await searchService.searchResources(
        "", // empty query to match all resources but apply filters
        { category, location, needs },
        limit, 
        offset
      );
      res.json(resources);
    } else {
      // No filters, use standard retrieval
      const resources = await storage.getResources(limit, offset);
      res.json(resources);
    }
  });

  app.get("/api/resources/:id", async (req, res) => {
    const resource = await storage.getResource(parseInt(req.params.id));
    if (!resource) {
      res.status(404).json({ message: "Resource not found" });
      return;
    }
    res.json(resource);
  });

  app.get("/api/resources/category/:category", async (req, res) => {
    const resources = await storage.getResourcesByCategory(req.params.category);
    res.json(resources);
  });

  app.get("/api/resources/search/:query", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const category = req.query.category as string | undefined;
    const location = req.query.location as string | undefined;
    const needs = req.query.needs ? (req.query.needs as string).split(',') : undefined;

    // Use enhanced search via searchService
    const resources = await searchService.searchResources(
      req.params.query, 
      { category, location, needs },
      limit, 
      offset
    );
    res.json(resources);
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const resource = await storage.createResource(req.body);
      res.status(201).json(resource);
    } catch (error) {
      res.status(400).json({ message: `Failed to create resource: ${error}` });
    }
  });

  app.patch("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedResource = await storage.updateResource(id, req.body);
      if (!updatedResource) {
        res.status(404).json({ message: "Resource not found" });
        return;
      }
      res.json(updatedResource);
    } catch (error) {
      res.status(400).json({ message: `Failed to update resource: ${error}` });
    }
  });

  // Apify integration routes
  app.post("/api/apify/sync", async (req, res) => {
    try {
      // Check API key
      const apiKey = process.env.APIFY_API_KEY;
      if (!apiKey) {
        res.status(500).json({ message: "Apify API key not configured" });
        return;
      }

      // Get location parameters if provided
      const { locations } = req.body;

      // Get the Apify service
      const apifyService = getApifyService();

      // Update sync status
      syncStatus.status = "running";
      syncStatus.message = "Starting Apify sync job...";
      syncStatus.processedItems = 0;
      syncStatus.totalItems = 0;
      syncStatus.startTime = new Date();
      syncStatus.endTime = null;

      // Start the sync job (non-blocking)
      res.json({ message: "Apify sync job started" });

      // Run the sync job asynchronously
      apifyService.runSyncJob(locations)
        .then(() => {
          syncStatus.status = "completed";
          syncStatus.message = "Apify sync job completed successfully";
          syncStatus.endTime = new Date();
          console.log("Apify sync job completed successfully");
        })
        .catch((error: any) => {
          syncStatus.status = "error";
          syncStatus.message = `Error: ${error.message}`;
          syncStatus.endTime = new Date();
          console.error("Apify sync job failed:", error);
        });

    } catch (error) {
      console.error("Error starting Apify sync:", error);
      res.status(500).json({ message: `Failed to start Apify sync: ${error}` });
    }
  });

  // Check if Apify API key is configured
  app.get("/api/apify/check-api-key", (_req, res) => {
    const apiKey = process.env.APIFY_API_KEY;
    if (apiKey) {
      res.status(200).json({ configured: true });
    } else {
      res.status(404).json({ configured: false, message: "Apify API key not configured" });
    }
  });

  // Get current status of Apify sync job
  app.get("/api/apify/sync-status", (_req, res) => {
    res.json(syncStatus);
  });

  app.get("/api/facilities/:id/reviews", async (req, res) => {
    try {
      const facility = await storage.getFacility(parseInt(req.params.id));
      if (!facility) {
        res.status(404).json({ message: "Facility not found" });
        return;
      }

      res.json(facility.reviews || []);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch facility reviews: ${error}` });
    }
  });

  app.get("/api/facilities/:id/photos", async (req, res) => {
    try {
      const facility = await storage.getFacility(parseInt(req.params.id));
      if (!facility) {
        res.status(404).json({ message: "Facility not found" });
        return;
      }

      res.json(facility.photos || []);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch facility photos: ${error}` });
    }
  });

  app.get("/api/resources/:id/reviews", async (req, res) => {
    try {
      const resource = await storage.getResource(parseInt(req.params.id));
      if (!resource) {
        res.status(404).json({ message: "Resource not found" });
        return;
      }

      res.json(resource.reviews || []);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch resource reviews: ${error}` });
    }
  });

  app.get("/api/resources/:id/photos", async (req, res) => {
    try {
      const resource = await storage.getResource(parseInt(req.params.id));
      if (!resource) {
        res.status(404).json({ message: "Resource not found" });
        return;
      }

      res.json(resource.photos || []);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch resource photos: ${error}` });
    }
  });

  // Unified search endpoint that searches across both facilities and resources
  app.get("/api/unified-search/:query", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const category = req.query.category as string | undefined;
      const location = req.query.location as string | undefined;
      const needs = req.query.needs ? (req.query.needs as string).split(',') : undefined;

      const results = await searchService.unifiedSearch(
        req.params.query, 
        { category, location, needs },
        limit, 
        offset
      );
      res.json(results);
    } catch (error) {
      console.error("Error in unified search:", error);
      res.status(500).json({ message: `Failed to perform unified search: ${error}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}