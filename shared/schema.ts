import { pgTable, text, serial, integer, boolean, jsonb, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define services table
export const facilityServices = pgTable("facility_services", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id").notNull().references(() => facilities.id),
  serviceName: text("service_name").notNull(),
  description: text("description"),
  pricingInfo: text("pricing_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  website: text("website"),
  description: text("description").notNull(),
  amenities: text("amenities").array(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  rating: text("rating"),
  reviews_count: integer("reviews_count"),
  reviews: jsonb("reviews"),
  photos: jsonb("photos"),
  external_id: text("external_id"),
  logo: text("logo"),
  last_updated: timestamp("last_updated"),
  county: text("county"),
  price: integer("price"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  contact: text("contact").notNull(),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  rating: text("rating"),
  reviews_count: integer("reviews_count"),
  reviews: jsonb("reviews"),
  photos: jsonb("photos"),
  external_id: text("external_id"),
  logo: text("logo"),
  last_updated: timestamp("last_updated"),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  itemId: integer("item_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Resource Wizard Types
export const wizardFormSchema = z.object({
  category: z.enum([
    'senior_living',
    'health_wellness',
    'social_community',
    'transportation',
    'financial_legal',
    'caregiving_support',
    'volunteer_employment',
    'education_learning'
  ]),
  location: z.enum([
    'denver_metro',
    'boulder_broomfield',
    'arvada_golden',
    'littleton_highlands_ranch',
    'aurora_centennial',
    'fort_collins_loveland',
    'colorado_springs',
    'other'
  ]),
  for_whom: z.enum([
    'self',
    'parent_grandparent',
    'spouse_partner',
    'friend_neighbor',
    'client',
    'other'
  ]),
  specific_needs: z.array(z.string()),
  notes: z.string().optional(),
});

// Types for data from external services
export const reviewSchema = z.object({
  author: z.string(),
  date: z.string(),
  rating: z.number().optional(),
  text: z.string(),
  source: z.string().optional(),
});

export const photoSchema = z.object({
  url: z.string(),
  caption: z.string().optional(),
  source: z.string().optional(),
});

// Service schema and types
export const serviceSchema = z.object({
  serviceName: z.string(),
  description: z.string().optional(),
  pricingInfo: z.string().optional(),
});

// Type Exports
export type WizardFormData = z.infer<typeof wizardFormSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type Service = z.infer<typeof serviceSchema>;

// Insert Schema Exports
export const insertFacilitySchema = createInsertSchema(facilities).omit({ id: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true });
export const insertServiceSchema = createInsertSchema(facilityServices).omit({ id: true });

// Type Exports for database entities
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type FacilityService = typeof facilityServices.$inferSelect;
export type InsertFacilityService = z.infer<typeof insertServiceSchema>;