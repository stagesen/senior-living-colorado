import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Globe, MapPin, Star, Info, ExternalLink, Heart } from "lucide-react";
import type { Resource, Review, Photo } from "@shared/schema";
import { getResourceLogoUrl } from "@/lib/logoUtils";

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

// Hero gallery component
const HeroGallery = ({ photos }: { photos: Photo[] }) => {
  if (!photos || photos.length === 0) {
    return (
      <div className="h-[300px] bg-secondary/20 rounded-lg flex items-center justify-center mb-8">
        <div className="text-muted-foreground text-lg">No photos available</div>
      </div>
    );
  }

  // If only one photo, show it full width
  if (photos.length === 1) {
    return (
      <div className="relative h-[300px] rounded-xl overflow-hidden mb-8">
        <img 
          src={photos[0].url} 
          alt={photos[0].caption || "Resource image"} 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // For multiple photos, create a grid layout
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 h-[300px]">
      {/* First photo takes 2 rows and 2 columns */}
      <div className="md:col-span-2 md:row-span-2 rounded-xl overflow-hidden h-full">
        <img 
          src={photos[0].url} 
          alt={photos[0].caption || "Primary resource image"} 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Other photos */}
      {photos.slice(1, 5).map((photo, index) => (
        <div key={index} className="hidden md:block rounded-xl overflow-hidden h-full">
          <img 
            src={photo.url} 
            alt={photo.caption || `Resource image ${index + 2}`} 
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

export default function ResourceDetail() {
  const { id } = useParams();

  const { data: resource, isLoading } = useQuery<Resource>({
    queryKey: [`/api/resources/${id}`],
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

  if (!resource) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Resource Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find the resource you're looking for. It may have been removed or the URL might be incorrect.
          </p>
        </div>
      </div>
    );
  }

  // Get logo URL from website or stored value
  const logoUrl = getResourceLogoUrl(resource);

  // TypeScript safety: ensure reviews and photos are treated as arrays
  const resourceReviews = Array.isArray(resource.reviews) ? resource.reviews : [];
  const resourcePhotos = Array.isArray(resource.photos) ? resource.photos : [];

  // Optional fields with type safety
  const resourceServices = resource.services as string[] | undefined;
  const resourceEmail = (resource as any).email as string | undefined;
  const resourceHours = (resource as any).hours as string | undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground mb-4">
        <a href="/" className="hover:underline">Home</a> &gt; 
        <a href="/resources" className="hover:underline"> Resource Directory</a> &gt; 
        <span className="text-foreground"> {resource.name}</span>
      </div>

      {/* Page title with category */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{resource.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-muted-foreground">
            <Badge variant="secondary" className="text-sm">
              {resource.category.replace('_', ' ').toUpperCase()}
            </Badge>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{resource.city}, {resource.state}</span>
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
      <HeroGallery photos={resourcePhotos} />

      {/* Main content layout: 2/3 for main content, 1/3 for sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content column */}
        <div className="lg:col-span-2 space-y-10">
          {/* Resource description */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">About {resource.name}</h2>
              {logoUrl && (
                <div className="bg-card rounded-lg p-2 shadow-sm border border-border">
                  <img 
                    src={logoUrl} 
                    alt={`${resource.name} logo`} 
                    className="h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-lg leading-relaxed">{resource.description}</p>
          </section>

          {/* Services section if available */}
          {resourceServices && resourceServices.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Services Offered</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resourceServices.map((service, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews section */}
          {resourceReviews.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-semibold">Reviews</h2>
                {resource.rating && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={resource.rating} />
                    <span className="text-muted-foreground">
                      ({resource.reviews_count || resourceReviews.length})
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {resourceReviews.map((review, index) => (
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
                  {resource.contact && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-2">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{resource.contact}</div>
                      </div>
                    </div>
                  )}

                  {/* Email - check if it exists on the resource */}
                  {resourceEmail && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-2">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <a href={`mailto:${resourceEmail}`} className="font-medium text-primary hover:underline">
                          {resourceEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {resource.website && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-2">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Website</div>
                        <a 
                          href={resource.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline truncate block max-w-[200px]"
                        >
                          {resource.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {resource.address && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-2">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Address</div>
                        <div className="font-medium">
                          {resource.address},<br />
                          {resource.city}, {resource.state} {resource.zip}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hours of operation if available */}
                {resourceHours && (
                  <>
                    <div className="my-6 border-t border-border"></div>
                    <h3 className="text-xl font-semibold mb-4">Hours of Operation</h3>
                    <div className="text-muted-foreground">
                      {resourceHours}
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className="mt-6 space-y-3">
                  <Button className="w-full">
                    Contact Resource
                  </Button>
                  <Button variant="outline" className="w-full">
                    Get More Information
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