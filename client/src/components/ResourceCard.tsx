import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Phone, Globe, MapPin, Star } from "lucide-react";
import type { Resource } from "@shared/schema";
import { getResourceLogoUrl } from "@/lib/logoUtils";

interface ResourceCardProps {
  resource: Resource;
  horizontal?: boolean; // Add prop to support horizontal layout
}

// Simple star rating component
const StarRating = ({ rating, reviewsCount }: { rating: string | null, reviewsCount?: number | null }) => {
  if (!rating) return null;

  const numericRating = parseFloat(rating);
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;

  return (
    <div className="flex items-center mt-1">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          size={16}
          className={`${
            i < fullStars 
              ? 'text-yellow-400 fill-yellow-400' 
              : i === fullStars && hasHalfStar 
                ? 'text-yellow-400 fill-yellow-400/50' 
                : 'text-gray-300'
          }`} 
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">
        {rating}
        {reviewsCount && ` (${reviewsCount})`}
      </span>
    </div>
  );
};

export default function ResourceCard({ resource, horizontal = false }: ResourceCardProps) {
  // Get the first photo for thumbnail display if available
  const resourcePhotos = Array.isArray(resource.photos) ? resource.photos : [];
  const thumbnailPhoto = resourcePhotos.length > 0 ? resourcePhotos[0] : null;

  // Get reviews and ensure they are properly typed
  const resourceReviews = Array.isArray(resource.reviews) ? resource.reviews : [];

  // Get the logo URL (either from stored value or generate from website)
  const logoUrl = getResourceLogoUrl(resource);

  // Wrap the card content in a Link for navigation
  const wrapWithLink = (content: JSX.Element) => (
    <Link href={`/resource/${resource.id}`} className="block no-underline text-foreground">
      {content}
    </Link>
  );

  if (horizontal) {
    // Horizontal layout (image on left, content on right)
    return wrapWithLink(
      <Card className="mb-6 card-shadow overflow-hidden border border-border hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          {/* Left side: Image/Logo */}
          <div className="w-full md:w-1/3 relative h-48 md:h-auto">
            {thumbnailPhoto ? (
              <div className="w-full h-full relative">
                <img 
                  src={thumbnailPhoto.url} 
                  alt={thumbnailPhoto.caption || resource.name} 
                  className="w-full h-full object-cover"
                />
                {/* Logo overlay if available */}
                {logoUrl && (
                  <div className="absolute top-2 right-2 bg-card rounded-md p-1 shadow-sm">
                    <img 
                      src={logoUrl} 
                      alt={`${resource.name} logo`} 
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ) : logoUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                <img 
                  src={logoUrl} 
                  alt={`${resource.name} logo`} 
                  className="w-24 h-24 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/20 text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {/* Right side: Content */}
          <div className="w-full md:w-2/3 p-4">
            <div className="flex justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold hover:text-primary transition-colors">
                  {resource.name}
                </h2>
                <div className="text-sm text-muted-foreground">
                  {resource.category.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              {resource.rating && (
                <StarRating rating={resource.rating} reviewsCount={resource.reviews_count} />
              )}
            </div>

            <p className="text-muted-foreground mb-3 line-clamp-2">{resource.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {resource.contact && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm truncate">{resource.contact}</span>
                </div>
              )}

              {resource.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm truncate">
                    {resource.city}, {resource.state}
                  </span>
                </div>
              )}

              {resource.website && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <a 
                    href={resource.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm truncate"
                    onClick={(e) => e.stopPropagation()} // Prevent card navigation
                  >
                    {resource.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
            </div>

            {resourceReviews.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-sm font-medium">Latest Review:</div>
                <div className="text-sm text-muted-foreground italic line-clamp-2">
                  "{resourceReviews[0].text || ''}"
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  - {resourceReviews[0].author || 'Anonymous'}, {resourceReviews[0].date || 'No date'}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Original vertical card layout (for other pages that might still need it)
  return wrapWithLink(
    <Card className="h-full card-shadow border border-border hover:shadow-lg transition-shadow">
      {thumbnailPhoto && (
        <div className="w-full h-48 overflow-hidden border-b border-border relative">
          <img 
            src={thumbnailPhoto.url} 
            alt={thumbnailPhoto.caption || resource.name} 
            className="w-full h-full object-cover"
          />

          {/* Logo overlay in corner if available */}
          {logoUrl && (
            <div className="absolute top-2 right-2 bg-card rounded-md p-1 shadow-sm">
              <img 
                src={logoUrl} 
                alt={`${resource.name} logo`} 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  // Hide the logo container if the image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* If no thumbnail photo but we have a logo, show logo more prominently */}
      {!thumbnailPhoto && logoUrl && (
        <div className="w-full flex justify-center py-4 border-b border-border">
          <img 
            src={logoUrl} 
            alt={`${resource.name} logo`} 
            className="h-16 object-contain"
            onError={(e) => {
              // Hide the image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-xl">{resource.name}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {resource.category.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          {resource.rating && (
            <StarRating rating={resource.rating} reviewsCount={resource.reviews_count} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{resource.description}</p>

        <div className="space-y-2">
          {resource.contact && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span>{resource.contact}</span>
            </div>
          )}

          {resource.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <a 
                href={resource.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()} // Prevent card navigation
              >
                Visit Website
              </a>
            </div>
          )}

          {resource.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                {resource.address}, {resource.city}, {resource.state} {resource.zip}
              </span>
            </div>
          )}

          {resourceReviews.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-sm font-medium mb-2">Latest Review:</div>
              <div className="text-sm text-muted-foreground italic">
                "{resourceReviews[0].text?.substring(0, 150)}
                {resourceReviews[0].text && resourceReviews[0].text.length > 150 ? '...' : ''}"
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                - {resourceReviews[0].author || 'Anonymous'}, {resourceReviews[0].date || 'No date'}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}