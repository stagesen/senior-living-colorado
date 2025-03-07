import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LOCATIONS } from "./LocationsLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import FacilityCard from "@/components/FacilityCard";
import ChatServiceCTA from "@/components/ChatServiceCTA";
import { Home, Users, Heart, Clock, Hospital, DollarSign, MapPin, Filter } from "lucide-react";
import type { Facility } from "@shared/schema";
import { useState } from "react";

// Location content data
const LOCATION_CONTENT = {
  "denver": {
    title: "Denver Senior Living Communities",
    description: "Discover senior living communities in Denver, offering a perfect blend of urban amenities and comfortable living. From independent living to specialized care, find the right community in the Mile High City.",
    features: [
      "Easy access to world-class healthcare",
      "Rich cultural activities and events",
      "Excellent public transportation",
      "Beautiful parks and recreation",
      "Diverse dining and shopping options"
    ],
    stats: {
      avgCost: "$4,200",
      facilities: "65+",
      occupancyRate: "92%",
      medicalCenters: "12",
      response: "24/7"
    }
  },
  "boulder": {
    title: "Boulder Senior Communities",
    description: "Experience senior living in Boulder, where natural beauty meets active lifestyle. Our communities offer spectacular mountain views and access to outdoor activities while providing comprehensive care services.",
    features: [
      "Mountain views and outdoor activities",
      "Close to university resources",
      "Active lifestyle opportunities",
      "Strong healthcare network",
      "Vibrant cultural scene"
    ],
    stats: {
      avgCost: "$4,500",
      facilities: "25+",
      occupancyRate: "94%",
      medicalCenters: "8",
      response: "24/7"
    }
  },
  "fort-collins": {
    title: "Fort Collins Senior Living",
    description: "Find your ideal senior living community in Fort Collins, known for its excellent quality of life and beautiful surroundings. Enjoy a perfect balance of small-town charm and modern amenities.",
    features: [
      "Peaceful neighborhood settings",
      "Close to CSU campus",
      "Active senior programs",
      "Beautiful natural surroundings",
      "Strong community focus"
    ],
    stats: {
      avgCost: "$3,900",
      facilities: "30+",
      occupancyRate: "91%",
      medicalCenters: "6",
      response: "24/7"
    }
  },
  "colorado-springs": {
    title: "Colorado Springs Senior Care",
    description: "Explore senior living options in Colorado Springs, where you'll find communities that combine scenic beauty with comprehensive care services. Enjoy the perfect blend of mountain living and urban convenience.",
    features: [
      "Stunning mountain views",
      "Military-friendly community",
      "Excellent medical facilities",
      "Abundant outdoor activities",
      "Rich cultural heritage"
    ],
    stats: {
      avgCost: "$3,800",
      facilities: "45+",
      occupancyRate: "89%",
      medicalCenters: "10",
      response: "24/7"
    }
  },
  "longmont": {
    title: "Longmont Senior Living",
    description: "Discover senior living communities in Longmont that offer a perfect mix of small-town charm and modern amenities. Enjoy easy access to both Denver and Boulder while maintaining a quieter lifestyle.",
    features: [
      "Peaceful suburban setting",
      "Close to major medical centers",
      "Active senior programs",
      "Beautiful views of Longs Peak",
      "Strong community activities"
    ],
    stats: {
      avgCost: "$3,700",
      facilities: "20+",
      occupancyRate: "90%",
      medicalCenters: "5",
      response: "24/7"
    }
  },
  "loveland": {
    title: "Loveland Senior Communities",
    description: "Find your perfect senior living community in Loveland, where artistic culture meets comfortable living. Enjoy scenic views and a strong sense of community in the Sweetheart City.",
    features: [
      "Arts and culture focus",
      "Beautiful natural settings",
      "Strong healthcare network",
      "Active lifestyle programs",
      "Close-knit community"
    ],
    stats: {
      avgCost: "$3,600",
      facilities: "15+",
      occupancyRate: "88%",
      medicalCenters: "4",
      response: "24/7"
    }
  },
  "greeley": {
    title: "Greeley Senior Living",
    description: "Explore senior living options in Greeley, offering affordable living with all the amenities you need. Enjoy a strong sense of community and easy access to healthcare services.",
    features: [
      "Affordable living options",
      "University town atmosphere",
      "Strong healthcare services",
      "Active community programs",
      "Rich agricultural heritage"
    ],
    stats: {
      avgCost: "$3,400",
      facilities: "18+",
      occupancyRate: "87%",
      medicalCenters: "3",
      response: "24/7"
    }
  }
};

// Care type options
const CARE_TYPES = [
  { id: "independent-living", label: "Independent Living" },
  { id: "assisted-living", label: "Assisted Living" },
  { id: "memory-care", label: "Memory Care" },
  { id: "skilled-nursing", label: "Skilled Nursing" },
  { id: "continuing-care", label: "Continuing Care" }
];

// Service type options
const SERVICE_TYPES = [
  { id: "memory-care", label: "Memory Care" },
  { id: "assisted-living", label: "Assisted Living Services" },
  { id: "skilled-nursing", label: "Skilled Nursing" },
  { id: "housekeeping", label: "Housekeeping & Laundry" },
  { id: "meals", label: "Meal Preparation" },
  { id: "medication", label: "Medication Management" },
  { id: "transportation", label: "Transportation" },
  { id: "activities", label: "Activities & Programs" }
];

// Sort options
const SORT_OPTIONS = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Highest Rated" },
  { value: "newest", label: "Recently Added" }
];

const getServicesList = (services: any[]): string[] => {
  return services ? services.map(service => service.name || service) : [];
}


export default function LocationPage() {
  const { location } = useParams();
  const content = LOCATION_CONTENT[location as keyof typeof LOCATION_CONTENT];
  const locationInfo = LOCATIONS.find(loc => loc.id === location);

  // Filter and sort state
  const [selectedCareTypes, setSelectedCareTypes] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([2000, 8000]);
  const [sortBy, setSortBy] = useState("rating-desc");

  // Fetch facilities with filters
  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ['/api/facilities', { 
      location, 
      careTypes: selectedCareTypes, 
      services: selectedServices,
      priceMin: priceRange[0], 
      priceMax: priceRange[1], 
      sort: sortBy 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        location: location,
        ...(selectedCareTypes.length > 0 && { careTypes: selectedCareTypes.join(',') }),
        ...(selectedServices.length > 0 && { services: selectedServices.join(',') }),
        priceMin: priceRange[0].toString(),
        priceMax: priceRange[1].toString(),
        sort: sortBy
      });
      const response = await fetch(`/api/facilities?${params}`);
      return response.json();
    }
  });

  // Filter facilities based on selected criteria
  const filteredFacilities = facilities?.filter(facility => {
    // Care type filter
    if (selectedCareTypes.length > 0 && !selectedCareTypes.includes(facility.type)) {
      return false;
    }

    // Service type filter
    if (selectedServices.length > 0) {
      const facilityServices = getServicesList(facility.services);
      if (!selectedServices.some(service => 
        facilityServices.some(fs => fs.toLowerCase().includes(service.toLowerCase()))
      )) {
        return false;
      }
    }

    return true;
  });

  // Sort facilities based on selected option
  const sortedFacilities = [...(filteredFacilities || [])].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return (a.price || 0) - (b.price || 0);
      case "price-desc":
        return (b.price || 0) - (a.price || 0);
      case "rating-desc":
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">{content.title}</h1>
        <p className="text-xl text-muted-foreground">{content.description}</p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-sm text-muted-foreground">Average Monthly Cost</div>
          <div className="font-semibold">{content.stats.avgCost}</div>
        </Card>
        <Card className="p-4 text-center">
          <Home className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-sm text-muted-foreground">Available Facilities</div>
          <div className="font-semibold">{content.stats.facilities}</div>
        </Card>
        <Card className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-sm text-muted-foreground">Occupancy Rate</div>
          <div className="font-semibold">{content.stats.occupancyRate}</div>
        </Card>
        <Card className="p-4 text-center">
          <Hospital className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-sm text-muted-foreground">Medical Centers</div>
          <div className="font-semibold">{content.stats.medicalCenters}</div>
        </Card>
        <Card className="p-4 text-center md:col-span-1 col-span-2">
          <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-sm text-muted-foreground">Care Response</div>
          <div className="font-semibold">{content.stats.response}</div>
        </Card>
      </div>

      {/* Filter and Sort Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="p-6 md:w-1/3">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Care Types</label>
                  {CARE_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={type.id}
                        checked={selectedCareTypes.includes(type.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCareTypes([...selectedCareTypes, type.id]);
                          } else {
                            setSelectedCareTypes(selectedCareTypes.filter(t => t !== type.id));
                          }
                        }}
                      />
                      <label htmlFor={type.id} className="text-sm">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Services</label>
                  {SERVICE_TYPES.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service.id]);
                          } else {
                            setSelectedServices(selectedServices.filter(s => s !== service.id));
                          }
                        }}
                      />
                      <label htmlFor={service.id} className="text-sm">
                        {service.label}
                      </label>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium mb-4 block">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    min={2000}
                    max={8000}
                    step={100}
                    onValueChange={setPriceRange}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div className="md:w-2/3">
          <h2 className="text-2xl font-semibold mb-6">Senior Living Communities in {locationInfo.name}</h2>
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-48 bg-muted rounded-lg" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : sortedFacilities && sortedFacilities.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {sortedFacilities.map((facility, index) => (
                <>
                  <FacilityCard key={facility.id} facility={facility} />
                  {(index + 1) % 5 === 0 && (
                    <div className="md:col-span-2">
                      <ChatServiceCTA />
                    </div>
                  )}
                </>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No facilities found in this area.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}