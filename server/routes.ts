import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getApifyService } from "./services/apifyService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Facilities routes
  app.get("/api/facilities", async (_req, res) => {
    const facilities = await storage.getFacilities();
    res.json(facilities);
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
    const facilities = await storage.searchFacilities(req.params.query);
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
  app.get("/api/resources", async (_req, res) => {
    const resources = await storage.getResources();
    res.json(resources);
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
    const resources = await storage.searchResources(req.params.query);
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

      // Start the sync job (non-blocking)
      res.json({ message: "Apify sync job started" });

      // Run the sync job asynchronously
      apifyService.runSyncJob(locations)
        .then(() => console.log("Apify sync job completed successfully"))
        .catch(error => console.error("Apify sync job failed:", error));

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

  const httpServer = createServer(app);
  return httpServer;
}