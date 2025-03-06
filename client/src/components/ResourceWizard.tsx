import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
import { Search, MapPin, Users } from "lucide-react";
import { type WizardFormData, wizardFormSchema } from "@shared/schema";

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
  self: "myself",
  parent_grandparent: "my parent/grandparent",
  spouse_partner: "my spouse/partner",
  friend_neighbor: "a friend/neighbor",
  client: "my client",
  other: "someone else"
};

export default function ResourceWizard() {
  const [, setLocation] = useLocation();

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: {
      specific_needs: [],
      notes: "",
    },
  });

  const onSubmit = (data: WizardFormData) => {
    const params = new URLSearchParams();

    // Only add parameters that have values
    if (data.category) {
      params.append("category", data.category);
    }

    if (data.location) {
      params.append("location", data.location);
    }

    if (data.specific_needs && data.specific_needs.length > 0) {
      params.append("needs", data.specific_needs.join(","));
    }

    // Add type parameter to indicate which tab should be active by default
    params.append("type", "facilities");

    // Debug logging
    console.log('ResourceWizard submitted with params:', {
      category: data.category,
      location: data.location,
      needs: data.specific_needs,
      params: params.toString()
    });

    setLocation(`/resources?${params.toString()}`);
  };

  const getSpecificNeedsOptions = () => {
    const category = form.watch("category");
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

  const category = form.watch("category");
  const location = form.watch("location");
  const forWhom = form.watch("for_whom");

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="text-lg md:text-xl leading-relaxed text-center md:text-left flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-2 md:gap-0">
            <span>I am looking for</span>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full md:w-[260px] h-12 inline-flex mx-2 bg-white border-input focus:ring-2 focus:ring-ring">
                      <SelectValue placeholder="select services" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px] bg-white">
                    {Object.entries(CATEGORY_OPTIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="cursor-pointer">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <span>in</span>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full md:w-[240px] h-12 inline-flex mx-2 bg-white border-input focus:ring-2 focus:ring-ring">
                      <SelectValue placeholder="select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px] bg-white">
                    {Object.entries(LOCATION_OPTIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="cursor-pointer">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <span>for</span>
            <FormField
              control={form.control}
              name="for_whom"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full md:w-[200px] h-12 inline-flex mx-2 bg-white border-input focus:ring-2 focus:ring-ring">
                      <SelectValue placeholder="select recipient" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px] bg-white">
                    {Object.entries(FOR_WHOM_OPTIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="cursor-pointer">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <span>.</span>
          </div>

          <AnimatePresence mode="wait">
            {category && location && forWhom && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 bg-white p-6 rounded-lg border border-border"
              >
                <FormField
                  control={form.control}
                  name="specific_needs"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-xl font-medium mb-3 block">
                        What specific services are you interested in?
                      </FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {getSpecificNeedsOptions().map((need) => (
                          <FormField
                            key={need}
                            control={form.control}
                            name="specific_needs"
                            render={({ field }) => (
                              <FormItem
                                key={need}
                                className="flex items-start space-x-3 space-y-0 bg-secondary/30 p-4 rounded-lg hover:bg-secondary/50 transition-colors"
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
                                    className="mt-0.5"
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xl font-medium mb-3 block">
                        Any additional requirements or preferences?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share any specific needs or preferences you have..."
                          className="min-h-[120px] text-base resize-none bg-white border-input focus:ring-2 focus:ring-ring"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-lg"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Find Resources
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Form>
    </div>
  );
}