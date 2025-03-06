import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const LOCATIONS = [
  {
    id: "denver",
    name: "Denver",
    description: "Senior living communities in the Denver metropolitan area."
  },
  {
    id: "boulder",
    name: "Boulder",
    description: "Communities in the Boulder and North Denver region."
  },
  {
    id: "fort-collins",
    name: "Fort Collins",
    description: "Senior care facilities in Fort Collins and surrounding areas."
  },
  {
    id: "colorado-springs",
    name: "Colorado Springs",
    description: "Senior living options in the Colorado Springs region."
  },
  {
    id: "longmont",
    name: "Longmont",
    description: "Care communities in the Longmont area."
  },
  {
    id: "loveland",
    name: "Loveland",
    description: "Senior housing and care in Loveland."
  },
  {
    id: "greeley",
    name: "Greeley",
    description: "Senior living facilities in the Greeley region."
  }
];

export default function LocationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-8">
      {children}
    </div>
  );
}