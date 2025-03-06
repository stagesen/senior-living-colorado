import { useState, useEffect } from "react";
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
  const specificNeeds = form.watch("specific_needs");

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="text-lg leading-relaxed">
            <span>I am looking for </span>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-[260px] inline-flex mx-2">
                      <SelectValue placeholder="select services" />
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
              )}
            />
            <span> in </span>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-[240px] inline-flex mx-2">
                      <SelectValue placeholder="select location" />
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
              )}
            />
            <span> for </span>
            <FormField
              control={form.control}
              name="for_whom"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-[200px] inline-flex mx-2">
                      <SelectValue placeholder="select recipient" />
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
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="specific_needs"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">
                        Any additional requirements or preferences?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share any specific needs or preferences you have..."
                          className="min-h-[100px] text-base resize-none"
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
                    className="w-full"
                  >
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