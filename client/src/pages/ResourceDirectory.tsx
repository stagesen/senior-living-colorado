import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import FacilityCard from "@/components/FacilityCard";
import ResourceCard from "@/components/ResourceCard";
import { type Facility, type Resource } from "@shared/schema";

const CATEGORY_LABELS = {
  senior_living: "Senior Living & Housing",
  health_wellness: "Health & Wellness Services",
  social_community: "Social & Community Activities",
  transportation: "Transportation Services",
  financial_legal: "Financial & Legal Assistance",
  caregiving_support: "Caregiving & Family Support",
  volunteer_employment: "Volunteer & Employment Opportunities",
  education_learning: "Educational & Lifelong Learning"
};

const LOCATION_LABELS = {
  denver_metro: "Denver Metro",
  boulder_broomfield: "Boulder & Broomfield",
  arvada_golden: "Arvada & Golden",
  littleton_highlands_ranch: "Littleton & Highlands Ranch",
  aurora_centennial: "Aurora & Centennial",
  fort_collins_loveland: "Fort Collins & Loveland",
  colorado_springs: "Colorado Springs",
  other: "Other Areas"
};

export default function ResourceDirectory() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");

  // Get search parameters
  const category = searchParams.get("category");
  const locationParam = searchParams.get("location");
  const needs = searchParams.get("needs")?.split(",").filter(Boolean) || [];
  const searchQuery = searchParams.get("search") || "";

  const [activeTab, setActiveTab] = useState(searchParams.get("type") || "facilities");
  const [searchText, setSearchText] = useState(searchQuery);

  const { data: facilities, isLoading: facilitiesLoading } = useQuery<Facility[]>({
    queryKey: [searchText ? `/api/facilities/search/${searchText}` : "/api/facilities"],
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: [searchText ? `/api/resources/search/${searchText}` : "/api/resources"],
  });

  // Generate summary message if search criteria exist
  const hasCriteria = Boolean(category || locationParam || needs.length > 0 || searchQuery);

  const getSummaryMessage = () => {
    if (!hasCriteria) return null;

    let message = "Showing resources";

    if (category) {
      message += ` for ${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}`;
    }

    if (locationParam) {
      message += ` in ${LOCATION_LABELS[locationParam as keyof typeof LOCATION_LABELS] || locationParam}`;
    }

    if (needs.length > 0) {
      message += ` with focus on: ${needs.join(", ")}`;
    }

    if (searchQuery) {
      message += ` matching "${searchQuery}"`;
    }

    return message;
  };

  console.log("Search criteria:", { category, locationParam, needs, searchQuery, hasCriteria });
  console.log("Summary message:", getSummaryMessage());

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Resource Directory</h1>

        {hasCriteria && (
          <Alert className="mb-6 bg-primary/10 border-primary/20">
            <Info className="h-5 w-5 text-primary" />
            <AlertDescription className="text-lg ml-2">
              {getSummaryMessage()}
            </AlertDescription>
          </Alert>
        )}

        <SearchBar
          onSearch={setSearchText}
          placeholder="Search facilities and resources..."
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="facilities">
          {facilitiesLoading ? (
            <div className="text-center py-8">Loading facilities...</div>
          ) : facilities?.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No facilities found matching your criteria.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {facilities?.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources">
          {resourcesLoading ? (
            <div className="text-center py-8">Loading resources...</div>
          ) : resources?.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No resources found matching your criteria.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {resources?.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}