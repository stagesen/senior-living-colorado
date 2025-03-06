import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, Globe, MapPin, Star, MessageSquare, Image } from "lucide-react";
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
              ? 'text-yellow-400 fill-yellow-400' 
              : i === fullStars && hasHalfStar 
                ? 'text-yellow-400 fill-yellow-400/50' 
                : 'text-gray-300'
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
    <div className="border-b border-border pb-4 mb-4 last:border-0">
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
                i < review.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
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

// Photo gallery component
const PhotoGallery = ({ photos }: { photos: Photo[] }) => {
  if (!photos || photos.length === 0) {
    return <div className="text-muted-foreground">No photos available</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((photo, index) => (
        <div key={index} className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden border border-border">
          <img 
            src={photo.url} 
            alt={photo.caption || `Photo ${index + 1}`} 
            className="w-full h-full object-cover"
          />
          {photo.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
              {photo.caption}
            </div>
          )}
        </div>
      ))}
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

  // TypeScript safety: ensure reviews and photos are treated as arrays
  const facilityReviews = Array.isArray(facility.reviews) ? facility.reviews : [];
  const facilityPhotos = Array.isArray(facility.photos) ? facility.photos : [];

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
        <div className="flex gap-4 items-center">
          {/* Facility Logo */}
          {logoUrl && (
            <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
              <img 
                src={logoUrl} 
                alt={`${facility.name} logo`} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  // Hide the logo container if the image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}

          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{facility.name}</h1>
            <div className="text-lg text-muted-foreground mb-2">
              {facility.type.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>

        {facility.rating && (
          <div className="text-right">
            <StarRating rating={facility.rating} />
            <div className="text-sm text-muted-foreground">
              {facility.reviews_count || 0} reviews
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="details" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="details" className="text-base">Details</TabsTrigger>
          {facilityReviews.length > 0 && (
            <TabsTrigger value="reviews" className="flex items-center gap-1 text-base">
              <MessageSquare className="h-4 w-4" />
              Reviews
            </TabsTrigger>
          )}
          {facilityPhotos.length > 0 && (
            <TabsTrigger value="photos" className="flex items-center gap-1 text-base">
              <Image className="h-4 w-4" />
              Photos
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details">
          <Card className="border border-border">
            <CardContent className="p-6">
              <p className="text-lg mb-6">{facility.description}</p>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {facility.amenities?.map((amenity, i) => (
                    <Badge key={i} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Contact Information</h2>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-lg">{facility.phone}</span>
                </div>

                {facility.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <a 
                      href={`mailto:${facility.email}`}
                      className="text-lg text-primary hover:underline"
                    >
                      {facility.email}
                    </a>
                  </div>
                )}

                {facility.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <a 
                      href={facility.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-lg">
                    {facility.address}, {facility.city}, {facility.state} {facility.zip}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {facilityReviews.length > 0 && (
          <TabsContent value="reviews">
            <Card className="border border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Reviews 
                  {facility.reviews_count && <span className="text-muted-foreground ml-2">({facility.reviews_count} total)</span>}
                </h2>

                <div className="space-y-6">
                  {facilityReviews.map((review, index) => (
                    <ReviewItem key={index} review={review} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {facilityPhotos.length > 0 && (
          <TabsContent value="photos">
            <Card className="border border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Photo Gallery</h2>
                <PhotoGallery photos={facilityPhotos} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}