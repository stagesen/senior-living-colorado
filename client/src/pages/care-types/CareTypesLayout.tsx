import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CARE_TYPES = [
  {
    id: "independent-living",
    name: "Independent Living",
    description: "For active seniors who want a maintenance-free lifestyle."
  },
  {
    id: "assisted-living",
    name: "Assisted Living",
    description: "For seniors who need help with daily activities."
  },
  {
    id: "memory-care",
    name: "Memory Care",
    description: "Specialized care for seniors with memory-related conditions."
  },
  {
    id: "skilled-nursing",
    name: "Skilled Nursing",
    description: "24/7 medical care and rehabilitation services."
  },
  {
    id: "continuing-care",
    name: "Continuing Care",
    description: "Communities offering multiple levels of care as needs change."
  }
];

export default function CareTypesLayout({ children }: { children: React.ReactNode }) {
  const [, params] = useRoute("/care-types/:type");
  const currentType = params?.type;

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-1/4">
          <div className="sticky top-24 space-y-2">
            <h2 className="text-lg font-semibold mb-4">Care Types</h2>
            {CARE_TYPES.map((type) => (
              <Link key={type.id} href={`/care-types/${type.id}`}>
                <Button
                  variant={currentType === type.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left",
                    currentType === type.id ? "bg-primary text-primary-foreground" : ""
                  )}
                >
                  {type.name}
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

export { CARE_TYPES };
