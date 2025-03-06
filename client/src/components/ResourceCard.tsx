import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Phone, Globe, MapPin, Star } from "lucide-react";
import type { Resource } from "@shared/schema";

interface ResourceCardProps {
  resource: Resource;
}

// Simple star rating component
const StarRating = ({ rating }: { rating: string | null }) => {
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
        {resource.reviews_count && ` (${resource.reviews_count})`}
      </span>
    </div>
  );
};

export default function ResourceCard({ resource }: ResourceCardProps) {
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
            <StarRating rating={resource.rating} />
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

          {resource.reviews && resource.reviews.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm font-medium mb-2">Latest Review:</div>
              <div className="text-sm text-gray-600 italic">
                "{resource.reviews[0].text.substring(0, 150)}
                {resource.reviews[0].text.length > 150 ? '...' : ''}"
              </div>
              <div className="text-xs text-gray-500 mt-1">
                - {resource.reviews[0].author}, {resource.reviews[0].date}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}