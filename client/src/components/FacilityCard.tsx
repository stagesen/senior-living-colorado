import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { Facility } from "@shared/schema";
import { Link } from "wouter";

interface FacilityCardProps {
  facility: Facility;
}

export default function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">
          <Link href={`/facility/${facility.id}`}>
            <a className="hover:text-primary transition-colors">
              {facility.name}
            </a>
          </Link>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {facility.type.replace('_', ' ').toUpperCase()}
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
