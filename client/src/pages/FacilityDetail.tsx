import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Globe, MapPin, Star, Info, ExternalLink, Heart } from "lucide-react";
import type { Facility, Review, Photo } from "@shared/schema";
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
              size={16}
              className={`${
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

  // For multiple photos, create a grid layout
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 h-[400px]">
      <div className="md:col-span-2 md:row-span-2 rounded-xl overflow-hidden h-full">
        <img
          src={photos[0].url}
          alt={photos[0].caption || "Primary facility image"}
          className="w-full h-full object-cover"
        />
      </div>

      {photos.slice(1, 5).map((photo, index) => (
        <div key={index} className="hidden md:block rounded-xl overflow-hidden h-full">
          <img
            src={photo.url}
            alt={photo.caption || `Facility image ${index + 2}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

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

  const logoUrl = getFacilityLogoUrl(facility);

  // TypeScript safety: ensure arrays are treated as arrays
  const facilityReviews = Array.isArray(facility.reviews) ? facility.reviews : [];
  const facilityPhotos = Array.isArray(facility.photos) ? facility.photos : [];
  const facilityAmenities = Array.isArray(facility.amenities) ? facility.amenities : [];
  const facilityServices = Array.isArray(facility.services) ? facility.services : [];

  return (
    <div className="container mx-auto px-4 py-8">
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

          {/* Services section */}
          {facilityServices.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-6">Services</h2>
              <div className="flex flex-wrap gap-3">
                {facilityServices.map((service, index) => (
                  <Badge key={index} variant="secondary" className="text-base py-2">
                    {service}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Amenities section */}
          {facilityAmenities.length > 0 && (
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

        {/* Sidebar: contact information */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 border border-border shadow-md overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>

              <div className="space-y-4">
                {/* Phone */}
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>{facility.phone}</span>
                </div>

                {/* Email */}
                {facility.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href={`mailto:${facility.email}`} className="text-primary hover:underline">
                      {facility.email}
                    </a>
                  </div>
                )}

                {/* Website */}
                {facility.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <a
                      href={facility.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                {/* Address */}
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>
                    {facility.address}, {facility.city}, {facility.state} {facility.zip}
                  </span>
                </div>
              </div>

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
  );
}