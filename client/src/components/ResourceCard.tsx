import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Phone, Globe, MapPin } from "lucide-react";
import type { Resource } from "@shared/schema";

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">{resource.name}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {resource.category.replace('_', ' ').toUpperCase()}
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
        </div>
      </CardContent>
    </Card>
  );
}
