import { storage } from '../storage';
import type { InsertFacility, Review, Photo } from '@shared/schema';

/**
 * This script creates a sample facility with rich Apify data
 * to test the display components
 */
async function importSampleFacility() {
  console.log('Creating sample facility with rich Apify data...');
  
  // Sample reviews
  const reviews: Review[] = [
    {
      author: "Jane Smith",
      date: "2023-11-15",
      rating: 5,
      text: "My mother has been a resident here for over a year and we couldn't be happier with the care and attention she receives. The staff is compassionate and responsive.",
      source: "Google"
    },
    {
      author: "Robert Johnson",
      date: "2023-09-22",
      rating: 4,
      text: "Beautiful facility with caring staff. The meals are excellent and there are plenty of activities for residents. Only reason for 4 stars is the occasional communication hiccup.",
      source: "Google"
    },
    {
      author: "Maria Garcia",
      date: "2023-10-05",
      rating: 5,
      text: "After touring several assisted living facilities, we chose this one for my father and have been very pleased. The staff knows him by name and the facility is always clean and inviting.",
      source: "Yelp"
    }
  ];
  
  // Sample photos
  const photos: Photo[] = [
    {
      url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop",
      caption: "Beautiful exterior with landscaped gardens",
      source: "Facility website"
    },
    {
      url: "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?q=80&w=2070&auto=format&fit=crop",
      caption: "Modern common area for residents",
      source: "Google"
    },
    {
      url: "https://images.unsplash.com/photo-1617850687395-620757383a55?q=80&w=2070&auto=format&fit=crop",
      caption: "Restaurant-style dining room",
      source: "Google"
    },
    {
      url: "https://images.unsplash.com/photo-1600573472590-6d258a561876?q=80&w=2070&auto=format&fit=crop",
      caption: "Well-appointed private suite",
      source: "Facility website"
    }
  ];
  
  // Sample facility with rich data
  const sampleFacility: InsertFacility = {
    name: "Limelight Assisted Living - Glencoe",
    type: "assisted_living",
    address: "123 Maple Street",
    city: "Littleton",
    state: "CO",
    zip: "80122",
    phone: "(303) 555-1234",
    email: "info@limelightliving.com",
    website: "https://www.limelightliving.com",
    description: "Limelight Assisted Living offers premium care in a home-like environment. Our Glencoe location provides 24/7 professional care, gourmet dining, and enriching activities in a beautiful setting with scenic mountain views.",
    amenities: [
      "24/7 Care Staff",
      "Chef-Prepared Meals",
      "Transportation Services",
      "Fitness Center",
      "Memory Care",
      "Housekeeping",
      "Medication Management",
      "Private Suites",
      "Social Activities",
      "Beauty Salon"
    ],
    latitude: "39.580746",
    longitude: "-105.015938",
    rating: "4.7",
    reviews_count: 27,
    reviews: reviews,
    photos: photos,
    last_updated: new Date()
  };
  
  try {
    // Check if facility already exists
    const existingFacilities = await storage.searchFacilities("Limelight Assisted Living");
    if (existingFacilities.length > 0) {
      console.log('Facility already exists, updating with sample data...');
      const updated = await storage.updateFacility(existingFacilities[0].id, sampleFacility);
      console.log(`Updated facility: ${updated?.name} (ID: ${updated?.id})`);
    } else {
      console.log('Creating new sample facility...');
      const newFacility = await storage.createFacility(sampleFacility);
      console.log(`Created facility: ${newFacility.name} (ID: ${newFacility.id})`);
    }
    
    // Create a second facility for comparison
    const secondFacility: InsertFacility = {
      name: "Lighthouse Assisted Living - Highland Park",
      type: "assisted_living",
      address: "456 Oak Avenue",
      city: "Denver",
      state: "CO",
      zip: "80209",
      phone: "(303) 555-5678",
      email: "contact@lighthouseal.com",
      website: "https://www.lighthouseal.com",
      description: "Lighthouse Assisted Living at Highland Park offers exceptional senior care in the heart of Denver. Our dedicated staff provides personalized assistance, engaging activities, and a vibrant community for seniors to thrive.",
      amenities: [
        "24-Hour Care",
        "Restaurant-Style Dining",
        "Weekly Housekeeping",
        "Community Events",
        "Private Apartments",
        "Outdoor Courtyard",
        "Transportation",
        "Wellness Programs"
      ],
      latitude: "39.712776",
      longitude: "-104.940107",
      rating: "4.5",
      reviews_count: 18,
      reviews: [
        {
          author: "Thomas Williams",
          date: "2023-12-04",
          rating: 5,
          text: "The staff at Lighthouse went above and beyond for my aunt. They're attentive, kind, and truly care about the residents.",
          source: "Google"
        },
        {
          author: "Patricia Davis",
          date: "2023-10-18",
          rating: 4,
          text: "Good facility with friendly staff. The food is excellent and there are plenty of activities. The only downside is that it can be a bit noisy sometimes.",
          source: "Yelp"
        }
      ],
      photos: [
        {
          url: "https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?q=80&w=2070&auto=format&fit=crop",
          caption: "Welcoming entrance",
          source: "Facility website"
        },
        {
          url: "https://images.unsplash.com/photo-1595079676340-1bdf4a6cbc1d?q=80&w=2070&auto=format&fit=crop",
          caption: "Comfortable dining area",
          source: "Google"
        }
      ],
      last_updated: new Date()
    };
    
    const existingSecondFacilities = await storage.searchFacilities("Lighthouse Assisted Living");
    if (existingSecondFacilities.length > 0) {
      console.log('Second facility already exists, updating with sample data...');
      const updated = await storage.updateFacility(existingSecondFacilities[0].id, secondFacility);
      console.log(`Updated facility: ${updated?.name} (ID: ${updated?.id})`);
    } else {
      console.log('Creating second sample facility...');
      const newFacility = await storage.createFacility(secondFacility);
      console.log(`Created facility: ${newFacility.name} (ID: ${newFacility.id})`);
    }
    
    console.log('Sample facilities created successfully!');
  } catch (error) {
    console.error('Error creating sample facilities:', error);
  }
}

// Run the import function
importSampleFacility()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in script:', error);
    process.exit(1);
  });
