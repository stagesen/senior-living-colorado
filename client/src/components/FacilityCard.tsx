import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Globe, MapPin, Star } from "lucide-react";
import type { Facility } from "@shared/schema";
import { Link } from "wouter";

interface FacilityCardProps {
  facility: Facility;
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

export default function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-xl">
              <Link href={`/facility/${facility.id}`}>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  {facility.name}
                </span>
              </Link>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {facility.type.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          {facility.rating && (
            <StarRating rating={facility.rating} reviewsCount={facility.reviews_count} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{facility.description}</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {facility.amenities?.map((amenity, i) => (
            <Badge key={i} variant="secondary">
              {amenity}
            </Badge>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span>{facility.phone}</span>
          </div>

          {facility.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a 
                href={`mailto:${facility.email}`}
                className="text-primary hover:underline"
              >
                {facility.email}
              </a>
            </div>
          )}

          {facility.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
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

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>
              {facility.address}, {facility.city}, {facility.state} {facility.zip}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}