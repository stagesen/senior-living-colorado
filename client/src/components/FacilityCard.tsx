import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Globe, MapPin, Star } from "lucide-react";
import type { Facility } from "@shared/schema";
import { Link } from "wouter";
import { getFacilityLogoUrl } from "@/lib/logoUtils";

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
        {reviewsCount && reviewsCount > 0 && ` (${reviewsCount})`}
      </span>
    </div>
  );
};

export default function FacilityCard({ facility }: FacilityCardProps) {
  // Get the first photo for thumbnail display if available
  const facilityPhotos = Array.isArray(facility.photos) ? facility.photos : [];
  const thumbnailPhoto = facilityPhotos.length > 0 ? facilityPhotos[0] : null;

  // Get the logo URL (either from stored value or generate from website)
  const logoUrl = getFacilityLogoUrl(facility);

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {thumbnailPhoto && (
        <div className="w-full h-48 overflow-hidden border-b relative">
          <img 
            src={thumbnailPhoto.url} 
            alt={thumbnailPhoto.caption || facility.name} 
            className="w-full h-full object-cover"
          />

          {/* Logo overlay in corner if available */}
          {logoUrl && (
            <div className="absolute top-2 right-2 bg-white rounded-md p-1 shadow-md">
              <img 
                src={logoUrl} 
                alt={`${facility.name} logo`} 
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
        <div className="w-full flex justify-center py-4 border-b">
          <img 
            src={logoUrl} 
            alt={`${facility.name} logo`} 
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