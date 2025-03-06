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
  const [, params] = useRoute("/locations/:location");
  const currentLocation = params?.location;

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-1/4">
          <div className="sticky top-24 space-y-2">
            <h2 className="text-lg font-semibold mb-4">Front Range Locations</h2>
            {LOCATIONS.map((location) => (
              <Link key={location.id} href={`/locations/${location.id}`}>
                <Button
                  variant={currentLocation === location.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left",
                    currentLocation === location.id ? "bg-primary text-primary-foreground" : ""
                  )}
                >
                  {location.name}
                </Button>
              </Link>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:w-3/4">
          {children}
        </main>
      </div>
    </div>
  );
}
