import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Loader2, Filter, ArrowUpDown } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import FacilityCard from "@/components/FacilityCard";
import ResourceCard from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { type Facility, type Resource } from "@shared/schema";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";

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

// Number of items to load per page
const ITEMS_PER_PAGE = 10;

export default function ResourceDirectory() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");

  // Get search parameters
  const category = searchParams.get("category");
  const locationParam = searchParams.get("location");
  const needs = searchParams.get("needs")?.split(",").filter(Boolean) || [];
  const searchQuery = searchParams.get("search") || "";

  // Debug logging for the extracted parameters
  console.log('ResourceDirectory extracted params:', {
    category,
    locationParam,
    needs,
    searchQuery,
    activeTab: searchParams.get("type") || "facilities"
  });

  const [activeTab, setActiveTab] = useState(searchParams.get("type") || "facilities");
  const [searchText, setSearchText] = useState(searchQuery);

  // Pagination state
  const [facilitiesPage, setFacilitiesPage] = useState(1);
  const [resourcesPage, setResourcesPage] = useState(1);
  const [facilitiesData, setFacilitiesData] = useState<Facility[]>([]);
  const [resourcesData, setResourcesData] = useState<Resource[]>([]);
  const [hasMoreFacilities, setHasMoreFacilities] = useState(true);
  const [hasMoreResources, setHasMoreResources] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  // Facility query with pagination
  const {
    data: facilitiesResult,
    isLoading: facilitiesLoading,
    isFetching: facilitiesFetching
  } = useQuery<Facility[]>({
    queryKey: [
      searchText ?
        `/api/facilities/search/${searchText}?limit=${ITEMS_PER_PAGE}&offset=${(facilitiesPage - 1) * ITEMS_PER_PAGE}${category ? `&category=${category}` : ''}${locationParam ? `&location=${locationParam}` : ''}${needs.length > 0 ? `&needs=${needs.join(',')}` : ''}` :
        `/api/facilities?limit=${ITEMS_PER_PAGE}&offset=${(facilitiesPage - 1) * ITEMS_PER_PAGE}${category ? `&category=${category}` : ''}${locationParam ? `&location=${locationParam}` : ''}${needs.length > 0 ? `&needs=${needs.join(',')}` : ''}`
    ],
    enabled: activeTab === "facilities" || facilitiesData.length === 0,
  });

  // Resource query with pagination
  const {
    data: resourcesResult,
    isLoading: resourcesLoading,
    isFetching: resourcesFetching
  } = useQuery<Resource[]>({
    queryKey: [
      searchText ?
        `/api/resources/search/${searchText}?limit=${ITEMS_PER_PAGE}&offset=${(resourcesPage - 1) * ITEMS_PER_PAGE}${category ? `&category=${category}` : ''}${locationParam ? `&location=${locationParam}` : ''}${needs.length > 0 ? `&needs=${needs.join(',')}` : ''}` :
        `/api/resources?limit=${ITEMS_PER_PAGE}&offset=${(resourcesPage - 1) * ITEMS_PER_PAGE}${category ? `&category=${category}` : ''}${locationParam ? `&location=${locationParam}` : ''}${needs.length > 0 ? `&needs=${needs.join(',')}` : ''}`
    ],
    enabled: activeTab === "resources" || resourcesData.length === 0,
  });

  // Update facilities data when query results change
  useEffect(() => {
    if (facilitiesResult) {
      if (facilitiesPage === 1) {
        setFacilitiesData(facilitiesResult);
      } else {
        setFacilitiesData(prevData => [...prevData, ...facilitiesResult]);
      }
      // If we got fewer results than requested, there are no more to load
      setHasMoreFacilities(facilitiesResult.length === ITEMS_PER_PAGE);
      isLoadingMore.current = false;
    }
  }, [facilitiesResult, facilitiesPage]);

  // Update resources data when query results change
  useEffect(() => {
    if (resourcesResult) {
      if (resourcesPage === 1) {
        setResourcesData(resourcesResult);
      } else {
        setResourcesData(prevData => [...prevData, ...resourcesResult]);
      }
      // If we got fewer results than requested, there are no more to load
      setHasMoreResources(resourcesResult.length === ITEMS_PER_PAGE);
      isLoadingMore.current = false;
    }
  }, [resourcesResult, resourcesPage]);

  // Reset pagination when search text changes
  useEffect(() => {
    setFacilitiesPage(1);
    setResourcesPage(1);
    setFacilitiesData([]);
    setResourcesData([]);
    setHasMoreFacilities(true);
    setHasMoreResources(true);
  }, [searchText, activeTab]);

  // Handle intersection observer for infinite scrolling
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && !isLoadingMore.current) {
      isLoadingMore.current = true;

      if (activeTab === "facilities" && hasMoreFacilities && !facilitiesFetching) {
        setFacilitiesPage(prevPage => prevPage + 1);
      } else if (activeTab === "resources" && hasMoreResources && !resourcesFetching) {
        setResourcesPage(prevPage => prevPage + 1);
      } else {
        isLoadingMore.current = false;
      }
    }
  }, [activeTab, hasMoreFacilities, hasMoreResources, facilitiesFetching, resourcesFetching]);

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [observerCallback]);

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

  // Handle manual load more for accessibility
  const handleLoadMore = () => {
    if (activeTab === "facilities" && hasMoreFacilities && !facilitiesFetching) {
      setFacilitiesPage(prevPage => prevPage + 1);
    } else if (activeTab === "resources" && hasMoreResources && !resourcesFetching) {
      setResourcesPage(prevPage => prevPage + 1);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 md:py-12">
      <div className="mb-12 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Resource Directory</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover senior living facilities and resources in Colorado's Front Range
          </p>
        </div>

        {hasCriteria && (
          <div className="mb-6 p-5 bg-secondary/20 border border-secondary/30 rounded-lg flex items-center shadow-sm">
            <Info className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
            <div className="text-lg">
              {getSummaryMessage()}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <SearchBar
            onSearch={setSearchText}
            placeholder="Search facilities and resources..."
          />

          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Options</SheetTitle>
                  <SheetDescription>
                    Refine your search with specific criteria
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  {/* Filter options would go here */}
                  <p className="text-muted-foreground">
                    Filter functionality will be implemented in a future update.
                  </p>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="outline" className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="facilities" className="text-base py-3">Facilities</TabsTrigger>
          <TabsTrigger value="resources" className="text-base py-3">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="facilities">
          {facilitiesLoading && facilitiesPage === 1 ? (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="text-lg">Loading facilities...</p>
            </div>
          ) : facilitiesData.length === 0 ? (
            <div className="text-center py-12 bg-secondary/10 rounded-lg border border-secondary/20">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-medium mb-2">No facilities found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any facilities matching your criteria. Try adjusting your search or filters.
                </p>
                <Button onClick={() => setSearchText("")} variant="outline">Clear Search</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {facilitiesData.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} horizontal={true} />
              ))}

              {/* Loading indicator and scroll trigger */}
              <div ref={loadMoreRef} className="text-center py-8">
                {facilitiesFetching && (
                  <div className="flex justify-center items-center space-x-3 py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-lg">Loading more facilities...</span>
                  </div>
                )}
                {!facilitiesFetching && hasMoreFacilities && (
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    className="px-6 py-2 text-base"
                  >
                    Load More Facilities
                  </Button>
                )}
                {!hasMoreFacilities && facilitiesData.length > 0 && (
                  <div className="text-muted-foreground mt-2 py-2">
                    You've reached the end of the list.
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources">
          {resourcesLoading && resourcesPage === 1 ? (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <p className="text-lg">Loading resources...</p>
            </div>
          ) : resourcesData.length === 0 ? (
            <div className="text-center py-12 bg-secondary/10 rounded-lg border border-secondary/20">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-medium mb-2">No resources found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any resources matching your criteria. Try adjusting your search or filters.
                </p>
                <Button onClick={() => setSearchText("")} variant="outline">Clear Search</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {resourcesData.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} horizontal={true} />
              ))}

              {/* Loading indicator and scroll trigger */}
              <div ref={loadMoreRef} className="text-center py-8">
                {resourcesFetching && (
                  <div className="flex justify-center items-center space-x-3 py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-lg">Loading more resources...</span>
                  </div>
                )}
                {!resourcesFetching && hasMoreResources && (
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    className="px-6 py-2 text-base"
                  >
                    Load More Resources
                  </Button>
                )}
                {!hasMoreResources && resourcesData.length > 0 && (
                  <div className="text-muted-foreground mt-2 py-2">
                    You've reached the end of the list.
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}