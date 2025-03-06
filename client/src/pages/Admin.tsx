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
  const [syncProgress, setSyncProgress] = useState<string | null>(null);

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

  // Poll for sync progress if a sync is in progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isLoading) {
      interval = setInterval(async () => {
        try {
          const response = await fetch("/api/apify/sync-status");
          if (response.ok) {
            const data = await response.json();

            if (data.status === "completed") {
              setIsLoading(false);
              setSyncStatus("success");
              setSyncProgress(`Completed! Processed ${data.processedItems || 0} items.`);
              if (interval) clearInterval(interval);
            } else if (data.status === "error") {
              setIsLoading(false);
              setSyncStatus("error");
              setSyncProgress(data.message || "Error occurred during sync");
              if (interval) clearInterval(interval);
            } else {
              // Update progress message and percentage
              setSyncProgress(data.message || "Processing...");

              // If we have total items info, show progress percentage
              if (data.totalItems > 0 && data.processedItems >= 0) {
                const percentage = Math.round((data.processedItems / data.totalItems) * 100);
                setSyncProgress(`${data.message || "Processing..."} (${percentage}% complete)`);
              }
            }
          }
        } catch (error) {
          console.error("Error checking sync status:", error);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const onSubmit = async (data: SyncFormData) => {
    try {
      setIsLoading(true);
      setSyncStatus("idle");
      setSyncProgress("Starting sync job...");

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

      // Don't set success yet, we'll wait for the polling to tell us when it's done
    } catch (error) {
      console.error("Error starting sync:", error);
      toast({
        title: "Sync failed",
        description: "There was a problem starting the Apify sync job.",
        variant: "destructive",
      });

      setSyncStatus("error");
      setIsLoading(false);
      setSyncProgress(null);
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
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      The sync process can take a long time, especially with multiple locations.
                      The job will run in the background and you can check progress here. You can
                      leave this page and come back later - the sync will continue running.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                  {syncProgress || "Starting Sync..."}
                </>
              ) : (
                "Start Apify Sync"
              )}
            </Button>

            {isLoading && syncProgress && (
              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <AlertTitle>Sync In Progress</AlertTitle>
                <AlertDescription>
                  {syncProgress}
                </AlertDescription>
              </Alert>
            )}

            {syncStatus === "success" && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CircleCheck className="h-4 w-4 text-green-500" />
                <AlertTitle>Sync Completed</AlertTitle>
                <AlertDescription>
                  {syncProgress || "The sync job has completed successfully."}
                </AlertDescription>
              </Alert>
            )}

            {syncStatus === "error" && (
              <Alert variant="destructive">
                <CircleX className="h-4 w-4" />
                <AlertTitle>Sync Failed</AlertTitle>
                <AlertDescription>
                  {syncProgress || "There was a problem with the sync job. Check the console for details."}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}