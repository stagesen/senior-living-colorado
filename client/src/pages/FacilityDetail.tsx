import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { Facility } from "@shared/schema";

export default function FacilityDetail() {
  const { id } = useParams();
  
  const { data: facility, isLoading } = useQuery<Facility>({
    queryKey: [`/api/facilities/${id}`],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading facility details...</div>;
  }

  if (!facility) {
    return <div className="text-center py-8">Facility not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{facility.name}</h1>
      <div className="text-lg text-muted-foreground mb-6">
        {facility.type.replace('_', ' ').toUpperCase()}
      </div>

      <Card className="mb-8">
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
    </div>
  );
}
