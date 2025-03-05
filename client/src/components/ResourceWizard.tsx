import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
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
  const [direction, setDirection] = useState(0);
  const [, setLocation] = useLocation();

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: {
      specific_needs: [],
      notes: "",
    },
  });

  useEffect(() => {
    // Reset form errors when step changes
    form.clearErrors();
  }, [currentStep, form]);

  const onSubmit = (data: WizardFormData) => {
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

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-2 flex-1 mx-1 rounded ${
                index <= currentStep ? "bg-primary" : "bg-gray-200"
              } transition-all duration-300`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-gray-600">
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
            >
              {currentStepName === "category" && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">
                        What type of senior resources are you exploring today?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
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
                      <FormLabel className="text-lg font-medium">
                        Please select your preferred location or area:
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
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
                      <FormLabel className="text-lg font-medium">
                        Who are you gathering resources for?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
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
                      <FormLabel className="text-lg font-medium">Select all that apply:</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {getSpecificNeedsOptions().map((need) => (
                          <FormField
                            key={need}
                            control={form.control}
                            name="specific_needs"
                            render={({ field }) => (
                              <FormItem
                                key={need}
                                className="flex items-center space-x-3 space-y-0 bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
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
                                <FormLabel className="font-normal cursor-pointer">
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
                      <FormLabel className="text-lg font-medium">
                        Additional notes or requirements (optional):
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any specific requirements or preferences..."
                          className="min-h-[150px] text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setDirection(-1);
                setCurrentStep((s) => Math.max(0, s - 1));
              }}
              disabled={currentStep === 0}
              className="w-32"
            >
              Previous
            </Button>
            <Button
              type={currentStep === STEPS.length - 1 ? "submit" : "button"}
              size="lg"
              onClick={() => {
                if (currentStep < STEPS.length - 1) {
                  setDirection(1);
                  setCurrentStep((s) => s + 1);
                }
              }}
              className="w-32"
            >
              {currentStep === STEPS.length - 1 ? "Find Help" : "Next"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}