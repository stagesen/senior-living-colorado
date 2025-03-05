import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  const httpServer = createServer(app);
  return httpServer;
}
