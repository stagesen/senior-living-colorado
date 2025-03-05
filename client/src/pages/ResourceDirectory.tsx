import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchBar from "@/components/SearchBar";
import FacilityCard from "@/components/FacilityCard";
import ResourceCard from "@/components/ResourceCard";
import { type Facility, type Resource } from "@shared/schema";

export default function ResourceDirectory() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const initialTab = searchParams.get("type") || "facilities";
  const initialSearch = searchParams.get("search") || "";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const { data: facilities, isLoading: facilitiesLoading } = useQuery<Facility[]>({
    queryKey: [searchQuery ? `/api/facilities/search/${searchQuery}` : "/api/facilities"],
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: [searchQuery ? `/api/resources/search/${searchQuery}` : "/api/resources"],
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Resource Directory</h1>
        <SearchBar
          onSearch={setSearchQuery}
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
