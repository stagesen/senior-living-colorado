import { useParams } from "wouter";
import { CARE_TYPES } from "./CareTypesLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";

// Content for each care type
const CARE_TYPE_CONTENT = {
  "independent-living": {
    title: "Independent Living",
    description: "Independent living communities are designed for active seniors who want to enjoy a maintenance-free lifestyle while having access to amenities, activities, and a built-in social network.",
    features: [
      "Private apartments or homes",
      "Maintenance-free living",
      "Social activities and events",
      "Dining services",
      "Transportation services",
      "Fitness and wellness programs"
    ],
    benefits: [
      "Active, social lifestyle",
      "No home maintenance worries",
      "Security and peace of mind",
      "Access to amenities",
      "Community atmosphere"
    ],
    whoIsItFor: "Independent seniors who want to downsize or simplify their lifestyle while maintaining their independence.",
    whenToConsider: [
      "You want to free yourself from home maintenance",
      "You're looking for more social opportunities",
      "You want access to amenities and activities",
      "You're planning ahead for future care needs"
    ]
  },
  "assisted-living": {
    title: "Assisted Living",
    description: "Assisted living communities provide personal care services while promoting independence and an active lifestyle. Staff is available 24/7 to help with daily activities.",
    features: [
      "Personal care assistance",
      "Medication management",
      "Three meals daily",
      "Housekeeping services",
      "Social activities",
      "Transportation services"
    ],
    benefits: [
      "Personalized care support",
      "Maintenance-free living",
      "Social engagement",
      "Safety and security",
      "Access to healthcare services"
    ],
    whoIsItFor: "Seniors who need help with daily activities but want to maintain independence.",
    whenToConsider: [
      "You need help with daily activities",
      "You want a more manageable lifestyle",
      "You're looking for a supportive community",
      "Safety is becoming a concern"
    ]
  },
  "memory-care": {
    title: "Memory Care",
    description: "Memory care communities provide specialized care for seniors with Alzheimer's, dementia, and other memory-related conditions in a secure environment.",
    features: [
      "24/7 specialized care",
      "Secure environment",
      "Memory-enhancing activities",
      "Structured daily routine",
      "Specialized dining program",
      "Safety monitoring"
    ],
    benefits: [
      "Specialized memory support",
      "Safe, secure environment",
      "Engaged lifestyle",
      "Professional care team",
      "Family support services"
    ],
    whoIsItFor: "Seniors with Alzheimer's, dementia, or other memory-related conditions.",
    whenToConsider: [
      "Memory loss is affecting daily life",
      "Safety is a significant concern",
      "Caregiver stress is high",
      "Specialized care is needed"
    ]
  },
  "skilled-nursing": {
    title: "Skilled Nursing",
    description: "Skilled nursing facilities provide 24/7 medical care and rehabilitation services for seniors with complex medical needs or those recovering from surgery or illness.",
    features: [
      "24/7 nursing care",
      "Rehabilitation services",
      "Medical monitoring",
      "Specialized therapy",
      "Wound care",
      "Pain management"
    ],
    benefits: [
      "Professional medical care",
      "Rehabilitation support",
      "Coordinated care plans",
      "Medicare coverage eligible",
      "Family support services"
    ],
    whoIsItFor: "Seniors needing ongoing medical care or short-term rehabilitation.",
    whenToConsider: [
      "Complex medical needs require attention",
      "Rehabilitation is needed after surgery",
      "Long-term medical care is necessary",
      "Recovery from illness or injury"
    ]
  },
  "continuing-care": {
    title: "Continuing Care",
    description: "Continuing Care Retirement Communities (CCRCs) offer a full spectrum of care from independent living through skilled nursing, allowing residents to age in place.",
    features: [
      "Multiple levels of care",
      "Priority access to care",
      "Lifetime housing guarantee",
      "Comprehensive amenities",
      "Wellness programs",
      "Social activities"
    ],
    benefits: [
      "Age in place",
      "Predictable costs",
      "Priority access to care",
      "Community lifestyle",
      "Peace of mind"
    ],
    whoIsItFor: "Seniors planning for current and future care needs who want to remain in one community.",
    whenToConsider: [
      "You want to plan for future care needs",
      "You value having multiple care options",
      "You want to avoid future moves",
      "Financial planning is a priority"
    ]
  }
};

export default function CareTypePage() {
  const { type } = useParams();
  const content = CARE_TYPE_CONTENT[type as keyof typeof CARE_TYPE_CONTENT];
  
  if (!content) {
    return <div>Care type not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">{content.title}</h1>
        <p className="text-xl text-muted-foreground">{content.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Key Features</h2>
          <ul className="space-y-2">
            {content.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Benefits</h2>
          <ul className="space-y-2">
            {content.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Is This Right for You?</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Who is it for?</h3>
            <p className="text-muted-foreground">{content.whoIsItFor}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">When to Consider</h3>
            <ul className="space-y-2">
              {content.whenToConsider.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div className="flex justify-center pt-8">
        <Button size="lg">
          Find {content.title} Communities
        </Button>
      </div>
    </div>
  );
}
