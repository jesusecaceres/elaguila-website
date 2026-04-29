/**
 * Simple script to run the restaurantes mapping audit and generate truth matrix
 * This can be run in development to verify field mapping completeness
 */

import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { auditRestaurantMapping, printAuditReport } from "./restauranteMappingAudit";

// Create a sample draft with representative data for testing
const sampleDraft: RestauranteListingDraft = {
  // Required field
  draftListingId: "test-audit-123",
  
  // Identity
  businessName: "Test Restaurant",
  businessType: "restaurant",
  primaryCuisine: "mexican",
  secondaryCuisine: "american",
  additionalCuisines: ["italian"],
  shortSummary: "A test restaurant for audit",
  longDescription: "This is a detailed description of our test restaurant",
  cityCanonical: "San Jose",
  neighborhood: "Downtown",
  zipCode: "95110",
  priceLevel: "$$",
  languagesSpoken: ["es", "en"],
  
  // Operations
  serviceModes: ["dine_in", "takeout", "delivery"],
  dineIn: true,
  takeout: true,
  delivery: true,
  reservationsAvailable: true,
  movingVendor: false,
  homeBasedBusiness: false,
  cateringAvailable: true,
  eventFoodService: true,
  
  // Hours
  monday: { openTime: "09:00", closeTime: "22:00", closed: false },
  tuesday: { openTime: "09:00", closeTime: "22:00", closed: false },
  wednesday: { openTime: "09:00", closeTime: "22:00", closed: false },
  thursday: { openTime: "09:00", closeTime: "22:00", closed: false },
  friday: { openTime: "09:00", closeTime: "23:00", closed: false },
  saturday: { openTime: "10:00", closeTime: "23:00", closed: false },
  sunday: { openTime: "10:00", closeTime: "21:00", closed: false },
  specialHoursNote: "Closed on major holidays",
  
  // Contact
  websiteUrl: "https://example.com",
  phoneNumber: "4085551234",
  email: "test@example.com",
  whatsAppNumber: "4085555678",
  instagramUrl: "https://instagram.com/testrestaurant",
  facebookUrl: "https://facebook.com/testrestaurant",
  reservationUrl: "https://resy.com/testrestaurant",
  orderUrl: "https://order.example.com",
  menuUrl: "https://example.com/menu",
  menuFile: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A",
  
  // Location
  addressLine1: "123 Main St",
  addressLine2: "Suite 100",
  state: "CA",
  showExactAddress: true,
  
  // Media
  heroImage: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A",
  galleryImages: ["data:image/jpeg;base64,test1", "data:image/jpeg;base64,test2"],
  videoUrl: "https://youtube.com/watch?v=test",
  foodImages: ["data:image/jpeg;base64,food1"],
  interiorImages: ["data:image/jpeg;base64,interior1"],
  exteriorImages: ["data:image/jpeg;base64,exterior1"],
  
  // Featured dishes
  featuredDishes: [
    {
      title: "Tacos al Pastor",
      shortNote: "Traditional marinated pork",
      priceLabel: "$15",
      menuLink: "https://example.com/menu#tacos",
      image: "data:image/jpeg;base64,taco"
    },
    {
      title: "Enchiladas",
      shortNote: "Cheese and chicken",
      priceLabel: "$12",
      image: "data:image/jpeg;base64,enchilada"
    }
  ],
  
  // Highlights
  highlights: ["outdoor_seating", "family_friendly", "wifi"],
  
  // Stacks
  cateringEventsStack: {
    eventSizesSupported: ["25-75", "75-150"],
    bookingLeadTimeText: "Minimum 1 week",
    cateringInquiryUrl: "https://example.com/catering",
    cateringNote: "Minimum 20 people",
    serviceRadiusMiles: 25
  }
};

// Run the audit
export function runRestaurantMappingAudit(): void {
  console.log('Running Restaurantes Mapping Truth Matrix Audit...\n');
  
  const report = auditRestaurantMapping(sampleDraft);
  printAuditReport(report);
  
  // Also log any critical failures
  const criticalFailures = [
    ...report.identity.filter(f => !f.mappedToShell),
    ...report.contact.filter(f => !f.mappedToShell),
    ...report.operations.filter(f => !f.mappedToShell),
    ...report.hours.filter(f => !f.mappedToShell)
  ];
  
  if (criticalFailures.length > 0) {
    console.log('\n⚠️  CRITICAL MAPPING FAILURES:');
    criticalFailures.forEach(failure => {
      console.log(`- ${failure.fieldName}: Not properly mapped to shell`);
    });
  }
  
  console.log(`\nAudit complete. Success rate: ${report.summary.successRate.toFixed(1)}%`);
}

// Export for use in development or testing
export { sampleDraft };
