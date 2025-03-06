import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  // New fields for Apify data
  rating: text("rating"),
  reviews_count: integer("reviews_count"),
  reviews: jsonb("reviews"),
  photos: jsonb("photos"),
  external_id: text("external_id"),  // Added for duplicate prevention - stores Google Place ID or FID
  last_updated: timestamp("last_updated"),
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
  // New fields for Apify data
  rating: text("rating"),
  reviews_count: integer("reviews_count"),
  reviews: jsonb("reviews"),
  photos: jsonb("photos"),
  external_id: text("external_id"),  // Added for duplicate prevention - stores Google Place ID or FID
  last_updated: timestamp("last_updated"),
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

// Types for Apify data
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

export type WizardFormData = z.infer<typeof wizardFormSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Photo = z.infer<typeof photoSchema>;

export const insertFacilitySchema = createInsertSchema(facilities).omit({ id: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true });

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;