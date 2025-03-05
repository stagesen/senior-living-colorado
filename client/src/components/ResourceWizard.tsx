import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { type WizardFormData, wizardFormSchema } from "@shared/schema";

const STEPS = ["category", "location", "for_whom", "specific_needs", "notes"] as const;

const CATEGORY_OPTIONS = {
  senior_living: "Senior Living & Housing",
  health_wellness: "Health & Wellness Services",
  social_community: "Social & Community Activities",
  transportation: "Transportation Services",
  financial_legal: "Financial & Legal Assistance",
  caregiving_support: "Caregiving & Family Support",
  volunteer_employment: "Volunteer & Employment Opportunities",
  education_learning: "Educational & Lifelong Learning"
};

const LOCATION_OPTIONS = {
  denver_metro: "Denver Metro",
  boulder_broomfield: "Boulder & Broomfield",
  arvada_golden: "Arvada & Golden",
  littleton_highlands_ranch: "Littleton & Highlands Ranch",
  aurora_centennial: "Aurora & Centennial",
  fort_collins_loveland: "Fort Collins & Loveland",
  colorado_springs: "Colorado Springs",
  other: "Other"
};

const FOR_WHOM_OPTIONS = {
  self: "Myself",
  parent_grandparent: "Parent or Grandparent",
  spouse_partner: "Spouse or Partner",
  friend_neighbor: "Friend or Neighbor",
  client: "Client (professional use)",
  other: "Other"
};

export default function ResourceWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  
  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: {
      specific_needs: [],
      notes: "",
    },
  });

  const onSubmit = (data: WizardFormData) => {
    // Convert form data to URL parameters
    const params = new URLSearchParams({
      category: data.category,
      location: data.location,
      needs: data.specific_needs.join(","),
    });
    
    setLocation(`/resources?${params.toString()}`);
  };

  const currentStepName = STEPS[currentStep];
  
  const getSpecificNeedsOptions = () => {
    const category = form.getValues("category");
    switch (category) {
      case "health_wellness":
        return [
          "Home Health Care",
          "Memory Care Specialists",
          "Physical Therapy & Rehab",
          "Mental Health Support",
          "Nutrition & Meal Services",
          "Fall Prevention Programs",
          "Hospice & Palliative Care"
        ];
      case "transportation":
        return [
          "Medical Transportation",
          "Volunteer Drivers",
          "Public Transit Assistance",
          "Accessible Transportation"
        ];
      case "financial_legal":
        return [
          "Estate & Financial Planning",
          "Medicare/Medicaid Support",
          "Long-term Care Insurance",
          "Legal Advocacy & Elder Law"
        ];
      default:
        return [];
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Find Senior Resources</CardTitle>
        <CardDescription>
          Step {currentStep + 1} of {STEPS.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {currentStepName === "category" && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What type of senior resources are you exploring today?</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_OPTIONS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentStepName === "location" && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please select your preferred location or area:</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(LOCATION_OPTIONS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentStepName === "for_whom" && (
              <FormField
                control={form.control}
                name="for_whom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who are you gathering resources for?</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FOR_WHOM_OPTIONS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentStepName === "specific_needs" && (
              <FormField
                control={form.control}
                name="specific_needs"
                render={() => (
                  <FormItem>
                    <FormLabel>Select all that apply:</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      {getSpecificNeedsOptions().map((need) => (
                        <FormField
                          key={need}
                          control={form.control}
                          name="specific_needs"
                          render={({ field }) => (
                            <FormItem
                              key={need}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(need)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    const updated = checked
                                      ? [...current, need]
                                      : current.filter((value) => value !== need);
                                    field.onChange(updated);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {need}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentStepName === "notes" && (
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional notes or requirements (optional):</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any specific requirements or preferences..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                type={currentStep === STEPS.length - 1 ? "submit" : "button"}
                onClick={() => {
                  if (currentStep < STEPS.length - 1) {
                    setCurrentStep((s) => s + 1);
                  }
                }}
              >
                {currentStep === STEPS.length - 1 ? "Show Resources" : "Next"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
