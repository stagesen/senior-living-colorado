import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Loader2, Filter, ArrowUpDown, Check, X } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import FacilityCard from "@/components/FacilityCard";
import ResourceCard from "@/components/ResourceCard";
import ChatServiceCTA from "@/components/ChatServiceCTA";
import { Button } from "@/components/ui/button";
import { type Facility, type Resource } from "@shared/schema";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label
}));

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

const LOCATION_OPTIONS = Object.entries(LOCATION_LABELS).map(([value, label]) => ({
  value,
  label
}));

const AMENITIES_OPTIONS = [
  "Fitness Center",
  "Swimming Pool",
  "Dining Options",
  "Transportation",
  "24-hour Staff",
  "Pet Friendly",
  "Housekeeping",
  "Social Activities",
  "Outdoor Spaces",
  "Wellness Programs"
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "rating_desc", label: "Highest Rated" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "newest", label: "Newest First" }
];

// Number of items to load per page
const ITEMS_PER_PAGE = 10;

export default function ResourceDirectory() {
  const [location, setLocationPath] = useLocation();
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

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>(category || "all");
  const [selectedLocation, setSelectedLocation] = useState<string>(locationParam || "all");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(needs || []);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Sort state
  const [sortOption, setSortOption] = useState<string>("relevance");

  // Pagination state
  const [facilitiesPage, setFacilitiesPage] = useState(1);
  const [resourcesPage, setResourcesPage] = useState(1);
  const [facilitiesData, setFacilitiesData] = useState<Facility[]>([]);
  const [resourcesData, setResourcesData] = useState<Resource[]>([]);
  const [hasMoreFacilities, setHasMoreFacilities] = useState(true);
  const [hasMoreResources, setHasMoreResources] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  // Build the query string with all filters and sort options
  const buildQueryString = (page: number, isSearch: boolean, type: string) => {
    // Only add parameters if they have non-default values
    const sortParam = sortOption !== "relevance" ? `&sort=${sortOption}` : '';
    const categoryParam = selectedCategory !== "all" ? `&category=${selectedCategory}` : '';
    const locationParam = selectedLocation !== "all" ? `&location=${selectedLocation}` : '';
    const needsParam = selectedNeeds.length > 0 ? `&needs=${selectedNeeds.join(',')}` : '';
    const amenitiesParam = selectedAmenities.length > 0 ? `&amenities=${selectedAmenities.join(',')}` : '';

    const baseQueryParams = `limit=${ITEMS_PER_PAGE}&offset=${(page - 1) * ITEMS_PER_PAGE}${sortParam}${categoryParam}${locationParam}${needsParam}${amenitiesParam}`;

    if (isSearch && searchText) {
      return `/api/${type}/search/${searchText}?${baseQueryParams}`;
    } else {
      return `/api/${type}?${baseQueryParams}`;
    }
  };

  // Facility query with pagination and filters
  const {
    data: facilitiesResult,
    isLoading: facilitiesLoading,
    isFetching: facilitiesFetching
  } = useQuery<Facility[]>({
    queryKey: [
      buildQueryString(facilitiesPage, Boolean(searchText), 'facilities')
    ],
    enabled: activeTab === "facilities" || facilitiesData.length === 0,
  });

  // Resource query with pagination and filters
  const {
    data: resourcesResult,
    isLoading: resourcesLoading,
    isFetching: resourcesFetching
  } = useQuery<Resource[]>({
    queryKey: [
      buildQueryString(resourcesPage, Boolean(searchText), 'resources')
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

  // Reset pagination when search text or filters change
  useEffect(() => {
    setFacilitiesPage(1);
    setResourcesPage(1);
    setFacilitiesData([]);
    setResourcesData([]);
    setHasMoreFacilities(true);
    setHasMoreResources(true);
  }, [searchText, activeTab, selectedCategory, selectedLocation, selectedNeeds, selectedAmenities, sortOption]);

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
  const hasCriteria = Boolean(selectedCategory !== "all" || selectedLocation !== "all" || selectedNeeds.length > 0 || selectedAmenities.length > 0 || searchQuery);

  const getSummaryMessage = () => {
    if (!hasCriteria) return null;

    let message = "Showing resources";

    if (selectedCategory !== "all") {
      message += ` for ${CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS] || selectedCategory}`;
    }

    if (selectedLocation !== "all") {
      message += ` in ${LOCATION_LABELS[selectedLocation as keyof typeof LOCATION_LABELS] || selectedLocation}`;
    }

    if (selectedNeeds.length > 0) {
      message += ` with focus on: ${selectedNeeds.join(", ")}`;
    }

    if (selectedAmenities.length > 0) {
      message += ` having amenities: ${selectedAmenities.join(", ")}`;
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

  // Apply filters
  const applyFilters = () => {
    // Update URL params (optional)
    const params = new URLSearchParams();
    if (searchText) params.set("search", searchText);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedLocation !== "all") params.set("location", selectedLocation);
    if (selectedNeeds.length > 0) params.set("needs", selectedNeeds.join(","));
    if (selectedAmenities.length > 0) params.set("amenities", selectedAmenities.join(","));
    if (sortOption !== "relevance") params.set("sort", sortOption);
    if (activeTab !== "facilities") params.set("type", activeTab);

    const newPath = location.split("?")[0] + (params.toString() ? `?${params.toString()}` : "");
    setLocationPath(newPath);
  };

  // Update the clear filters function to ensure it properly refetches data
  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedLocation("all");
    setSelectedNeeds([]);
    setSelectedAmenities([]);
    setSortOption("relevance");
    setSearchText(""); // Clear search text as well

    // Reset pagination and clear current data to force a refetch
    setFacilitiesPage(1);
    setResourcesPage(1);
    setFacilitiesData([]);
    setResourcesData([]);
    setHasMoreFacilities(true);
    setHasMoreResources(true);

    // Update URL to remove query params
    setLocationPath(location.split("?")[0]);
  };

  // Handle amenity checkbox changes
  const handleAmenityChange = (checked: boolean | "indeterminate", amenity: string) => {
    if (checked === true) {
      setSelectedAmenities(prev => [...prev, amenity]);
    } else {
      setSelectedAmenities(prev => prev.filter(a => a !== amenity));
    }
  };

  // Handle sort selection
  const handleSortChange = (value: string) => {
    setSortOption(value);
  };

  // Render facility list with CTA inserted after every 5th item
  const renderFacilityList = () => {
    const content = [];

    for (let i = 0; i < facilitiesData.length; i++) {
      // Add the facility card
      content.push(
        <FacilityCard
          key={`facility-${facilitiesData[i].id}`}
          facility={facilitiesData[i]}
          horizontal={true}
        />
      );

      // After every 5th item, add the CTA
      if ((i + 1) % 5 === 0 && i !== facilitiesData.length - 1) {
        content.push(
          <ChatServiceCTA key={`cta-after-facility-${i}`} />
        );
      }
    }

    return content;
  };

  // Render resource list with CTA inserted after every 5th item
  const renderResourceList = () => {
    const content = [];

    for (let i = 0; i < resourcesData.length; i++) {
      // Add the resource card
      content.push(
        <ResourceCard
          key={`resource-${resourcesData[i].id}`}
          resource={resourcesData[i]}
          horizontal={true}
        />
      );

      // After every 5th item, add the CTA
      if ((i + 1) % 5 === 0 && i !== resourcesData.length - 1) {
        content.push(
          <ChatServiceCTA key={`cta-after-resource-${i}`} />
        );
      }
    }

    return content;
  };

  // Render active filter badges for quick removal
  const renderFilterBadges = () => {
    if (!hasCriteria) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedCategory !== "all" && (
          <Badge variant="outline" className="gap-1 px-3 py-1 bg-secondary/20">
            {CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS] || selectedCategory}
            <X
              className="h-3 w-3 ml-1 cursor-pointer"
              onClick={() => setSelectedCategory("all")}
            />
          </Badge>
        )}

        {selectedLocation !== "all" && (
          <Badge variant="outline" className="gap-1 px-3 py-1 bg-secondary/20">
            {LOCATION_LABELS[selectedLocation as keyof typeof LOCATION_LABELS] || selectedLocation}
            <X
              className="h-3 w-3 ml-1 cursor-pointer"
              onClick={() => setSelectedLocation("all")}
            />
          </Badge>
        )}

        {selectedNeeds.map(need => (
          <Badge key={need} variant="outline" className="gap-1 px-3 py-1 bg-secondary/20">
            {need}
            <X
              className="h-3 w-3 ml-1 cursor-pointer"
              onClick={() => setSelectedNeeds(prev => prev.filter(n => n !== need))}
            />
          </Badge>
        ))}

        {selectedAmenities.map(amenity => (
          <Badge key={amenity} variant="outline" className="gap-1 px-3 py-1 bg-secondary/20">
            {amenity}
            <X
              className="h-3 w-3 ml-1 cursor-pointer"
              onClick={() => setSelectedAmenities(prev => prev.filter(a => a !== amenity))}
            />
          </Badge>
        ))}

        {sortOption !== "relevance" && (
          <Badge variant="outline" className="gap-1 px-3 py-1 bg-secondary/20">
            {SORT_OPTIONS.find(opt => opt.value === sortOption)?.label || "Sorted"}
            <X
              className="h-3 w-3 ml-1 cursor-pointer"
              onClick={() => setSortOption("relevance")}
            />
          </Badge>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm text-muted-foreground"
          onClick={clearFilters}
        >
          Clear All
        </Button>
      </div>
    );
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
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Options</SheetTitle>
                  <SheetDescription>
                    Refine your search with specific criteria
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-6">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORY_OPTIONS.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger id="location">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {LOCATION_OPTIONS.map(location => (
                          <SelectItem key={location.value} value={location.value}>
                            {location.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Needs Filter */}
                  <div className="space-y-2">
                    <Label>Needs</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="need-memory-care" 
                          checked={selectedNeeds.includes("Memory Care")}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              setSelectedNeeds(prev => [...prev, "Memory Care"]);
                            } else {
                              setSelectedNeeds(prev => prev.filter(n => n !== "Memory Care"));
                            }
                          }}
                        />
                        <label htmlFor="need-memory-care" className="text-sm">Memory Care</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="need-assisted-living" 
                          checked={selectedNeeds.includes("Assisted Living")}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              setSelectedNeeds(prev => [...prev, "Assisted Living"]);
                            } else {
                              setSelectedNeeds(prev => prev.filter(n => n !== "Assisted Living"));
                            }
                          }}
                        />
                        <label htmlFor="need-assisted-living" className="text-sm">Assisted Living</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="need-independent-living" 
                          checked={selectedNeeds.includes("Independent Living")}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              setSelectedNeeds(prev => [...prev, "Independent Living"]);
                            } else {
                              setSelectedNeeds(prev => prev.filter(n => n !== "Independent Living"));
                            }
                          }}
                        />
                        <label htmlFor="need-independent-living" className="text-sm">Independent Living</label>
                      </div>
                    </div>
                  </div>

                  {/* Amenities Filter */}
                  <div className="space-y-2">
                    <Label>Amenities</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {AMENITIES_OPTIONS.slice(0, 6).map(amenity => (
                        <div key={amenity} className="flex items-center gap-2">
                          <Checkbox 
                            id={`amenity-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                            checked={selectedAmenities.includes(amenity)}
                            onCheckedChange={(checked) => handleAmenityChange(checked, amenity)}
                          />
                          <label 
                            htmlFor={`amenity-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                            className="text-sm"
                          >
                            {amenity}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
                <SheetFooter className="border-t border-border pt-4 mt-4">
                  <SheetClose asChild>
                    <Button onClick={applyFilters} className="w-full">
                      Apply Filters
                    </Button>
                  </SheetClose>
                  <Button variant="outline" onClick={clearFilters} className="w-full mt-2">
                    Clear Filters
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <span>Sort</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Sort Options</SheetTitle>
                  <SheetDescription>
                    Choose how to sort the results
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                  <RadioGroup 
                    value={sortOption} 
                    onValueChange={handleSortChange}
                    className="space-y-3"
                  >
                    {SORT_OPTIONS.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`sort-${option.value}`} />
                        <Label htmlFor={`sort-${option.value}`} className="font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button onClick={applyFilters} className="w-full">Apply Sort</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Render filter badges if any filters are applied */}
        {renderFilterBadges()}
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
                <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {renderFacilityList()}

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
                <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {renderResourceList()}

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