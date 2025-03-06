import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Phone, Globe, MapPin, Star } from "lucide-react";
import type { Resource } from "@shared/schema";

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
      <span className="ml-1 text-sm text-gray-600">
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

  if (horizontal) {
    // Horizontal layout (image on left, content on right)
    return (
      <Card className="mb-6 hover:shadow-lg transition-shadow overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left side: Image/Logo */}
          <div className="w-full md:w-1/3 relative h-48 md:h-auto">
            {thumbnailPhoto ? (
              <div className="w-full h-full">
                <img 
                  src={thumbnailPhoto.url} 
                  alt={thumbnailPhoto.caption || resource.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
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

            <p className="text-gray-600 mb-3 line-clamp-2">{resource.description}</p>

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
                  >
                    {resource.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
            </div>

            {resource.reviews && Array.isArray(resource.reviews) && resource.reviews.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm font-medium">Latest Review:</div>
                <div className="text-sm text-gray-600 italic line-clamp-2">
                  "{resource.reviews[0].text}"
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  - {resource.reviews[0].author || 'Anonymous'}, {resource.reviews[0].date || 'No date'}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Original vertical card layout (for other pages that might still need it)
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
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
        <p className="text-gray-600 mb-4">{resource.description}</p>

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

          {resource.reviews && Array.isArray(resource.reviews) && resource.reviews.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm font-medium mb-2">Latest Review:</div>
              <div className="text-sm text-gray-600 italic">
                "{resource.reviews[0].text?.substring(0, 150)}
                {resource.reviews[0].text && resource.reviews[0].text.length > 150 ? '...' : ''}"
              </div>
              <div className="text-xs text-gray-500 mt-1">
                - {resource.reviews[0].author || 'Anonymous'}, {resource.reviews[0].date || 'No date'}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}