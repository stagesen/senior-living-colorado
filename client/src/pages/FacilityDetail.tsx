import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Globe, MapPin, Star, Info, ExternalLink, Calendar, Clock, Users, Heart } from "lucide-react";
import type { Facility, Review, Photo, Service } from "@shared/schema";
import { getFacilityLogoUrl } from "@/lib/logoUtils";

// Star rating component
const StarRating = ({ rating }: { rating: string | null }) => {
  if (!rating) return null;

  const numericRating = parseFloat(rating);
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < fullStars
              ? "text-yellow-400 fill-yellow-400"
              : i === fullStars && hasHalfStar
              ? "text-yellow-400 fill-yellow-400/50"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-2 text-lg font-medium">{rating}</span>
    </div>
  );
};

// Review component
const ReviewItem = ({ review }: { review: Review }) => {
  return (
    <div className="border-b border-border pb-6 mb-6 last:border-0">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{review.author}</h3>
        <div className="text-sm text-muted-foreground">{review.date}</div>
      </div>

      {review.rating !== undefined && (
        <div className="flex mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
      )}

      <p className="text-muted-foreground">{review.text}</p>

      {review.source && (
        <div className="text-sm text-muted-foreground mt-1">
          Source: {review.source}
        </div>
      )}
    </div>
  );
};

// Photo gallery component for hero section
const HeroGallery = ({ photos }: { photos: Photo[] }) => {
  if (!photos || photos.length === 0) {
    return (
      <div className="h-[400px] bg-secondary/20 rounded-lg flex items-center justify-center mb-8">
        <div className="text-muted-foreground text-lg">No photos available</div>
      </div>
    );
  }

  // If only one photo, show it full width
  if (photos.length === 1) {
    return (
      <div className="relative h-[400px] rounded-xl overflow-hidden mb-8">
        <img
          src={photos[0].url}
          alt={photos[0].caption || "Facility image"}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // For multiple photos, create a grid layout (similar to Airbnb)
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 h-[400px]">
      {/* First photo takes 2 rows and 2 columns */}
      <div className="md:col-span-2 md:row-span-2 rounded-xl overflow-hidden h-full">
        <img
          src={photos[0].url}
          alt={photos[0].caption || "Primary facility image"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Other photos */}
      {photos.slice(1, 5).map((photo, index) => (
        <div key={index} className="hidden md:block rounded-xl overflow-hidden h-full">
          <img
            src={photo.url}
            alt={photo.caption || `Facility image ${index + 2}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Show a button to view all photos if there are more than 5 */}
      {photos.length > 5 && (
        <div className="absolute bottom-4 right-4">
          <Button variant="secondary" className="shadow-md">
            View all {photos.length} photos
          </Button>
        </div>
      )}
    </div>
  );
};

export default function FacilityDetail() {
  const { id } = useParams();

  const { data: facility, isLoading } = useQuery<Facility>({
    queryKey: [`/api/facilities/${id}`],
  });

  if (isLoading) {
    return (
      <div className="container py-16 text-center">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-secondary/50 rounded-md max-w-md mx-auto"></div>
          <div className="h-64 bg-secondary/30 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-4 bg-secondary/40 rounded max-w-lg"></div>
            <div className="h-4 bg-secondary/40 rounded max-w-md"></div>
            <div className="h-4 bg-secondary/40 rounded max-w-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Facility Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find the facility you're looking for. It may have been removed or the URL might be incorrect.
          </p>
        </div>
      </div>
    );
  }

  // Get logo URL from facility data or website
  const logoUrl = getFacilityLogoUrl(facility);

  // TypeScript safety: ensure arrays are treated as arrays
  const facilityReviews = Array.isArray(facility.reviews) ? facility.reviews : [];
  const facilityPhotos = Array.isArray(facility.photos) ? facility.photos : [];
  const facilityAmenities = Array.isArray(facility.amenities) ? facility.amenities : [];
  const facilityServices = Array.isArray(facility.services) ? facility.services as Service[] : [];

  const careTypes = (facility as any).care_types as string[] | undefined;
  const paymentOptions = (facility as any).payment_options as string[] | undefined;
  const visitingHours = (facility as any).visiting_hours as string | undefined;
  const capacity = (facility as any).capacity as number | undefined;
  const foundedYear = (facility as any).founded_year as number | undefined;
  const staffCount = (facility as any).staff_count as number | undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb - optional */}
      <div className="text-sm text-muted-foreground mb-4">
        <a href="/" className="hover:underline">Home</a> &gt;
        <a href="/resources" className="hover:underline"> Resource Directory</a> &gt;
        <span className="text-foreground"> {facility.name}</span>
      </div>

      {/* Page title with type */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{facility.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-muted-foreground">
            <Badge variant="secondary" className="text-sm">
              {facility.type.replace("_", " ").toUpperCase()}
            </Badge>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{facility.city}, {facility.state}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-full">
            <Heart className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Hero Gallery */}
      <HeroGallery photos={facilityPhotos} />

      {/* Main content layout: 2/3 for main content, 1/3 for sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content column */}
        <div className="lg:col-span-2 space-y-10">
          {/* Facility description */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">About {facility.name}</h2>
              {logoUrl && (
                <div className="bg-card rounded-lg p-2 shadow-sm border border-border">
                  <img
                    src={logoUrl}
                    alt={`${facility.name} logo`}
                    className="h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-lg leading-relaxed">{facility.description}</p>
          </section>

          {/* Amenities section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {facilityAmenities.map((amenity, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Services section */}
          {facilityServices && facilityServices.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-6">Services & Pricing</h2>
              <div className="grid gap-6">
                {facilityServices.map((service, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-medium">{service.service_name}</h3>
                        {service.pricing_info && (
                          <Badge variant="secondary" className="text-lg">
                            {service.pricing_info}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Additional details section - we can add more API fields here */}
          {(careTypes || paymentOptions || visitingHours) && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Additional Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {careTypes && careTypes.length > 0 && (
                  <div>
                    <h3 className="font-medium text-lg mb-2">Care Types</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {careTypes.map((type: string, index: number) => (
                        <li key={index}>{type}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {paymentOptions && paymentOptions.length > 0 && (
                  <div>
                    <h3 className="font-medium text-lg mb-2">Payment Options</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {paymentOptions.map((option: string, index: number) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {visitingHours && (
                  <div className="sm:col-span-2">
                    <h3 className="font-medium text-lg mb-2">Visiting Hours</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{visitingHours}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* All photos section */}
          {facilityPhotos.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">All Photos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {facilityPhotos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={photo.url}
                      alt={photo.caption || `Photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews section */}
          {facilityReviews.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-semibold">Reviews</h2>
                {facility.rating && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={facility.rating} />
                    <span className="text-muted-foreground">
                      ({facility.reviews_count || facilityReviews.length})
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {facilityReviews.map((review, index) => (
                  <ReviewItem key={index} review={review} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: contact information and key details */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Card className="border border-border shadow-md overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Contact Information</h3>

                <div className="space-y-4">
                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-2">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{facility.phone}</div>
                    </div>
                  </div>

                  {/* Email */}
                  {facility.email && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-2">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <a href={`mailto:${facility.email}`} className="font-medium text-primary hover:underline">
                          {facility.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {facility.website && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-2">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Website</div>
                        <a
                          href={facility.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline truncate block max-w-[200px]"
                        >
                          {facility.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary rounded-full p-2">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">
                        {facility.address},<br />
                        {facility.city}, {facility.state} {facility.zip}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick facts */}
                {(capacity || foundedYear || staffCount) && (
                  <>
                    <div className="my-6 border-t border-border"></div>
                    <h3 className="text-xl font-semibold mb-4">Quick Facts</h3>
                    <div className="space-y-4">
                      {capacity && (
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary rounded-full p-2">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Capacity</div>
                            <div className="font-medium">{capacity} residents</div>
                          </div>
                        </div>
                      )}

                      {foundedYear && (
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary rounded-full p-2">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Founded</div>
                            <div className="font-medium">{foundedYear}</div>
                          </div>
                        </div>
                      )}
                      {staffCount && (
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary rounded-full p-2">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Staff Count</div>
                            <div className="font-medium">{staffCount}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className="mt-6 space-y-3">
                  <Button className="w-full">
                    Contact Facility
                  </Button>
                  <Button variant="outline" className="w-full">
                    Request Tour
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}