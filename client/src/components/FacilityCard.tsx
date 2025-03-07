import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Globe, MapPin, Star } from "lucide-react";
import type { Facility, Service } from "@shared/schema";
import { getFacilityLogoUrl } from "@/lib/logoUtils";
import FavoriteButton from "./FavoriteButton";

interface FacilityCardProps {
  facility: Facility;
  horizontal?: boolean;
}

const StarRating = ({ rating, reviewsCount }: { rating: string | null; reviewsCount?: number | null }) => {
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
              ? "text-yellow-400 fill-yellow-400"
              : i === fullStars && hasHalfStar
              ? "text-yellow-400 fill-yellow-400/50"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">
        {rating}
        {reviewsCount && reviewsCount > 0 && ` (${reviewsCount})`}
      </span>
    </div>
  );
};

// Services summary component
const ServicesSummary = ({ services }: { services: any[] }) => {
  if (!services || !Array.isArray(services) || services.length === 0) return null;

  // Validate service structure before rendering
  const validServices = services.filter(service => 
    service && 
    typeof service === 'object' && 
    'service_name' in service && 
    typeof service.service_name === 'string'
  ).slice(0, 3);

  if (validServices.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {validServices.map((service, i) => (
        <Badge key={i} variant="outline" className="flex items-center gap-1">
          <span>{service.service_name}</span>
          {service.pricing_info && typeof service.pricing_info === 'string' && (
            <span className="text-xs text-muted-foreground">
              ({service.pricing_info.replace(/per month/i, '/mo')})
            </span>
          )}
        </Badge>
      ))}
      {services.length > 3 && (
        <Badge variant="outline">+{services.length - 3} more</Badge>
      )}
    </div>
  );
};

export default function FacilityCard({ facility, horizontal = false }: FacilityCardProps) {
  const facilityPhotos = Array.isArray(facility.photos) ? facility.photos : [];
  const thumbnailPhoto = facilityPhotos.length > 0 ? facilityPhotos[0] : null;
  const logoUrl = getFacilityLogoUrl(facility);

  // Safe access to services with type checking
  const facilityServices = facility.services && typeof facility.services === 'object' ? 
    Array.isArray(facility.services) ? facility.services : [] : [];

  if (horizontal) {
    return (
      <Card className="mb-6 card-shadow overflow-hidden border border-border">
        <div className="flex flex-col md:flex-row">
          {/* Image section */}
          <div className="w-full md:w-1/3 relative h-48 md:h-auto">
            {thumbnailPhoto ? (
              <div className="w-full h-full relative">
                <img
                  src={thumbnailPhoto.url}
                  alt={thumbnailPhoto.caption || facility.name}
                  className="w-full h-full object-cover"
                />
                {logoUrl && (
                  <div className="absolute top-2 right-2 bg-card rounded-md p-1 shadow-sm">
                    <img
                      src={logoUrl}
                      alt={`${facility.name} logo`}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <FavoriteButton type="facility" itemId={facility.id} />
                </div>
              </div>
            ) : logoUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                <img
                  src={logoUrl}
                  alt={`${facility.name} logo`}
                  className="w-24 h-24 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/20 text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {/* Content section */}
          <div className="w-full md:w-2/3 p-4">
            <div className="flex justify-between mb-2">
              <div>
                <Link href={`/facility/${facility.id}`}>
                  <h2 className="text-xl font-bold hover:text-primary transition-colors cursor-pointer">
                    {facility.name}
                  </h2>
                </Link>
                <div className="text-sm text-muted-foreground">
                  {facility.type.replace("_", " ").toUpperCase()}
                </div>
              </div>
              {facility.rating && (
                <StarRating rating={facility.rating} reviewsCount={facility.reviews_count} />
              )}
            </div>

            <p className="text-muted-foreground mb-3 line-clamp-2">{facility.description}</p>

            <div className="mb-3 flex flex-wrap gap-2">
              {facility.amenities?.slice(0, 3).map((amenity, i) => (
                <Badge key={i} variant="secondary">
                  {amenity}
                </Badge>
              ))}
              {facility.amenities && facility.amenities.length > 3 && (
                <Badge variant="outline">+{facility.amenities.length - 3} more</Badge>
              )}
            </div>

            {facilityServices.length > 0 && (
              <div className="mb-3">
                <ServicesSummary services={facilityServices} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm truncate">{facility.phone}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm truncate">
                  {facility.city}, {facility.state}
                </span>
              </div>

              {facility.website && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <a
                    href={facility.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm truncate"
                  >
                    {facility.website.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Vertical layout
  return (
    <Card className="h-full card-shadow border border-border">
      {thumbnailPhoto && (
        <div className="w-full h-48 overflow-hidden border-b border-border relative">
          <img
            src={thumbnailPhoto.url}
            alt={thumbnailPhoto.caption || facility.name}
            className="w-full h-full object-cover"
          />
          {logoUrl && (
            <div className="absolute top-2 right-2 bg-card rounded-md p-1 shadow-sm">
              <img
                src={logoUrl}
                alt={`${facility.name} logo`}
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.style.display = "none";
                }}
              />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <FavoriteButton type="facility" itemId={facility.id} />
          </div>
        </div>
      )}

      {!thumbnailPhoto && logoUrl && (
        <div className="w-full flex justify-center py-4 border-b border-border">
          <img
            src={logoUrl}
            alt={`${facility.name} logo`}
            className="h-16 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
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
              {facility.type.replace("_", " ").toUpperCase()}
            </div>
          </div>
          {facility.rating && (
            <StarRating rating={facility.rating} reviewsCount={facility.reviews_count} />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-3">{facility.description}</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {facility.amenities?.map((amenity, i) => (
            <Badge key={i} variant="secondary">
              {amenity}
            </Badge>
          ))}
        </div>

        {facilityServices.length > 0 && (
          <div className="mb-4">
            <ServicesSummary services={facilityServices} />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span>{facility.phone}</span>
          </div>

          {facility.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href={`mailto:${facility.email}`} className="text-primary hover:underline">
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