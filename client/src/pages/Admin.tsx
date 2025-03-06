import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";

interface SyncFormData {
  locations: string[];
  customLocations: string;
}

const defaultLocations = [
  "Denver",
  "Boulder",
  "Fort Collins",
  "Colorado Springs",
  "Arvada",
  "Golden",
  "Littleton",
  "Aurora",
  "Centennial"
];

export default function Admin() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "found" | "missing">("checking");

  const form = useForm<SyncFormData>({
    defaultValues: {
      locations: defaultLocations,
      customLocations: "",
    }
  });

  // Check if Apify API key is set
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/apify/check-api-key");
        if (response.ok) {
          setApiKeyStatus("found");
        } else {
          setApiKeyStatus("missing");
        }
      } catch (error) {
        setApiKeyStatus("missing");
      }
    };

    checkApiKey();
  }, []);

  const onSubmit = async (data: SyncFormData) => {
    try {
      setIsLoading(true);
      setSyncStatus("idle");

      // Combine selected locations with custom locations
      let allLocations = [...data.locations];

      if (data.customLocations.trim()) {
        const customLocationsList = data.customLocations
          .split(",")
          .map(loc => loc.trim())
          .filter(Boolean);

        allLocations = [...allLocations, ...customLocationsList];
      }

      // Make API request to start sync
      await apiRequest("POST", "/api/apify/sync", { locations: allLocations });

      toast({
        title: "Sync job started",
        description: "The Apify sync job has been started. It will run in the background.",
      });

      setSyncStatus("success");
    } catch (error) {
      console.error("Error starting sync:", error);
      toast({
        title: "Sync failed",
        description: "There was a problem starting the Apify sync job.",
        variant: "destructive",
      });

      setSyncStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Apify Data Synchronization</CardTitle>
          <CardDescription>
            Trigger a manual sync with Apify to update facility and resource data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeyStatus === "checking" && (
            <Alert className="mb-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Checking API Key</AlertTitle>
              <AlertDescription>
                Checking if Apify API key is configured...
              </AlertDescription>
            </Alert>
          )}

          {apiKeyStatus === "missing" && (
            <Alert variant="destructive" className="mb-6">
              <CircleX className="h-4 w-4" />
              <AlertTitle>API Key Not Found</AlertTitle>
              <AlertDescription>
                Apify API key is not configured. Contact the administrator to set up the API key.
              </AlertDescription>
            </Alert>
          )}

          {apiKeyStatus === "found" && (
            <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <AlertTitle>API Key Configured</AlertTitle>
              <AlertDescription>
                Apify API key is configured and ready to use.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Select locations to scrape</h3>
              <div className="grid grid-cols-3 gap-4">
                {defaultLocations.map((location) => (
                  <div key={location} className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${location}`}
                      checked={form.watch("locations").includes(location)}
                      onCheckedChange={(checked) => {
                        const currentLocations = form.watch("locations");
                        if (checked) {
                          form.setValue("locations", [...currentLocations, location]);
                        } else {
                          form.setValue(
                            "locations",
                            currentLocations.filter((loc) => loc !== location)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`location-${location}`}
                      className="text-sm font-normal"
                    >
                      {location}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="customLocations">Custom locations (comma-separated)</Label>
              <Input
                id="customLocations"
                placeholder="e.g. Englewood, Lakewood, Parker"
                {...form.register("customLocations")}
              />
              <p className="text-sm text-gray-500 mt-1">
                Add additional Colorado locations not in the list above
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || apiKeyStatus !== "found"}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Sync...
                </>
              ) : (
                "Start Apify Sync"
              )}
            </Button>

            {syncStatus === "success" && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CircleCheck className="h-4 w-4 text-green-500" />
                <AlertTitle>Sync Started</AlertTitle>
                <AlertDescription>
                  The sync job has been started successfully. It will run in the background.
                </AlertDescription>
              </Alert>
            )}

            {syncStatus === "error" && (
              <Alert variant="destructive">
                <CircleX className="h-4 w-4" />
                <AlertTitle>Sync Failed</AlertTitle>
                <AlertDescription>
                  There was a problem starting the sync job. Check the console for details.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}